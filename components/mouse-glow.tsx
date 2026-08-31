"use client";

import { useEffect } from "react";

export default function MouseGlow() {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      document.documentElement.style.setProperty(
        "--mouse-x",
        `${event.clientX}px`
      );

      document.documentElement.style.setProperty(
        "--mouse-y",
        `${event.clientY}px`
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <div className="mouse-glow" />;
}
