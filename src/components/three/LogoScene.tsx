"use client";
/* eslint-disable react-hooks/immutability -- three.js buffers and materials are mutated every frame by design (R3F useFrame). */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LOGO_PARTS, LOGO_VIEWBOX } from "@/components/ui/logo-path";
import { scene as state } from "@/lib/motion";

/*
 * The logo tells the story (stage = scroll position, see Story.tsx). Chapter i
 * is readable for stage i…i+0.45; every change happens in the hand-off after it.
 *   0–1  a pen of light traces the mark's outline        (2020, one line of code)
 *   1–2  the body fades in; particles drift into orbit     (50+ clients)
 *   2–3  it parts into its two halves, data flows between  (banking)
 *   3–4  the halves glide back together with a soft flash  (now)
 *   4–5  it floats beside the hero, turning with the mouse, in a field of dust
 *
 * Palette: cobalt-navy body with a light iridescent sheen, lit cyan from one
 * side and deep blue from the other; violet is only a faint edge tint.
 */

type V3 = [number, number, number];

const HEIGHT = 4.2;
const SPLIT = new THREE.Vector3(-0.62, 0.78, 0.2); // direction half A travels; half B goes the other way
const BEAMS = 7;
const PACKETS = 56;
const STARS = [
  "#dbe6ff",
  "#dbe6ff",
  "#dbe6ff",
  "#8fe4ff",
  "#8fe4ff",
  "#6f93ff",
  "#6f93ff",
  "#a99bff",
].map((c) => new THREE.Color(c));

const CAM: { pos: V3; look: V3 }[] = [
  { pos: [0.9, -0.6, 8], look: [0, -0.9, 0] },
  { pos: [0, 1.6, 12], look: [0, -0.7, 0] },
  { pos: [-4.2, 0.4, 11], look: [0, -0.9, 0] },
  { pos: [0, -0.1, 9.2], look: [0, -0.9, 0] },
  { pos: [0, 0.3, 10.5], look: [0, 0.6, 0] },
  { pos: [0, 1.8, 10.5], look: [0, 0.5, 0] },
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Smootherstep: zero velocity and acceleration at both ends, so hand-offs never jerk. */
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Each half: an extruded, bevelled solid plus its outline loops (front face only), centred on the whole mark. */
function buildLogo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${LOGO_PARTS.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  const k = HEIGHT / LOGO_VIEWBOX.height;
  const zFront = (75 + 28) * k;
  return new SVGLoader().parse(svg).paths.map((p) => {
    const shapes = p.toShapes();
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 150,
      bevelEnabled: true,
      bevelThickness: 26,
      bevelSize: 16,
      bevelSegments: 8,
      curveSegments: 48,
    });
    geo.translate(-LOGO_VIEWBOX.width / 2, -LOGO_VIEWBOX.height / 2, -75);
    geo.rotateX(Math.PI); // SVG y points down
    geo.scale(k, k, k);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const center = geo.boundingBox!.getCenter(new THREE.Vector3());
    // Ordered points per loop, so a growing draw range traces it like a pen.
    const loops = shapes.flatMap((shape) => {
      const { shape: outer, holes } = shape.extractPoints(64);
      return [outer, ...holes].map((loop) => {
        const pts = [...loop, loop[0]!].map(
          (v) =>
            new THREE.Vector3(
              (v.x - LOGO_VIEWBOX.width / 2) * k,
              -(v.y - LOGO_VIEWBOX.height / 2) * k,
              zFront,
            ),
        );
        return new THREE.BufferGeometry().setFromPoints(pts);
      });
    });
    return { geo, loops, center };
  });
}

const vertex = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 color;
  uniform float uScale;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
    vAlpha = alpha;
    vColor = color;
  }
`;
const fragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, vAlpha * core * core);
  }
`;

function pointsOf(count: number, material: THREE.Material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(count), 1));
  g.setAttribute("size", new THREE.BufferAttribute(new Float32Array(count), 1));
  const p = new THREE.Points(g, material);
  p.frustumCulled = false;
  return p;
}

