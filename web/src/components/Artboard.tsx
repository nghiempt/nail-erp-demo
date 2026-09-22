"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  html: string;
  /**
   * Width the design was authored at. Used as the minimum the layout is
   * allowed to reflow to before we scale instead.
   */
  width: number;
};

export default function Artboard({ html, width }: Props) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  // The artboards are fluid down to MIN_WIDTH; below that the dense dashboard
  // layouts start to overlap, so we scale the whole page down instead.
  const MIN_WIDTH = Math.min(width, 1100);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const fit = () => {
      const available = host.parentElement?.clientWidth ?? window.innerWidth;
      const next = available >= MIN_WIDTH ? 1 : available / MIN_WIDTH;
      setScale(next);
      setHeight(next === 1 ? undefined : host.offsetHeight * next);
    };

    fit();
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit).catch(() => {});

    const observer = new ResizeObserver(fit);
    observer.observe(host);

    return () => {
      window.removeEventListener("resize", fit);
      observer.disconnect();
    };
  }, [MIN_WIDTH, html]);

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
    <div
      className="artboard-viewport"
      // While scaled the transform origin is the left edge, so centring the
      // flex item would shift the page off to one side.
      style={{ height, justifyContent: scale === 1 ? undefined : "flex-start" }}
    >
      <div
        ref={hostRef}
        className="artboard-scaler"
        style={{
          // Below the reflow floor the page holds its width and is scaled down
          // instead, so `flex` must not stretch it back out.
          ...(scale === 1
            ? null
            : {
                flex: "0 0 auto",
                width: MIN_WIDTH,
                transform: `scale(${scale})`,
              }),
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
