import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/animations";

const CHARS = "!<>-_\\\\/[]{}—=+*^?#________";

export default function ScrambleText({ text, speed = 0.5, delay = 0, className = "" }) {
  const [displayText, setDisplayText] = useState(text.replace(/./g, " "));
  const ref = useRef(null);

  useEffect(() => {
    let obj = { p: 0 };
    const original = text;
    const length = original.length;

    const tween = gsap.to(obj, {
      p: length,
      duration: speed * (length / 10),
      delay: delay,
      ease: "power2.inOut",
      onUpdate: () => {
        const progress = Math.floor(obj.p);
        let current = "";
        for (let i = 0; i < length; i++) {
          if (i < progress) {
            current += original[i];
          } else if (original[i] === " ") {
            current += " ";
          } else {
            current += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplayText(current);
      }
    });

    return () => tween.kill();
  }, [text, speed, delay]);

  return <span ref={ref} className={className}>{displayText}</span>;
}
