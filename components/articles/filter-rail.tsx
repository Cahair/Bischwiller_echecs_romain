"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * On phones the category filters are a horizontal scroll rail. After following a
 * filter link the active chip can sit off-screen, so centre it once on mount.
 */
export function FilterRail({ className, children }: { className?: string; children: ReactNode }) {
  const rail = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = rail.current;
    const active = element?.querySelector<HTMLElement>("[aria-current]");
    if (!element || !active || element.scrollWidth <= element.clientWidth) return;
    const railBox = element.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    element.scrollLeft += activeBox.left - railBox.left - (railBox.width - activeBox.width) / 2;
  }, []);

  return <nav ref={rail} className={className} aria-label="Filtrer les actualités">{children}</nav>;
}
