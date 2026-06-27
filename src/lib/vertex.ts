import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task, ChatMessage } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function sanitize(input: string, maxLen = 300): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLen).replace(/[`\\]/g, "");
}

// Get the model configured for JSON output
const getJsonModel = () => {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
};

export async function getPrioritizedTask(task: any, otherTasksContext: string) {
  try {
    const prompt = `You are an elite productivity coach and AI task manager. 
Analyze this new task against the user's existing workload and assign it a priority level and risk score.

Existing Workload Context:
${otherTasksContext || "No other pending tasks."}

New Task to Analyze:
Title: "${sanitize(task.name)}"
Category: ${sanitize(task.category)}
Deadline: ${new Date(task.deadline).toLocaleString()}
Est. Time: ${sanitize(String(task.estimatedTime || "unknown"))}

Return ONLY JSON with these exact fields:
{ "priority": "low|medium|high|critical", "riskScore": 0-100, "aiNote": "brief 1-sentence note", "suggestedStart": "when to start" }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return {
      priority: "medium",
      riskScore: 50,
      aiNote: "It looks like our AI is taking a quick breather. Treat this task as medium priority for now.",
      suggestedStart: "Whenever you have time"
    };
  }
}

export async function getSchedule(tasks: Task[], energyProfile: any) {
  try {
    const tasksContext = tasks
      .map((t, idx) => `${idx + 1}. [ID: ${t.id}] "${t.name}" | Category: ${t.category} | Deadline: ${new Date(t.deadline).toLocaleString()} | Est: ${t.estimatedTime} | Priority: ${t.priority}`)
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

Generate a list of schedule entries. Return ONLY JSON with this structure:
{ "summary": "motivating 2-sentence summary", "schedule": [{ "taskId": number_or_null, "time": "09:00 AM", "task": "title", "duration": "25 min", "type": "focus|break|admin", "color": "#hexcode", "tip": "micro-tip max 10 words" }] }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return {
      summary: "Our AI schedule builder is currently resting. Here is a basic placeholder template to keep you going.",
      schedule: [
        { time: "09:00 AM", task: "Review Tasks", duration: "15 min", type: "admin", color: "#4C1D95", tip: "Plan your day manually for now." },
        { time: "09:15 AM", task: "Deep Work Session", duration: "1 hour", type: "focus", color: "#9333EA", tip: "Tackle your biggest task first." }
      ]
    };
  }
}

export async function getHabitInsights(habits: any[]) {
  try {
    const habitSummary = habits
      .map((h) => `- ${h.name}: ${h.days.filter((d: number) => d === 1).length}/7 days completed this week, current streak: ${h.streak}`)
      .join("\n");

    const prompt = `You are an elite habit formation and consistency coach.
Below is the user's habit tracker log for this week:
${habitSummary || "No habits listed yet."}

Please analyze this habit data and provide 3 highly personalized, encouraging, and actionable insights. 
Reference their habit names, praise their consistency, and offer extremely practical hacks to keep streaks alive (e.g., temptation bundling, micro-habits, environment design).
Keep your tone warm, deeply motivating, and scientific (James Clear Atomic Habits style).
Return ONLY JSON with this structure:
{ "insights": ["insight1", "insight2", "insight3"] }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return {
      insights: [
        "Consistency is key! Even if the AI is resting, your streak shouldn't stop.",
        "Try temptation bundling: link a habit you need to do with one you want to do.",
        "Keep your environment clear of distractions to maintain focus."
      ]
    };
  }
}

export async function getFocusTip(taskName: string, mood: string) {
  try {
    const moodContext = mood ? `The user is currently feeling: ${mood}. Tailor the tip to match or improve this mood.` : "";
    const prompt = `Provide one ultra-specific, non-generic, and highly actionable cognitive trick/focus tip to help a developer or student complete a 25-minute deep focus session specifically on this task: "${sanitize(taskName || "General Focus Work")}".
${moodContext}
The tip must be highly practical and immediately implementable. Max 2 sentences. Return ONLY JSON:
{ "tip": "your tip here" }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return { tip: "Put your phone in another room, set a timer for 25 minutes, and dive in." };
  }
}

export async function getChatReply(message: string, chatHistory: ChatMessage[], tasksContext: string) {
  try {
    const safeMessage = sanitize(message, 500);
    const trimmedHistory = (chatHistory || []).slice(-10);

    const historyPrompt = trimmedHistory
      .map((m: any) => `${m.role === "user" ? "User" : "LifeSaver AI"}: ${sanitize(m.text || m.content, 300)}`)
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
Return ONLY JSON: { "reply": "your response", "actions": [] }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return { reply: "The shared AI is currently resting. Please try again shortly." };
  }
}

export async function getBurnoutScore(tasks: Task[], focusSessions: any[], habits: any[]) {
  try {
    let overdueCount = 0;
    const now = Date.now();
    tasks.forEach((t) => {
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
Return ONLY JSON: { "score": number, "recommendation": "text" }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return { score: 50, recommendation: "Take a break if you feel overwhelmed. AI is resting." };
  }
}

export async function getProcrastinationReason(task: any) {
  try {
    const prompt = `The user has missed the deadline for this task multiple times (missed count: ${task.missedDeadlineCount || 2}).
Task: ${sanitize(task.name)}
Est: ${sanitize(String(task.estimatedTime || ""))}
Notes: ${sanitize(task.notes || "None")}

Please ask why this is being postponed and provide a brief actionable breakdown of why they might be procrastinating (e.g. task too big, unclear first step) and what to do.
Return ONLY JSON: { "reasoning": "your analysis" }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return { reasoning: "This task seems tough. Try breaking it down into a 5-minute micro-task to build momentum." };
  }
}

export async function getWeeklyDebrief(tasks: Task[], habits: any[]) {
  try {
    const context = `
Tasks completed: ${tasks.filter((t: any) => t.completed).length}
Tasks overdue/missed: ${tasks.filter((t: any) => !t.completed && new Date(t.deadline).getTime() < Date.now()).length}
Habit streaks average: ${habits.length ? (habits.reduce((acc: number, h: any) => acc + h.streak, 0) / habits.length).toFixed(1) : 0}
    `;

    const prompt = `You are a tough but fair productivity coach. It's the end of the week. Look at the user's data:
${context}
Give an honest debrief. What pattern do you see? What went wrong or right? 
Suggest exactly 3 specific, actionable changes for next week.
Return ONLY JSON: { "debriefText": "your debrief", "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }`;

    const model = getJsonModel();
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error(error);
    return { debriefText: "You did your best this week. Use the weekend to recharge.", suggestions: ["Plan Monday on Sunday night", "Start smaller with habits", "Don't skip focus sessions"] };
  }
}
