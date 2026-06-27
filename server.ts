import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";

function sanitize(input: string, maxLen = 300): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLen).replace(/[`\\]/g, "");
}

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50kb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again in a minute." },
});
app.use("/api/", apiLimiter);

// Lazy load or handle missing API key gracefully
function getGeminiClient(overrideKey?: string) {
  const apiKey = overrideKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in the Secrets panel, or configure it in Settings.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ── API ROUTES ──

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Task Prioritization
app.post("/api/prioritize", async (req, res) => {
  try {
    const { task, otherTasksContext } = req.body;
    if (!task) {
      return res.status(400).json({ error: "Task data is required" });
    }

    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);
    const hoursToDeadline = Math.round((new Date(task.deadline).getTime() - Date.now()) / (3600 * 1000));

    const prompt = `You are a sharp, empathetic productivity AI coach. Analyze the following newly added task and prioritize it appropriately.
  
New Task Details:
- Name: "${sanitize(task.name)}"
- Category: "${sanitize(task.category)}"
- Deadline: "${new Date(task.deadline).toLocaleString()}" (approx. ${hoursToDeadline} hours from now)
- Estimated Time: "${task.estimatedTime}"
- Notes/Context: "${sanitize(task.notes || "None")}"

Other Tasks context:
${otherTasksContext || "None"}

Please decide on a priority level ("critical", "high", "medium", or "low"), a "riskScore" from 0-100 indicating probability of missing the deadline (e.g. critical + <6h = 90+, high + <12h = 70-89), and provide a brief, actionable, and encouraging insight (max 1 sentence) as "aiNote", along with a "suggestedStart" recommendation (e.g. "Start within 2 hours", "Plan for tomorrow morning", etc.).
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: "The priority level: critical, high, medium, or low",
            },
            riskScore: {
              type: Type.NUMBER,
              description: "A risk score from 0-100 indicating probability of missing the deadline based on urgency and priority (e.g., critical + <6h = 90+, high + <12h = 70-89).",
            },
            aiNote: {
              type: Type.STRING,
              description: "One highly actionable, punchy, encouraging sentence targeting this task's deadline and estimated time.",
            },
            suggestedStart: {
              type: Type.STRING,
              description: "An exact suggestion of when the user should start this task (e.g., 'Start tonight', 'Start in 2 hours').",
            },
          },
          required: ["priority", "riskScore", "aiNote", "suggestedStart"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    if (error.message && (error.message.includes("429") || error.message.includes("Quota"))) {
      const isCustomKey = !!req.headers["x-gemini-api-key"];
      const aiNote = isCustomKey 
        ? "Your custom API key has exceeded its quota or has limits disabled. Please check your Google Cloud Billing."
        : "It looks like our AI is taking a quick breather. Treat this task as medium priority for now.";
      return res.json({
        priority: "medium",
        riskScore: 50,
        aiNote: aiNote,
        suggestedStart: "Whenever you have time"
      });
    }
    console.error("AI Prioritize Error:", error);
    res.status(500).json({ error: "Failed to prioritize task. Please try again." });
  }
});

