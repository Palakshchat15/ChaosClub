import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/animations";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    // Center the dot on the cursor
    gsap.set(el, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(el, "x", { duration: 0.15, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.15, ease: "power3" });

    const onMove = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      
      // Check if hovering over clickable element
      const target = e.target;
      const isClickable = target.tagName.toLowerCase() === 'a' || 
                          target.tagName.toLowerCase() === 'button' ||
                          target.closest('a') || 
                          target.closest('button');
      
      setIsHovering(!!isClickable);
    };

    const onDown = () => {
      gsap.to(el, { scale: 0.8, duration: 0.1 });
    };

    const onUp = () => {
      gsap.to(el, { scale: isHovering ? 2.5 : 1, duration: 0.15 });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isHovering]);

  useEffect(() => {
    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        scale: isHovering ? 2.5 : 1,
        backgroundColor: isHovering ? "transparent" : "#52ff1a",
        border: isHovering ? "1px solid #52ff1a" : "none",
        duration: 0.2
      });
    }
  }, [isHovering]);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "12px",
        height: "12px",
        backgroundColor: "#52ff1a",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 99999,
        boxShadow: "0 0 10px #52ff1a, 0 0 20px rgba(82,255,26,0.5)",
      }}
    />
  );
}
