import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "../lib/animations";

function PageTransition() {
  const containerRef = useRef(null);
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    
    const shutters = containerRef.current.children;
    gsap.timeline()
      .set(containerRef.current, { display: "flex" })
      .set(shutters, { scaleY: 0, transformOrigin: "bottom center" })
      .to(shutters, {
        scaleY: 1,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.inOut",
      })
      .set(shutters, { transformOrigin: "top center" })
      .to(shutters, {
        scaleY: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.inOut",
        onComplete: () => gsap.set(containerRef.current, { display: "none" }),
      });
  }, [location.pathname]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9998,
        pointerEvents: "none",
        display: "none",
        flexDirection: "row",
      }}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "100%",
            background: "linear-gradient(180deg, #52ff1a 0%, #1aff8a 100%)",
            transformOrigin: "bottom center",
            transform: "scaleY(0)",
          }}
        />
      ))}
    </div>
  );
}

export default PageTransition;
