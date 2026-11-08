"use client";
/* eslint-disable react-hooks/immutability -- three.js objects are mutated every frame by design (R3F useFrame). */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GALLERY_STEP, galleryTurn } from "./gallery-math";
import { pad } from "@/lib/format";

/*
 * Project cards on the inside wall of a cylinder. The camera sits a little
 * behind the cylinder's centre, so cards curve in large from one edge, flatten
 * out as they pass the middle and recede round the other side. `progress`
 * (0–1, from scroll) turns the wall.
 */

export type GalleryCard = { title: string; context: string; year: string; stack: string[] };

const R = 10;
const STEP = GALLERY_STEP;
const ARC = STEP - 0.06; // radians per card, the rest is the gap
const HEIGHT = 5.8;
const TEX_W = 1024;
const TEX_H = Math.round((TEX_W * HEIGHT) / (R * ARC));

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** One generated cover per project: deep-blue light art plus its title. */
function drawCard(card: GalleryCard, index: number, fonts: { display: string; mono: string }) {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const g = c.getContext("2d")!;
  const W = TEX_W;
  const H = TEX_H;
  const r = seeded(index * 97 + 5);

  // Rounded card shape; everything after is clipped to it.
  g.beginPath();
  g.roundRect(0, 0, W, H, 34);
  g.clip();
  const base = g.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, "#040a20");
  base.addColorStop(1, "#0a1a4d");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  g.globalCompositeOperation = "lighter";
  const glow = (x: number, y: number, rad: number, color: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, color);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  };

  switch (index % 6) {
    case 0: {
      // Eclipse: a glowing arc rising over a dark disc.
      glow(W * 0.55, H * 0.85, W * 0.45, "rgba(42,92,255,0.35)");
      for (let k = 0; k < 18; k++) {
        g.strokeStyle = `rgba(${90 + k * 6},${150 + k * 4},255,${0.06 + (k === 9 ? 0.5 : 0)})`;
        g.lineWidth = 34 - k * 1.6;
        g.beginPath();
        g.arc(W * 0.55, H * 0.95, W * 0.33, Math.PI * 1.05, Math.PI * 1.95);
        g.stroke();
      }
      break;
    }
    case 1: {
      // Motion streaks, like a long exposure of data in transit.
      for (let k = 0; k < 70; k++) {
        const y = H * (0.15 + r() * 0.6);
        const len = W * (0.2 + r() * 0.7);
        const x = r() * (W - len * 0.5);
        const gr = g.createLinearGradient(x, 0, x + len, 0);
        gr.addColorStop(0, "rgba(0,0,0,0)");
        gr.addColorStop(0.7, `rgba(${60 + r() * 80},${120 + r() * 100},255,${0.15 + r() * 0.35})`);
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(x, y, len, 2 + r() * 8);
      }
      break;
    }
    case 2: {
      // Orbits around a bright core.
      glow(W * 0.62, H * 0.42, W * 0.32, "rgba(90,140,255,0.45)");
      g.lineWidth = 2;
      for (let k = 1; k <= 7; k++) {
        g.strokeStyle = `rgba(150,185,255,${0.5 - k * 0.05})`;
        g.beginPath();
        g.ellipse(W * 0.62, H * 0.42, k * 55, k * 22, -0.35, 0, Math.PI * 2);
        g.stroke();
      }
      glow(W * 0.62, H * 0.42, 40, "rgba(220,235,255,0.9)");
      break;
    }
    case 3: {
      // Horizon grid with a sun.
      glow(W * 0.5, H * 0.48, W * 0.3, "rgba(60,110,255,0.55)");
      g.strokeStyle = "rgba(120,160,255,0.35)";
      g.lineWidth = 1.5;
      for (let k = 0; k < 14; k++) {
        const y = H * 0.55 + Math.pow(k / 13, 2) * H * 0.45;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
      }
      for (let k = -12; k <= 12; k++) {
        g.beginPath();
        g.moveTo(W / 2 + k * 18, H * 0.55);
        g.lineTo(W / 2 + k * 130, H);
        g.stroke();
      }
      break;
    }
    case 4: {
      // An equaliser of request volumes.
      const bars = 42;
      for (let k = 0; k < bars; k++) {
        const h = H * (0.08 + Math.pow(r(), 1.5) * 0.5);
        const x = (k / bars) * W;
        const gr = g.createLinearGradient(0, H * 0.75 - h, 0, H * 0.75);
        gr.addColorStop(0, "rgba(140,180,255,0.75)");
        gr.addColorStop(1, "rgba(42,92,255,0.05)");
        g.fillStyle = gr;
        g.fillRect(x + 4, H * 0.75 - h, W / bars - 8, h);
      }
      break;
    }
    default: {
      // A constellation of nodes and links.
      const pts = Array.from({ length: 34 }, () => [r() * W, r() * H * 0.72] as const);
      g.strokeStyle = "rgba(120,160,255,0.25)";
      pts.forEach(([x, y], k) => {
        const [x2, y2] = pts[(k * 7 + 3) % pts.length]!;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x2, y2);
        g.stroke();
      });
      pts.forEach(([x, y]) => glow(x, y, 26, "rgba(170,200,255,0.55)"));
    }
  }

  g.globalCompositeOperation = "source-over";
  // Grain and a bottom shade so the type sits on calm ground.
  const img = g.getImageData(0, 0, W, H);
  for (let k = 0; k < img.data.length; k += 4) {
    const n = (r() - 0.5) * 18;
    img.data[k] = img.data[k]! + n;
    img.data[k + 1] = img.data[k + 1]! + n;
    img.data[k + 2] = img.data[k + 2]! + n;
  }
  g.putImageData(img, 0, 0);
  const shade = g.createLinearGradient(0, H * 0.45, 0, H);
  shade.addColorStop(0, "rgba(3,8,23,0)");
  shade.addColorStop(1, "rgba(3,8,23,0.92)");
  g.fillStyle = shade;
  g.fillRect(0, 0, W, H);

  // Type.
  g.fillStyle = "rgba(200,215,255,0.75)";
  g.font = `500 26px ${fonts.mono}`;
  g.fillText(`${pad(index + 1)}  ·  ${card.context.toUpperCase()}`, 56, 76);
  g.textAlign = "right";
  g.fillText(card.year, W - 56, 76);
  g.textAlign = "left";
  g.fillStyle = "#f0f3fb";
  g.font = `800 92px ${fonts.display}`;
  const words = card.title.toUpperCase().split(" ");
  const lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && g.measureText(`${last} ${w}`).width < W - 112)
      lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  lines
    .slice(-3)
    .forEach((line, k, all) => g.fillText(line, 56, H - 96 - (all.length - 1 - k) * 86));
  g.fillStyle = "#7fa0ff";
  g.font = `500 24px ${fonts.mono}`;
  g.fillText(card.stack.join("  ·  ").toUpperCase(), 56, H - 44);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // Seen from inside the cylinder the surface is mirrored; flip it back.
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = -1;
  return tex;
}

