/**
 * Reusable GSAP animation utilities for ChaosClub.
 * Import and call these inside useEffect hooks in your components.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animate a hero element: clip-path wipe + fade up.
 * @param {string|Element} target - CSS selector or DOM element
 * @param {number} delay - optional delay in seconds
 */
export function animateHero(target, delay = 0) {
  gsap.fromTo(
    target,
    { opacity: 0, y: 60, skewY: 3 },
    {
      opacity: 1,
      y: 0,
      skewY: 0,
      duration: 1,
      delay,
      ease: "power4.out",
    }
  );
}

/**
 * Stagger-animate a list of elements as they enter the viewport.
 * @param {string} targets - CSS selector for multiple elements
 * @param {object} options
 */
export function animateOnScroll(targets, options = {}) {
  gsap.fromTo(
    targets,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: options.duration || 0.7,
      ease: "power3.out",
      stagger: options.stagger || 0.1,
      scrollTrigger: {
        trigger: options.trigger || targets,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    }
  );
}

/**
 * Slide in from the left on scroll.
 * @param {string} target
 */
export function slideInLeft(target) {
  gsap.fromTo(
    target,
    { opacity: 0, x: -60 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: target,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    }
  );
}

/**
 * Animate a neon green underline drawing itself under a target.
 * @param {string} target
 */
export function glowPulse(target, delay = 0) {
  gsap.fromTo(
    target,
    { textShadow: "0 0 0px #52ff1a" },
    {
      textShadow: "0 0 20px #52ff1a, 0 0 40px #52ff1a",
      duration: 1.2,
      delay,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    }
  );
}

/**
 * Count up a number from 0 to final value.
 * @param {Element} el - DOM element whose textContent will be animated
 * @param {number} endVal - final number
 */
export function countUp(el, endVal) {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: endVal,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = Math.round(obj.val) + " pts";
    },
    scrollTrigger: {
      trigger: el,
      start: "top 90%",
      toggleActions: "play none none none",
    },
  });
}

export { gsap, ScrollTrigger };
