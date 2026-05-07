import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/animations";

export default function AnimatedNumber({ value, duration = 2, delay = 0 }) {
  const [currentValue, setCurrentValue] = useState(0);
  const ref = useRef(null);
  
  // Parse numeric value, ignoring non-digits
  const targetValue = parseInt(value.toString().replace(/[^0-9]/g, ""), 10) || 0;
  
  // Preserve prefix/suffix like "1,200+" -> "+", "1k" -> "k"
  const suffix = value.toString().replace(/[0-9,]/g, "");
  
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.floor(num));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let obj = { val: 0 };

    const tween = gsap.to(obj, {
      val: targetValue,
      duration: duration,
      delay: delay,
      ease: "power3.out",
      onUpdate: () => {
        setCurrentValue(obj.val);
      },
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
      }
    });

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
    };
  }, [targetValue, duration, delay]);

  return (
    <span ref={ref}>
      {formatNumber(currentValue)}{suffix}
    </span>
  );
}