function Wall({ cards, progress }: { cards: GalleryCard[]; progress: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const [fonts] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return {
      display: css.getPropertyValue("--font-display-face").trim() || "sans-serif",
      mono: css.getPropertyValue("--font-mono-face").trim() || "monospace",
    };
  });

  const meshes = useMemo(
    () =>
      cards.map((card, i) => {
        const geo = new THREE.CylinderGeometry(
          R,
          R,
          HEIGHT,
          48,
          1,
          true,
          Math.PI - ARC / 2 - i * STEP,
          ARC,
        );
        const mat = new THREE.MeshBasicMaterial({
          map: drawCard(card, i, fonts),
          side: THREE.BackSide,
          transparent: true,
          toneMapped: false,
        });
        return new THREE.Mesh(geo, mat);
      }),
    [cards, fonts],
  );

  useEffect(
    () => () =>
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.MeshBasicMaterial).map?.dispose();
        (m.material as THREE.Material).dispose();
      }),
    [meshes],
  );

  // A wide horizontal view is what bends the edge cards towards the viewer.
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(50)) / aspect);
    camera.fov = Math.min(80, THREE.MathUtils.radToDeg(half * 2));
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  const turn = useRef(galleryTurn(0, cards.length));
  useFrame((_, delta) => {
    const target = galleryTurn(progress.current ?? 0, cards.length);
    turn.current = THREE.MathUtils.damp(turn.current, target, 6, Math.min(delta, 0.1));
    if (group.current) group.current.rotation.y = turn.current;
    // With many cards the wall wraps past the sides; fade cards out before they reach the back.
    meshes.forEach((m, i) => {
      const away = Math.abs(i * STEP - turn.current);
      const o = 1 - THREE.MathUtils.smoothstep(away, 1.5, 2.1);
      (m.material as THREE.MeshBasicMaterial).opacity = o;
      m.visible = o > 0.01;
    });
  });

  return (
    <group ref={group}>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}

export default function CurvedGallery({
  cards,
  progress,
}: {
  cards: GalleryCard[];
  progress: React.RefObject<number>;
}) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Draw the covers only once the web fonts are in, so canvas text uses them.
  useEffect(() => {
    document.fonts.ready.then(() => setReady(true));
  }, []);

  // Render only while the gallery is on screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(Boolean(e?.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="size-full">
      {ready && (
        <Canvas
          frameloop={active ? "always" : "never"}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Wall cards={cards} progress={progress} />
        </Canvas>
      )}
    </div>
  );
}
