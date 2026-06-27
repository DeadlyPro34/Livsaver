import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function FloatingShapes() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      <motion.div
        animate={{
          x: mousePos.x * -20,
          y: mousePos.y * -20,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="absolute inset-0"
      >
        {/* Blob 1 */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-[#F0C040] rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.15]"
        />

        {/* Blob 2 */}
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -30, 0],
            rotate: [0, -15, 5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-[var(--color-brand-primary)] rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.1]"
        />

        {/* Blob 3 */}
        <motion.div
          animate={{
            y: [0, -50, 0],
            x: [0, 40, 0],
            rotate: [0, 20, -5, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[5%] left-[30%] w-[350px] h-[350px] bg-[var(--color-brand-dark)] rounded-full mix-blend-multiply filter blur-[90px] opacity-[0.05]"
        />
      </motion.div>
    </div>
  );
}
