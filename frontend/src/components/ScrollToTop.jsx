import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // We try to find the global Lenis instance if it's available
    // or just use window.scrollTo for fallback.
    // However, since we initialized Lenis in SmoothScroll, we can just use window.scrollTo(0, 0)
    // and Lenis will intercept it if it's running.
    
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
