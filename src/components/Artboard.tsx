"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  html: string;
  /** Width the design was authored at. */
  width: number;
  /** Identifies the page to the responsive stylesheet. */
  name?: string;
};

/**
 * Renders a converted design artboard.
 *
 * At or above the design width the markup is shown exactly as drawn. Below it
 * `responsive.css` reflows the shell — the sidebar becomes a drawer, fixed
 * side panels wrap, grids collapse to one column and tables scroll. That
 * switch is driven entirely by media queries so the correct layout is there
 * on first paint; this component only owns the drawer's open state.
 */
export default function Artboard({ html, width, name }: Props) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = useCallback(() => setNavOpen(false), []);

  // Close the drawer once the viewport grows back past the design width.
  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${width}px)`);
    const sync = () => {
      if (query.matches) setNavOpen(false);
    };

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [width]);

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
      setNavOpen(false);
      router.push(href);
    };

    host.addEventListener("click", onClick);
    return () => host.removeEventListener("click", onClick);
  }, [router]);

  return (
    <div className="artboard-viewport" data-nav={navOpen ? "open" : undefined}>
      {/* Both are revealed by `responsive.css` only below the design width. */}
      <button
        type="button"
        className="artboard-navtoggle"
        aria-label={navOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((open) => !open)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {navOpen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      <div className="artboard-scrim" onClick={closeNav} />
      <div
        ref={hostRef}
        className="artboard-scaler"
        data-artboard={name}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
