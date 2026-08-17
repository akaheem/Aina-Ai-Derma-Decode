import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

/**
 * Springs a number up to `value`. Drive `value` from 0 -> target (e.g. when the
 * element scrolls into view) to get the count-up effect. Built on `motion`.
 */
export function AnimatedNumber({ value, className, springOptions }) {
  const spring = useSpring(0, springOptions);
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString("en-US")
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
