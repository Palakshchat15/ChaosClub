import { useEffect } from "react";

/**
 * Attaches a ripple effect to all .btn elements globally.
 */
function RippleEffect() {
  useEffect(() => {
    function handleClick(e) {
      const btn = e.target.closest(".btn");
      if (!btn) return;

      const ripple = document.createElement("span");
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position:absolute; border-radius:50%;
        width:${size}px; height:${size}px;
        left:${x}px; top:${y}px;
        background: rgba(82,255,26,0.35);
        transform: scale(0); pointer-events:none;
        animation: ripple-expand 0.55s ease-out forwards;
      `;

      btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

export default RippleEffect;
