import { useState, useEffect } from "react";

/**
 * Hook that returns true when the viewport is at mobile width (≤768px).
 * Uses matchMedia for efficient, real-time tracking.
 */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth <= breakpoint
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);

    // Set initial value
    setIsMobile(mql.matches);

    // Modern API
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
