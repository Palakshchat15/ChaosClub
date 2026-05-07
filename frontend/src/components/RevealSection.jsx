import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/animations';

export default function RevealSection({ children, className = "" }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    
    gsap.fromTo(el, 
      { 
        clipPath: "inset(20% 10% 20% 10% round 30px)",
        opacity: 0,
        scale: 0.9
      },
      {
        clipPath: "inset(0% 0% 0% 0% round 0px)",
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          end: "top 40%",
          scrub: 1,
        }
      }
    );
  }, []);

  return (
    <div ref={sectionRef} className={className} style={{ willChange: "clip-path, opacity, transform" }}>
      {children}
    </div>
  );
}
