"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  html: string;
  /** Intrinsic width of the design artboard. */
  width: number;
};

/**
 * Renders a converted design artboard. The designs are authored at a fixed
 * width, so we scale them down to fit narrower viewports and hand internal
 * link clicks to the Next.js router instead of reloading the page.
 */
export default function Artboard({ html, width }: Props) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const fit = () => {
      const available = host.parentElement?.clientWidth ?? window.innerWidth;
      const next = Math.min(1, available / width);
      setScale(next);
      setHeight(host.scrollHeight * next);
    };

    fit();
    window.addEventListener("resize", fit);

    // Fonts load after first paint and change the artboard's height.
    document.fonts?.ready.then(fit).catch(() => {});

    const observer = new ResizeObserver(fit);
    observer.observe(host);

    return () => {
      window.removeEventListener("resize", fit);
      observer.disconnect();
    };
  }, [width, html]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Let in-page anchors and external links behave normally.
      if (href.startsWith("#") || /^[a-z]+:/i.test(href)) return;
      if (anchor.target === "_blank") return;

      event.preventDefault();
      router.push(href);
    };

    host.addEventListener("click", onClick);
    return () => host.removeEventListener("click", onClick);
  }, [router]);

  return (
    <div className="artboard-viewport" style={{ height }}>
      <div
        ref={hostRef}
        className="artboard-scaler"
        style={{ width, transform: `scale(${scale})` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
