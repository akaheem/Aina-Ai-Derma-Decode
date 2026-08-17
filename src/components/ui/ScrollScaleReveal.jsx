import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Scroll-linked scale + fade reveal. As the element scrolls into view its
 * content grows from `startScale` to full size and fades in. Honors
 * prefers-reduced-motion (renders static).
 */
export function ScrollScaleReveal({ children, className = "", startScale = 0.84 }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [startScale, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [0.35, 1]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={reduceMotion ? undefined : { scale, opacity }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