function radialTexture(stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function Environment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const ctrl = new THREE.Vector3();
const onCurve = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const lookNow = new THREE.Vector3();

function Mark({ count, calm, portrait }: { count: number; calm: boolean; portrait: boolean }) {
  const parts = useMemo(() => buildLogo(), []);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const motion = useRef({ stage: 0, prev: 0, burst: 0, mx: 0, my: 0, rx: 0, ry: 0, sx: 0, sy: 0 });
  const group = useRef<THREE.Group>(null);
  const halves = useRef<(THREE.Group | null)[]>([]);

  const objects = useMemo(() => {
    const r = seeded(23);
    const solid = new THREE.MeshPhysicalMaterial({
      color: "#0f2a7a",
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [260, 420],
      envMapIntensity: 1.4,
      emissive: "#1c3dd6",
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0,
    });
    const pen = new THREE.LineBasicMaterial({
      color: "#a9dcff",
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pointMat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 300 } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Particles: an orbit ring around the mark, then a far field of dust.
    const dust = pointsOf(count, pointMat);
    const plan = Array.from({ length: count }, () => ({
      a: r() * Math.PI * 2,
      rad: 3.1 + Math.pow(r(), 1.6) * 4.2,
      y: (r() - 0.5) * 0.6,
      far: [(r() - 0.5) * 36, (r() - 0.5) * 22, -4 - r() * 18] as V3,
      size: 0.32 + r() * 0.45,
      delay: r(),
      phase: r() * Math.PI * 2,
    }));
    const col = dust.geometry.getAttribute("color") as THREE.BufferAttribute;
    plan.forEach((_, i) => STARS[Math.floor(r() * STARS.length)]!.toArray(col.array, i * 3));

    // Data beams between the halves, and packets riding them.
    const beamMat = new THREE.LineBasicMaterial({
      color: "#6fd8ff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beams = Array.from({ length: BEAMS }, (_, i) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(48 * 3), 3));
      const line = new THREE.Line(g, beamMat);
      line.frustumCulled = false;
      return {
        line,
        curve: new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
        ),
        bend: (i - (BEAMS - 1) / 2) * 0.45,
        lift: (r() - 0.5) * 1.2,
      };
    });
    const packets = pointsOf(PACKETS, pointMat);
    const pc = packets.geometry.getAttribute("color") as THREE.BufferAttribute;
    const ps = packets.geometry.getAttribute("size") as THREE.BufferAttribute;
    for (let i = 0; i < PACKETS; i++) {
      new THREE.Color(i % 3 ? "#cdeeff" : "#9f95ff").toArray(pc.array, i * 3);
      ps.array[i] = 0.85;
    }
    const packetPlan = Array.from({ length: PACKETS }, () => ({
      beam: Math.floor(r() * BEAMS),
      speed: 0.22 + r() * 0.35,
      phase: r(),
    }));

    // Two thin rings orbiting the mark.
    const rings = [3.35, 3.85].map((radius, i) => {
      const pts = new THREE.EllipseCurve(0, 0, radius, radius)
        .getPoints(160)
        .map((p) => new THREE.Vector3(p.x, p.y, 0));
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineDashedMaterial({
        color: i ? "#9f95ff" : "#7fd9ff",
        dashSize: i ? 0.9 : 0.1,
        gapSize: i ? 0.4 : 0.16,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const loop = new THREE.LineLoop(g, m);
      loop.computeLineDistances();
      return loop;
    });

    // Duotone glow behind the mark: cyan core fading to indigo.
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({
        map: radialTexture([
          [0, "rgba(120,200,255,0.55)"],
          [0.3, "rgba(70,110,255,0.3)"],
          [0.65, "rgba(110,80,230,0.1)"],
          [1, "rgba(60,40,160,0)"],
        ]),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    halo.position.z = -1.4;

    return { solid, pen, pointMat, dust, plan, beamMat, beams, packets, packetPlan, rings, halo };
  }, [count]);

  const penLines = useMemo(
    () => parts.map((p) => p.loops.map((l) => new THREE.Line(l, objects.pen))),
    [parts, objects],
  );

  useEffect(
    () => () => {
      parts.forEach((p) => (p.geo.dispose(), p.loops.forEach((l) => l.dispose())));
      const o = objects;
      [o.solid, o.pen, o.pointMat, o.beamMat].forEach((m) => m.dispose());
      o.dust.geometry.dispose();
      o.packets.geometry.dispose();
      o.halo.geometry.dispose();
      (o.halo.material as THREE.MeshBasicMaterial).map?.dispose();
      (o.halo.material as THREE.Material).dispose();
      o.beams.forEach((b) => b.line.geometry.dispose());
      o.rings.forEach((r) => (r.geometry.dispose(), (r.material as THREE.Material).dispose()));
    },
    [parts, objects],
  );

  useEffect(() => {
    objects.pointMat.uniforms.uScale!.value = size.height * dpr * 0.3;
  }, [objects, size.height, dpr]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      motion.current.mx = (e.clientX / window.innerWidth) * 2 - 1;
      motion.current.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.1);
    const m = motion.current;
    m.stage = calm ? state.target : THREE.MathUtils.damp(m.stage, state.target, 1.9, dt);
    // Mouse is smoothed too, so nothing reacts with a jolt.
    m.sx = THREE.MathUtils.damp(m.sx, m.mx, 2.5, dt);
    m.sy = THREE.MathUtils.damp(m.sy, m.my, 2.5, dt);
    const s = m.stage;
    const t = calm ? 0 : frame.clock.elapsedTime;
    // A soft flash each time the halves meet on the way down.
    if (m.prev < 2.95 && s >= 2.95) m.burst = 1;
    m.prev = s;
    m.burst = Math.max(0, m.burst - dt * 0.7);

    // The pen traces the outline on its own as the page opens; scrolling finishes it.
    const draw = calm ? 1 : Math.max(smooth(0, 0.4, s), Math.min(1, t * 0.32));
    const solid = smooth(0.45, 1.05, s);
    const orbit = smooth(0.5, 1.1, s);
    const hero = smooth(3.45, 4.1, s);
    const sep = (smooth(1.45, 2.05, s) - smooth(2.45, 3, s)) * 1.05;
    const beamsOn = smooth(1.65, 2.05, s) * (1 - smooth(2.4, 2.8, s));
    const ringsOn = smooth(0.6, 1.2, s) * (1 - smooth(4.2, 4.8, s));

    // The mark: story centre → beside the hero, gently led by the mouse.
    const g = group.current;
    if (g) {
      g.position.set(
        mix(0, portrait ? 0 : 3.3, hero),
        mix(-1.7, portrait ? 1.9 : 1.75, hero) + Math.sin(t * 0.6) * 0.07,
        mix(0, -1, hero),
      );
      g.scale.setScalar(mix(1, portrait ? 0.75 : 0.9, hero));
      const spin = smooth(1, 1.3, s) * (1 - smooth(1.4, 1.8, s));
      const targetY = calm
        ? 0
        : m.sx * 0.4 + Math.sin(t * 0.3) * 0.22 + spin * Math.sin(t * 0.5) * 0.5;
      m.ry = calm ? targetY : THREE.MathUtils.damp(m.ry, targetY, 2, dt);
      m.rx = calm ? 0 : THREE.MathUtils.damp(m.rx, m.sy * 0.2, 2, dt);
      g.rotation.set(m.rx, m.ry, 0);
    }
    halves.current.forEach((h, i) => h?.position.copy(SPLIT).multiplyScalar(i === 0 ? sep : -sep));

    // Materials.
    const o = objects;
    o.solid.opacity = solid;
    o.solid.visible = solid > 0.005;
    o.solid.emissiveIntensity = 0.1 + m.burst * 1.6 + beamsOn * 0.12;
    o.pen.opacity = mix(1, 0.18, solid) * (1 - hero * 0.6) + m.burst * 0.6;
    parts.forEach((p) =>
      p.loops.forEach((l) => l.setDrawRange(0, Math.ceil(l.getAttribute("position").count * draw))),
    );
    (o.halo.material as THREE.MeshBasicMaterial).opacity =
      (0.35 + solid * 0.45 + m.burst * 0.5) * Math.min(1, draw * 1.5);

    // Beams between the two halves' centres, bowed sideways.
    if (beamsOn > 0.005) {
      v1.copy(parts[0]!.center).addScaledVector(SPLIT, sep);
      v2.copy(parts[1]!.center).addScaledVector(SPLIT, -sep);
      ctrl.addVectors(v1, v2).multiplyScalar(0.5);
      o.beams.forEach((b) => {
        b.curve.v0.copy(v1);
        b.curve.v1.set(ctrl.x + b.bend, ctrl.y, ctrl.z + b.lift + 1);
        b.curve.v2.copy(v2);
        const arr = b.line.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let k = 0; k < 48; k++) b.curve.getPoint(k / 47, onCurve).toArray(arr.array, k * 3);
        arr.needsUpdate = true;
      });
    }
    o.beamMat.opacity = beamsOn * 0.7;
    const pp = o.packets.geometry.getAttribute("position") as THREE.BufferAttribute;
    const pa = o.packets.geometry.getAttribute("alpha") as THREE.BufferAttribute;
    o.packetPlan.forEach((q, n) => {
      o.beams[q.beam]!.curve.getPoint((t * q.speed + q.phase) % 1, v2).toArray(pp.array, n * 3);
      pa.array[n] = beamsOn;
    });
    pp.needsUpdate = true;
    pa.needsUpdate = true;

    o.rings.forEach((ring, i) => {
      (ring.material as THREE.LineDashedMaterial).opacity = ringsOn * (i ? 0.3 : 0.5);
      ring.rotation.set(1.25 + (i ? 0.25 : -0.15), i ? 0.3 : -0.2, t * (i ? -0.08 : 0.12));
    });

    // Particles drift out of the mark into orbit, then out into far dust behind the hero.
    const P = o.dust.geometry.getAttribute("position") as THREE.BufferAttribute;
    const A = o.dust.geometry.getAttribute("alpha") as THREE.BufferAttribute;
    const S = o.dust.geometry.getAttribute("size") as THREE.BufferAttribute;
    const ct = Math.cos(1.15);
    const st = Math.sin(1.15);
    o.plan.forEach((p, i) => {
      const out = smooth(0, 1, orbit * 1.4 - p.delay * 0.4);
      const ang = p.a + t * (0.35 / p.rad);
      const rad = p.rad * (1 + m.burst * 0.18);
      const ox = Math.cos(ang) * rad;
      const oz = Math.sin(ang) * rad;
      const far = smooth(0, 1, hero * 1.3 - p.delay * 0.3);
      P.array[i * 3] = mix(ox * out, p.far[0] - (g?.position.x ?? 0), far);
      P.array[i * 3 + 1] = mix((p.y - oz * st) * out, p.far[1] - (g?.position.y ?? 0), far);
      P.array[i * 3 + 2] = mix(oz * ct * out, p.far[2], far);
      const twinkle = 0.7 + Math.sin(t * 1.6 + p.phase) * 0.3;
      A.array[i] = out * twinkle * mix(0.8, 0.5, far);
      S.array[i] = p.size * (1 + m.burst * 0.4);
    });
    P.needsUpdate = true;
    A.needsUpdate = true;
    S.needsUpdate = true;

    // Camera: holds while a chapter is read, glides during the hand-off.
    const ci = Math.min(CAM.length - 2, Math.floor(s));
    const k = smooth(0.4, 1, s - ci);
    const a0 = CAM[ci]!;
    const b0 = CAM[ci + 1]!;
    camPos.set(
      mix(a0.pos[0], b0.pos[0], k),
      mix(a0.pos[1], b0.pos[1], k),
      mix(a0.pos[2], b0.pos[2], k) * (portrait ? 1.35 : 1),
    );
    camLook.set(
      mix(a0.look[0], b0.look[0], k),
      mix(a0.look[1], b0.look[1], k),
      mix(a0.look[2], b0.look[2], k),
    );
    if (!calm) {
      camPos.x += m.sx * 0.5;
      camPos.y -= m.sy * 0.3;
    }
    const cam = frame.camera;
    if (calm) {
      cam.position.copy(camPos);
      lookNow.copy(camLook);
    } else {
      cam.position.lerp(camPos, 1 - Math.exp(-2.6 * dt));
      lookNow.lerp(camLook, 1 - Math.exp(-2.6 * dt));
    }
    cam.lookAt(lookNow);
  });

  return (
    <group ref={group}>
      <primitive object={objects.halo} />
      {parts.map((p, i) => (
        <group key={i} ref={(el) => void (halves.current[i] = el)}>
          <mesh geometry={p.geo} material={objects.solid} />
          {penLines[i]!.map((line, j) => (
            <primitive key={j} object={line} />
          ))}
        </group>
      ))}
      {objects.beams.map((b, i) => (
        <primitive key={i} object={b.line} />
      ))}
      <primitive object={objects.packets} />
      <primitive object={objects.dust} />
      {objects.rings.map((r, i) => (
        <primitive key={i} object={r} />
      ))}
    </group>
  );
}

export default function LogoScene() {
  const [calm] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [count] = useState(() => (window.innerWidth < 768 ? 900 : 2200));
  const [portrait] = useState(() => window.innerWidth < window.innerHeight * 0.95);
  const [visible, setVisible] = useState(true);

  // Stop rendering once the page has scrolled past the hero.
  useEffect(() => {
    const id = setInterval(() => setVisible(state.visible), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: CAM[0]!.pos, fov: 38, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Environment />
      <ambientLight intensity={0.12} />
      <directionalLight position={[3, 6, 6]} intensity={1.1} />
      <pointLight position={[-4.5, 2, 2]} intensity={70} distance={22} color="#4fd6ff" />
      <pointLight position={[4.5, -2, 3]} intensity={55} distance={20} color="#2f5bff" />
      <pointLight position={[2, 3, -4]} intensity={18} distance={18} color="#8a6bff" />
      <Mark count={count} calm={calm} portrait={portrait} />
    </Canvas>
  );
}
