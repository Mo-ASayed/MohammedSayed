"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-driven flight corridor, pinned to the right-hand margin.
 *
 * Read it as a plan view — a flight-tracker lane running down the gutter rather
 * than a line cutting across the content. One inline SVG stretched to the
 * viewport (preserveAspectRatio="none", non-scaling strokes) plus a small
 * absolutely positioned aircraft mark riding the path. No WebGL, no 3D model,
 * no network request — the whole background costs a few kilobytes.
 */

const ROUTE =
  "M 906 88 C 882 230 930 350 906 500 C 888 620 932 720 904 820";

/** Path coordinates live in this square space and are stretched to the viewport. */
const VIEW = 1000;

/** Where the route ticks sit, as a fraction of total path length. */
const WAYPOINTS = [0.14, 0.4, 0.64, 0.88];

type Point = { x: number; y: number };

export function FlightPath() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const [ticks, setTicks] = useState<Point[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const route = routeRef.current;
    const trail = trailRef.current;
    const marker = markerRef.current;
    if (!wrap || !route || !trail || !marker) return;

    const total = route.getTotalLength();
    trail.style.strokeDasharray = `${total}`;

    setTicks(
      WAYPOINTS.map((fraction) => {
        const point = route.getPointAtLength(total * fraction);
        return { x: point.x, y: point.y };
      })
    );

    let width = wrap.clientWidth;
    let height = wrap.clientHeight;
    let travel = 1;

    const measure = () => {
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      travel = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    };

    const apply = (progress: number) => {
      const length = total * progress;
      trail.style.strokeDashoffset = `${total - length}`;

      const at = route.getPointAtLength(length);
      const ahead = route.getPointAtLength(Math.min(length + 5, total));
      const behind = route.getPointAtLength(Math.max(length - 5, 0));

      const scaleX = width / VIEW;
      const scaleY = height / VIEW;
      const angle =
        (Math.atan2((ahead.y - behind.y) * scaleY, (ahead.x - behind.x) * scaleX) * 180) / Math.PI;

      marker.style.transform = `translate3d(${at.x * scaleX}px, ${at.y * scaleY}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
      wrap.style.setProperty("--flight-progress", progress.toFixed(4));
      document.documentElement.style.setProperty("--page-progress", progress.toFixed(4));
      wrap.dataset.flightProgress = progress.toFixed(3);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    measure();

    // Static composition when the visitor asked for reduced motion.
    if (reduceMotion) {
      apply(0.55);
      const still = new ResizeObserver(() => {
        measure();
        apply(0.55);
      });
      still.observe(document.documentElement);
      return () => {
        still.disconnect();
        document.documentElement.style.removeProperty("--page-progress");
      };
    }

    let target = Math.min(Math.max(window.scrollY / travel, 0), 1);
    let current = target;
    let frame = 0;
    let running = true;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      current += (target - current) * (1 - Math.exp(-delta * 9));

      if (Math.abs(target - current) < 0.0002) {
        current = target;
        apply(current);
        running = false;
        return;
      }

      apply(current);
      frame = requestAnimationFrame(tick);
    };

    // The loop parks itself once the aircraft settles and only wakes on input.
    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = Math.min(Math.max(window.scrollY / travel, 0), 1);
      wake();
    };

    const observer = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    observer.observe(document.documentElement);
    window.addEventListener("scroll", onScroll, { passive: true });

    apply(current);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      document.documentElement.style.removeProperty("--page-progress");
    };
  }, []);

  return (
    <div className="flight-path" ref={wrapRef} aria-hidden="true">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id="flight-trail-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VIEW}>
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.45" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="1" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>

        <path ref={routeRef} className="flight-route" d={ROUTE} vectorEffect="non-scaling-stroke" />
        <path ref={trailRef} className="flight-trail" d={ROUTE} vectorEffect="non-scaling-stroke" />

        {ticks.map((tick, index) => (
          <circle
            key={`${tick.x}-${tick.y}`}
            className="flight-waypoint"
            cx={tick.x}
            cy={tick.y}
            r="4"
            vectorEffect="non-scaling-stroke"
            style={{ "--waypoint-at": WAYPOINTS[index] } as React.CSSProperties}
          />
        ))}
      </svg>

      <div className="flight-marker" ref={markerRef}>
        <svg viewBox="-24 -14 48 28" focusable="false">
          <path d="M 20 0 C 14 -1.6 6 -2.4 0 -2.7 L -6 -12 L -11 -12 L -8.5 -2.5 L -14 -2.2 L -18 -7 L -21 -7 L -19.4 -1.2 L -21.6 0 L -19.4 1.2 L -21 7 L -18 7 L -14 2.2 L -8.5 2.5 L -11 12 L -6 12 L 0 2.7 C 6 2.4 14 1.6 20 0 Z" />
        </svg>
      </div>
    </div>
  );
}
