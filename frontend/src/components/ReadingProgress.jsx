import { useEffect, useState } from "react";

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10000, pointerEvents: "none", height: "4px" }}>
      {/* Progress bar track */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        height: "100%", width: `${progress}%`,
        background: "linear-gradient(90deg, #52ff1a, #00ffcc)",
        boxShadow: "0 0 10px #52ff1a, 0 0 4px #00ffcc",
        transition: "width 0.08s linear",
      }} />
    </div>
  );
}

export default ReadingProgress;
