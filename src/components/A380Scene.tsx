"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
      mount.dataset.flightPhase = targetFlightProgress < .25 ? "entering" : targetFlightProgress < .75 ? "crossing" : "departing";
    };

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
    let lastFrame = clockStart;
    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      const now = performance.now();
      const elapsed = (now - clockStart) / 1000;
      const delta = Math.min((now - lastFrame) / 1000, .1);
      lastFrame = now;

      const follow = 1 - Math.exp(-delta * 8);
      flightProgress += (targetFlightProgress - flightProgress) * follow;
      const easedFlight = THREE.MathUtils.smoothstep(flightProgress, 0, 1);
      const arc = Math.sin(easedFlight * Math.PI);
      const targetY = Math.PI - .34 - easedFlight * .06;
      const targetX = .045 + arc * .065;
      aircraft.rotation.y += (targetY - aircraft.rotation.y) * .04;
      aircraft.rotation.x += (targetX - aircraft.rotation.x) * .04;
      aircraft.rotation.z += ((-.02 - arc * .055) - aircraft.rotation.z) * .035;
      aircraft.position.x = -.2;
      aircraft.position.y = -.05 + arc * .16;
      camera.position.z += ((13.5 - arc * .35) - camera.position.z) * .025;
      camera.lookAt(-.05, -.05, 0);

      const travelX = (compactLayout ? -62 : -55) + easedFlight * (compactLayout ? 124 : 110);
      const travelY = (compactLayout ? 96 : 70) - arc * (compactLayout ? 46 : 68) - easedFlight * (compactLayout ? 12 : 18);
      const scale = (compactLayout ? .5 : .58) + arc * (compactLayout ? .05 : .06);
      if (aircraftWrap) aircraftWrap.style.transform = `translate3d(${travelX}vw, ${travelY}px, 0) scale(${scale})`;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
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

  return <div ref={mountRef} className="a380-scene" aria-label="A380 aircraft moving smoothly across the background as the page scrolls" role="img" />;
}
