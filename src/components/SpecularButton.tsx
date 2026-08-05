"use client";

import { useEffect, useRef, type CSSProperties, type MouseEventHandler, type ReactNode } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import "./SpecularButton.css";

const padding = 20;
const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const fragment = `#version 300 es
precision highp float;
uniform vec2 uCenter, uHalfSize;
uniform float uRadius, uAngle, uPx, uIntensity, uShineSize, uShineFade, uThickness, uBaseWidth;
uniform vec3 uLineColor, uBaseColor;
out vec4 fragColor;
float roundedRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedRect(p, uHalfSize, uRadius);
  vec2 light = vec2(cos(uAngle), sin(uAngle));
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;
  vec2 normal = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(normal, light)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float x = d / (uThickness + 1e-6);
  float line = exp(-mix(1.0, 1.6, smoothstep(0.0, 1.5, x)) * x * x);
  float clampEdge = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float highlight = line * rim * clampEdge * uIntensity;
  vec3 color = uBaseColor * base + uLineColor * highlight;
  fragColor = vec4(color, clamp(base + highlight, 0.0, 1.0));
}`;

type SpecularButtonProps = {
  children: ReactNode;
  href?: string;
  size?: "sm" | "md" | "lg";
  radius?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function SpecularButton({
  children, href, size = "md", radius = 8, textColor = "#f5fbfa", lineColor = "#ffffff",
  baseColor = "#37514f", intensity = 1.2, shineSize = 12, shineFade = 38, thickness = 1,
  speed = 0.35, followMouse = true, proximity = 220, autoAnimate = false, className = "", onClick
}: SpecularButtonProps) {
  const elementRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const effectRef = useRef<HTMLSpanElement>(null);
  const propsRef = useRef({ radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, followMouse, proximity, autoAnimate });
  propsRef.current = { radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, followMouse, proximity, autoAnimate };

  useEffect(() => {
    const element = elementRef.current;
    const effect = effectRef.current;
    if (!element || !effect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        uCenter: { value: [0, 0] }, uHalfSize: { value: [1, 1] }, uRadius: { value: 0 }, uAngle: { value: 2.4 },
        uPx: { value: dpr }, uLineColor: { value: [1, 1, 1] }, uBaseColor: { value: [.2, .3, .3] },
        uIntensity: { value: 1 }, uShineSize: { value: .17 }, uShineFade: { value: .7 },
        uThickness: { value: 1 }, uBaseWidth: { value: dpr }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });
    effect.appendChild(gl.canvas);
    const measured = { width: 1, height: 1 };
    const resize = () => {
      const rect = element.getBoundingClientRect();
      measured.width = rect.width;
      measured.height = rect.height;
      renderer.setSize(rect.width + padding * 2, rect.height + padding * 2);
      program.uniforms.uCenter.value = [(padding + rect.width / 2) * dpr, (padding + rect.height / 2) * dpr];
      program.uniforms.uHalfSize.value = [(rect.width / 2) * dpr, (rect.height / 2) * dpr];
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    let pointerAngle: number | null = null;
    let proximityValue = 0;
    const pointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
      const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
      const distance = Math.hypot(dx, dy);
      pointerAngle = distance === 0 ? Math.atan2(2 / rect.height, -2 / rect.width) : Math.atan2(centerY - event.clientY, event.clientX - centerX);
      const t = Math.max(0, 1 - distance / Math.max(propsRef.current.proximity, 1));
      proximityValue = t * t * (3 - 2 * t);
    };
    window.addEventListener("pointermove", pointerMove);

    const line = new Color();
    const base = new Color();
    let angle = 2.4;
    let idleAngle = 2.4;
    let brightness = 0;
    let previous = performance.now();
    let frame = 0;
    const render = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .05);
      previous = now;
      const current = propsRef.current;
      idleAngle += current.speed * delta;
      const target = current.followMouse && pointerAngle !== null ? pointerAngle : idleAngle;
      const difference = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += difference * (1 - Math.exp(-delta * 7));
      const targetBrightness = current.autoAnimate ? 1 : proximityValue;
      brightness += (targetBrightness - brightness) * (1 - Math.exp(-delta * 8));
      line.set(current.lineColor);
      base.set(current.baseColor);
      program.uniforms.uAngle.value = angle;
      program.uniforms.uRadius.value = Math.min(current.radius, Math.min(measured.width, measured.height) / 2) * dpr;
      program.uniforms.uLineColor.value = [line.r, line.g, line.b];
      program.uniforms.uBaseColor.value = [base.r, base.g, base.b];
      program.uniforms.uIntensity.value = current.intensity * brightness;
      program.uniforms.uShineSize.value = current.shineSize * Math.PI / 180;
      program.uniforms.uShineFade.value = current.shineFade * Math.PI / 180;
      program.uniforms.uThickness.value = current.thickness * dpr;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", pointerMove);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  const classes = `specular-button specular-button--${size} ${className}`;
  const style = { "--sb-radius": `${radius}px`, "--sb-text-color": textColor } as CSSProperties;
  const content = <><span ref={effectRef} className="specular-button__fx" aria-hidden="true" /><span className="specular-button__label">{children}</span></>;
  if (href) return <a ref={elementRef as React.RefObject<HTMLAnchorElement>} className={classes} style={style} href={href}>{content}</a>;
  return <button ref={elementRef as React.RefObject<HTMLButtonElement>} className={classes} style={style} type="button" onClick={onClick}>{content}</button>;
}
