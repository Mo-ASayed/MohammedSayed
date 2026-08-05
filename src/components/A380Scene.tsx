"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FLOW_VERTEX_SHADER = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 transformed = position;
  float edge = sin(3.14159265 * uv.y);
  float wave = sin(uv.x * 15.0 + uTime * 1.65 + uv.y * 3.2);
  transformed.y += wave * 0.075 * edge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}`;

const FLOW_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uSide;
varying vec2 vUv;
void main() {
  float across = sin(3.14159265 * vUv.y);
  float ends = smoothstep(0.0, 0.13, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
  float pulse = 0.5 + 0.5 * sin(vUv.x * 18.0 + uTime * 2.0 + vUv.y * 2.8);
  float softBand = 0.5 + 0.5 * sin(vUv.y * 8.0 + uTime * 0.35);
  vec3 sky = vec3(0.20, 0.76, 0.95);
  vec3 blue = vec3(0.22, 0.42, 0.92);
  vec3 teal = vec3(0.20, 0.82, 0.72);
  vec3 color = mix(sky, blue, vUv.y * 0.72 + pulse * 0.12);
  color = mix(color, teal, softBand * 0.16 + uSide * 0.025);
  float alpha = across * ends * (0.045 + pulse * 0.105);
  gl_FragColor = vec4(color, alpha);
}`;

function createAirflowSheet(side: -1 | 1) {
  const alongSegments = 82;
  const acrossSegments = 20;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= acrossSegments; row += 1) {
    const v = row / acrossSegments;
    const span = .42 + v * 4.25;
    const z = side * span;
    const wingCenter = .88 - span * .53;
    for (let column = 0; column <= alongSegments; column += 1) {
      const u = column / alongSegments;
      const x = 5.8 - u * 11.6;
      const wingLift = Math.exp(-Math.pow((x - wingCenter) / 1.7, 2)) * (.2 + v * .22);
      positions.push(x, .13 + wingLift, z);
      uvs.push(u, v);
    }
  }

  const rowWidth = alongSegments + 1;
  for (let row = 0; row < acrossSegments; row += 1) {
    for (let column = 0; column < alongSegments; column += 1) {
      const a = row * rowWidth + column;
      const b = a + 1;
      const c = a + rowWidth;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSide: { value: side } },
    vertexShader: FLOW_VERTEX_SHADER,
    fragmentShader: FLOW_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Mesh(geometry, material);
}

function orientAndNormalize(model: THREE.Object3D) {
  const oriented = new THREE.Group();
  oriented.add(model);

  let bounds = new THREE.Box3().setFromObject(oriented);
  let size = bounds.getSize(new THREE.Vector3());
  const smallestAxis = size.x < size.y && size.x < size.z ? "x" : size.y < size.z ? "y" : "z";
  if (smallestAxis === "z") oriented.rotation.x = -Math.PI / 2;
  if (smallestAxis === "x") oriented.rotation.z = Math.PI / 2;

  oriented.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(oriented);
  size = bounds.getSize(new THREE.Vector3());
  if (size.x > size.z) oriented.rotation.y += Math.PI / 2;

  oriented.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(oriented);
  size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  oriented.position.sub(center);

  const normalized = new THREE.Group();
  normalized.add(oriented);
  normalized.scale.setScalar(8.2 / Math.max(size.z, size.x));
  return normalized;
}

function applyPortfolioMaterials(model: THREE.Object3D) {
  const pearl = new THREE.MeshPhysicalMaterial({ color: 0xdde9ee, metalness: .12, roughness: .38, clearcoat: .34, clearcoatRoughness: .4 });
  const wing = new THREE.MeshPhysicalMaterial({ color: 0xb7cbd3, metalness: .18, roughness: .43, clearcoat: .22 });
  const navy = new THREE.MeshPhysicalMaterial({ color: 0x0a2b43, metalness: .16, roughness: .35, clearcoat: .25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x071c2a, metalness: .4, roughness: .28 });

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.computeVertexNormals();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const sourceName = `${object.name} ${materials.map((material) => material.name).join(" ")}`.toLowerCase();
    if (/glass|window|cockpit|windscreen/.test(sourceName)) object.material = navy;
    else if (/fan|blade|tire|wheel|interior|intake/.test(sourceName)) object.material = dark;
    else if (/wing|flap|slat|aileron|stabilizer/.test(sourceName)) object.material = wing;
    else if (/tail|rudder|fin/.test(sourceName)) object.material = navy;
    else object.material = pearl;
  });
}