// AI Schedule Generator
app.post("/api/schedule", async (req, res) => {
  try {
    const { tasks, energyProfile } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "A list of tasks is required" });
    }

    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);
    const tasksContext = tasks
      .map(
        (t, idx) =>
          `${idx + 1}. [ID: ${t.id}] "${t.name}" | Category: ${t.category} | Deadline: ${new Date(t.deadline).toLocaleString()} | Est: ${t.estimatedTime} | Priority: ${t.priority}`
      )
      .join("\n");

    const energyContext = energyProfile ? 
      `User's Daily Energy Curve (0-100): Morning: ${energyProfile.morning}, Afternoon: ${energyProfile.afternoon}, Evening: ${energyProfile.evening}.` 
      : "No specific energy profile provided.";

    const prompt = `You are an expert time-management AI. Generate a beautifully structured, highly optimized daily schedule starting from 9:00 AM.
Consider task priorities, estimated durations, and category grouping to minimize context switching. 
CRITICAL: You MUST use the user's energy profile to do "Energy-Based Scheduling". Place demanding/critical tasks during peak energy hours and easy/admin tasks during low energy hours.
${energyContext}
Include deep focus blocks for "critical" or "high" priority tasks, short or long breaks, and administrative blocks.
If a block corresponds to a specific task, you MUST include its ID in the taskId field.

Pending Tasks list:
${tasksContext || "No pending tasks."}

Current Date/Time: ${new Date().toLocaleString()}

Generate a list of schedule entries.
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A motivating 2-sentence summary explaining the design logic of this schedule.",
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.NUMBER, description: "The integer ID of the task this block is for, if applicable." },
                  time: { type: Type.STRING, description: "Start time, e.g. '09:00 AM' or '11:15 AM'" },
                  task: { type: Type.STRING, description: "Title of block (e.g., specific task name, 'Short Break', 'Deep Work Block')" },
                  duration: { type: Type.STRING, description: "Duration of block, e.g., '25 min', '1 hour'" },
                  type: { type: Type.STRING, description: "One of: focus, break, admin" },
                  color: { type: Type.STRING, description: "A highly muted, editorial aesthetic hex color code (e.g., #1A1A1A, #E5E1D8, #D1CDC1, #F3F1EB, #8A8A8A, #333333)" },
                  tip: { type: Type.STRING, description: "A highly relevant micro-tip for this time block (max 10 words)" },
                },
                required: ["time", "task", "duration", "type", "color", "tip"],
              },
            },
          },
          required: ["summary", "schedule"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    if (error.message && (error.message.includes("429") || error.message.includes("Quota"))) {
      const isCustomKey = !!req.headers["x-gemini-api-key"];
      const summary = isCustomKey
        ? "Your custom API key has exceeded its quota. Please check your billing. Here is a basic placeholder template."
        : "Our AI schedule builder is currently resting. Here is a basic placeholder template to keep you going.";
      return res.json({
        summary: summary,
        schedule: [
          { time: "09:00 AM", task: "Review Tasks", duration: "15 min", type: "admin", color: "#4C1D95", tip: "Plan your day manually for now." },
          { time: "09:15 AM", task: "Deep Work Session", duration: "1 hour", type: "focus", color: "#9333EA", tip: "Tackle your biggest task first." }
        ]
      });
    }
    console.error("AI Schedule Error:", error);
    res.status(500).json({ error: "Failed to generate schedule. Please try again." });
  }
});

// AI Habit Insights
app.post("/api/habit-insights", async (req, res) => {
  try {
    const { habits } = req.body;
    if (!habits || !Array.isArray(habits)) {
      return res.status(400).json({ error: "Habits data is required" });
    }

    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);
    const habitSummary = habits
      .map((h) => `- ${h.name}: ${h.days.filter((d: number) => d === 1).length}/7 days completed this week, current streak: ${h.streak}`)
      .join("\n");

    const prompt = `You are an elite habit formation and consistency coach.
Below is the user's habit tracker log for this week:
${habitSummary || "No habits listed yet."}

Please analyze this habit data and provide 3 highly personalized, encouraging, and actionable insights. 
Reference their habit names, praise their consistency, and offer extremely practical hacks to keep streaks alive (e.g., temptation bundling, micro-habits, environment design).
Keep your tone warm, deeply motivating, and scientific (James Clear Atomic Habits style).
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 3 highly inspiring and specific bullet-point insights.",
            },
          },
          required: ["insights"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    if (error.message && (error.message.includes("429") || error.message.includes("Quota"))) {
      const isCustomKey = !!req.headers["x-gemini-api-key"];
      return res.json({
        insights: [
          isCustomKey ? "Your custom API key has exceeded its quota. Please check your billing." : "Consistency is key! Even if the AI is resting, your streak shouldn't stop.",
          "Try temptation bundling: link a habit you need to do with one you want to do.",
          "Keep your environment clear of distractions to maintain focus."
        ]
      });
    }
    console.error("AI Habit Insights Error:", error);
    res.status(500).json({ error: "Failed to analyze habits. Please try again." });
  }
});

