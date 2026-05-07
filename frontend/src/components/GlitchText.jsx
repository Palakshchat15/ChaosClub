import { useEffect, useState } from "react";

/**
 * Wraps any element. Periodically triggers a CSS glitch animation.
 * Works with nested children (no data-text attribute needed).
 */
function GlitchText({ children, className = "", style = {}, as: Tag = "span" }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timeout;
    function scheduleNext() {
      const delay = 3500 + Math.random() * 5000;
      timeout = setTimeout(() => {
        setActive(true);
        setTimeout(() => {
          setActive(false);
          scheduleNext();
        }, 450);
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Tag
      className={`glitch-text ${active ? "glitch-active" : ""} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

export default GlitchText;