export function A380Scene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd9edf5, .014);
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(10.7, 3.4, 12.9);
    camera.lookAt(-.05, -.05, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf8fcff, 0x284f66, 2.9));
    const key = new THREE.DirectionalLight(0xffffff, 4.7);
    key.position.set(7, 9, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x42c8f2, 2.6);
    rim.position.set(-5, 3, -8);
    scene.add(rim);

    const aircraft = new THREE.Group();
    aircraft.rotation.set(.045, Math.PI - .34, -.025);
    scene.add(aircraft);

    const airflow = new THREE.Group();
    const sheets = [createAirflowSheet(-1), createAirflowSheet(1)];
    sheets.forEach((sheet) => airflow.add(sheet));
    airflow.rotation.copy(aircraft.rotation);
    scene.add(airflow);

    let loadedModel: THREE.Object3D | null = null;
    const loader = new GLTFLoader();
    loader.load(
      "/models/a380.glb",
      (gltf) => {
        applyPortfolioMaterials(gltf.scene);
        loadedModel = orientAndNormalize(gltf.scene);
        aircraft.add(loadedModel);
        mount.dataset.modelLoaded = "true";
      },
      undefined,
      () => { mount.dataset.modelLoaded = "error"; }
    );

    const pointer = { x: 0, y: 0 };
    const flightSection = mount.closest("[data-flight-section]") as HTMLElement | null;
    const flightStage = mount.closest(".hero-stage") as HTMLElement | null;
    const aircraftWrap = mount.parentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let compactLayout = window.innerWidth < 760;
    let targetFlightProgress = prefersReducedMotion ? .62 : 0;
    let flightProgress = targetFlightProgress;

    const updateFlightProgress = () => {
      if (!flightSection || prefersReducedMotion) return;
      const rect = flightSection.getBoundingClientRect();
      const travel = Math.max(flightSection.offsetHeight - window.innerHeight, 1);
      targetFlightProgress = THREE.MathUtils.clamp(-rect.top / travel, 0, 1);
      flightStage?.style.setProperty("--flight-progress", targetFlightProgress.toFixed(3));
      mount.dataset.flightPhase = targetFlightProgress < .16 ? "runway" : targetFlightProgress < .7 ? "takeoff" : "climb";
    };

    const pointerMove = (event: PointerEvent) => {
      if (prefersReducedMotion) return;
      const rect = mount.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / Math.max(rect.width, 1) - .5;
      pointer.y = (event.clientY - rect.top) / Math.max(rect.height, 1) - .5;
    };
    mount.addEventListener("pointermove", pointerMove);
    window.addEventListener("scroll", updateFlightProgress, { passive: true });
    updateFlightProgress();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      compactLayout = window.innerWidth < 760;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .05 });
    visibilityObserver.observe(mount);
    const clockStart = performance.now();
    let frame = 0;
    let lastRender = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      const elapsed = (performance.now() - clockStart) / 1000;
      if (elapsed - lastRender < 1 / 30) return;
      lastRender = elapsed;

      flightProgress += (targetFlightProgress - flightProgress) * .065;
      const easedFlight = THREE.MathUtils.smoothstep(flightProgress, 0, 1);
      const targetY = Math.PI - .34 + pointer.x * .18 - easedFlight * .1;
      const targetX = .045 - pointer.y * .09 + easedFlight * .115;
      aircraft.rotation.y += (targetY - aircraft.rotation.y) * .04;
      aircraft.rotation.x += (targetX - aircraft.rotation.x) * .04;
      aircraft.rotation.z += ((-.025 - easedFlight * .105) - aircraft.rotation.z) * .035;
      aircraft.position.x = -1.05 + easedFlight * 1.7;
      const idleLift = prefersReducedMotion ? 0 : Math.sin(elapsed * .58) * (.025 + easedFlight * .04);
      aircraft.position.y = -.62 + easedFlight * 1.5 + idleLift;
      airflow.rotation.y += (targetY - airflow.rotation.y) * .04;
      airflow.rotation.x += (targetX - airflow.rotation.x) * .04;
      airflow.rotation.z = aircraft.rotation.z;
      airflow.position.x = aircraft.position.x;
      airflow.position.y = aircraft.position.y;
      airflow.visible = flightProgress > .13 && !compactLayout;
      sheets.forEach((sheet) => {
        const material = sheet.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = prefersReducedMotion ? 0 : elapsed;
      });
      camera.position.x += ((10.7 + pointer.x * .46) - camera.position.x) * .03;
      camera.position.y += ((3.4 - pointer.y * .3) - camera.position.y) * .03;
      camera.position.z += ((13.7 - easedFlight * 1.15) - camera.position.z) * .025;
      camera.lookAt(-.05, -.05, 0);

      const travelX = easedFlight * (compactLayout ? 5 : 10);
      const travelY = (compactLayout ? -38 : 34) - easedFlight * (compactLayout ? 92 : 155);
      const scale = (compactLayout ? .58 : .86) + easedFlight * (compactLayout ? .2 : .18);
      if (aircraftWrap) aircraftWrap.style.transform = `translate3d(${travelX}vw, ${travelY}px, 0) scale(${scale})`;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("scroll", updateFlightProgress);
      flightStage?.style.removeProperty("--flight-progress");
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      loadedModel = null;
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="a380-scene" aria-label="Interactive smooth A380 aircraft with animated translucent airflow over its wings" role="img" />;
}