// AI Focus Tip
app.post("/api/focus-tip", async (req, res) => {
  try {
    const { taskName, mood } = req.body;
    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);

    const moodContext = mood ? `The user is currently feeling: ${mood}. Tailor the tip to match or improve this mood (e.g. if anxious, a calming/breathing tip; if energetic, a fast dive-in tip).` : "";

    const prompt = `Provide one ultra-specific, non-generic, and highly actionable cognitive trick/focus tip to help a developer or student complete a 25-minute deep focus session specifically on this task: "${sanitize(taskName || "General Focus Work")}".
${moodContext}
The tip must be highly practical and immediately implementable (e.g., parkinson's law, visual boundaries, chunking, or physical triggers). Max 2 sentences. 
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: { type: Type.STRING, description: "The ultra-specific and actionable focus tip." },
          },
          required: ["tip"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    if (error.message && (error.message.includes("429") || error.message.includes("Quota"))) {
      const isCustomKey = !!req.headers["x-gemini-api-key"];
      return res.json({ tip: isCustomKey ? "API Key Quota Exceeded. Please check your Google Cloud Billing." : "Put your phone in another room, set a timer for 25 minutes, and dive in." });
    }
    console.error("AI Focus Tip Error:", error);
    res.status(500).json({ error: "Failed to get focus tip. Please try again." });
  }
});

// AI Chat Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatHistory, tasksContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    const safeMessage = sanitize(message, 500);
    const trimmedHistory = (chatHistory || []).slice(-10);

    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);

    // Reconstruct the conversation context
    const historyPrompt = trimmedHistory
      .map((m: any) => `${m.role === "user" ? "User" : "LifeSaver AI"}: ${sanitize(m.text, 300)}`)
      .join("\n");

    const prompt = `You are LifeSaver AI, a sharp, incredibly warm, and motivating productivity assistant. 
Current Date/Time is: ${new Date().toLocaleString()}.

Here is the user's current task list context:
${tasksContext || "No tasks currently listed."}

Previous Conversation History:
${historyPrompt || "No history yet."}

User's Input: "${safeMessage}"

Respond to the user with a specific, friendly, and practical reply. Keep it to 2-4 sentences.
Always refer to actual task names from their list where relevant. Offer concrete strategies or a gentle motivational push. 
Be exceptionally helpful and focus purely on getting things done. Do not mention system details.
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "Your empathetic, crisp, and actionable response." },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Type of action (e.g., 'create_task', 'start_focus', 'suggest_schedule')" },
                  payload: { type: Type.STRING, description: "JSON stringified payload for the action" }
                }
              },
              description: "List of actions to perform based on user input"
            }
          },
          required: ["reply"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    if (error.message && (error.message.includes("429") || error.message.includes("Quota"))) {
      const isCustomKey = !!req.headers["x-gemini-api-key"];
      const customKeyMsg = isCustomKey 
        ? "Your custom API key has exceeded its quota or has limits disabled. Please check your Google Cloud Billing and Gemini API limits."
        : "The shared AI is currently resting due to high traffic. Please try again shortly or use your own API key in Settings.";
      
      return res.json({ reply: customKeyMsg });
    }
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to process message. Please try again." });
  }
});

// Burnout Score Prediction
app.post("/api/burnout-score", async (req, res) => {
  try {
    const { tasks, focusSessions, habits } = req.body;
    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);
    
    let overdueCount = 0;
    const now = Date.now();
    tasks.forEach((t: any) => {
      if (!t.completed && new Date(t.deadline).getTime() < now) overdueCount++;
    });

    const context = `
Overdue tasks: ${overdueCount}
Recent focus sessions count: ${focusSessions?.length || 0}
Habits missed lately: ${habits?.filter((h: any) => h.days[new Date().getDay()] === 0).length || 0}
    `;

    const prompt = `Analyze this user's data to predict their burnout risk score.
${context}
Give a burnout score from 0-100 (where 100 is extreme burnout risk) and a short 2-line recommendation.
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "0-100 score" },
            recommendation: { type: Type.STRING, description: "2-line recommendation" }
          },
          required: ["score", "recommendation"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch(e) {
    res.json({ score: 50, recommendation: "Take a break if you feel overwhelmed. AI is resting." });
  }
});

// Procrastination Reason
app.post("/api/procrastination-reason", async (req, res) => {
  try {
    const { task } = req.body;
    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);
    
    const prompt = `The user has missed the deadline for this task multiple times (missed count: ${task.missedDeadlineCount || 2}).
Task: ${sanitize(task.name)}
Est: ${sanitize(String(task.estimatedTime || ""))}
Notes: ${sanitize(task.notes || "None")}

Please ask why this is being postponed and provide a brief actionable breakdown of why they might be procrastinating (e.g. task too big, unclear first step) and what to do.
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING, description: "The breakdown of why they might be procrastinating and how to fix it." }
          },
          required: ["reasoning"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch(e) {
    res.json({ reasoning: "This task seems tough. Try breaking it down into a 5-minute micro-task to build momentum." });
  }
});

// Weekly AI Debrief
app.post("/api/weekly-debrief", async (req, res) => {
  try {
    const { tasks, habits } = req.body;
    const ai = getGeminiClient(req.headers["x-gemini-api-key"] as string);
    
    const context = `
Tasks completed: ${tasks.filter((t: any) => t.completed).length}
Tasks overdue/missed: ${tasks.filter((t: any) => !t.completed && new Date(t.deadline).getTime() < Date.now()).length}
Habit streaks average: ${habits.length ? (habits.reduce((acc: number, h: any) => acc + h.streak, 0) / habits.length).toFixed(1) : 0}
    `;

    const prompt = `You are a tough but fair productivity coach. It's the end of the week. Look at the user's data:
${context}
Give an honest debrief. What pattern do you see? What went wrong or right? 
Suggest exactly 3 specific, actionable changes for next week.
Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            debriefText: { type: Type.STRING, description: "The honest debrief overview." },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable suggestions." }
          },
          required: ["debriefText", "suggestions"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch(e) {
    res.json({ debriefText: "You did your best this week. Use the weekend to recharge.", suggestions: ["Plan Monday on Sunday night", "Start smaller with habits", "Don't skip focus sessions"] });
  }
});

// ── VITE / FRONTEND ASSET SERVING ──

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
