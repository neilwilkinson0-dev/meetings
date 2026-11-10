"use client";

import { useEffect, useRef } from "react";

// A cartoon (not a likeness) of Tim having a slice of Victoria sponge and an
// Americano in a smart Manchester coffee shop, built from three.js primitives. Loaded only when the
// slide is on screen, and torn down when it leaves.
export default function Breakfast() {
  const mount = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then((THREE) => {
      if (disposed || !mount.current) return;
      cleanup = buildScene(THREE, mount.current);
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mount} className="eaa-breakfast-canvas" />;
}

function buildScene(THREE, el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#2a1d17");
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 50);
  const lookAt = new THREE.Vector3(-0.32, 1.02, -0.3);

  // ---------- helpers ----------
  const mats = {};
  const mat = (color, opts = {}) => {
    const key = color + JSON.stringify(opts);
    if (!mats[key]) mats[key] = new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts });
    return mats[key];
  };
  const add = (geo, material, pos = [0, 0, 0], parent = scene, { rot, scale, shadow = true } = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale) m.scale.set(...scale);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const textTexture = (lines, { w = 512, h = 256, bg = "#ffffff", fg = "#0b1b27", font = "bold 90px Roboto, sans-serif" } = {}) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = font;
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (h / (lines.length + 0.6))));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  // A cylinder stretched between two points (for arms and the lanyard).
  const UP = new THREE.Vector3(0, 1, 0);
  const limb = (radius, material) => {
    const m = add(new THREE.CylinderGeometry(radius, radius, 1, 12), material);
    m.userData.set = (a, b) => {
      const d = new THREE.Vector3().subVectors(b, a);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.scale.set(1, d.length(), 1);
      m.quaternion.setFromUnitVectors(UP, d.normalize());
    };
    return m;
  };

  // ---------- coffee shop ----------
  // Exposed brick, drawn once onto a canvas.
  const brick = (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#d9cbbb";
    g.fillRect(0, 0, 512, 512);
    const bw = 64, bh = 28;
    for (let row = 0; row < 512 / bh + 1; row++) {
      for (let col = -1; col < 512 / bw + 1; col++) {
        const x = col * bw + (row % 2 ? bw / 2 : 0);
        const shade = 120 + ((row * 7 + col * 13) % 5) * 10;
        g.fillStyle = `rgb(${shade + 40}, ${shade - 40}, ${shade - 70})`;
        g.fillRect(x + 3, row * bh + 3, bw - 6, bh - 6);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 3);
    return t;
  })();
  add(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 }), [0, 3, -2.2], scene, { shadow: false });
  add(new THREE.PlaneGeometry(12, 12), mat("#5a3a26", { roughness: 0.6 }), [0, 0, 0], scene, { rot: [-Math.PI / 2, 0, 0], shadow: false });

  // Chalkboard menu
  add(new THREE.BoxGeometry(1.06, 0.66, 0.03), mat("#6b4a2e"), [0.9, 1.68, -2.18]);
  add(
    new THREE.PlaneGeometry(0.98, 0.58),
    new THREE.MeshBasicMaterial({
      map: textTexture(["TODAY'S BAKES", "Victoria sponge", "Americano"], {
        w: 640,
        h: 380,
        bg: "#23282a",
        fg: "#f4f1ea",
        font: "600 56px Roboto, sans-serif",
      }),
    }),
    [0.9, 1.68, -2.16],
    scene,
    { shadow: false }
  );

  // Edison-bulb pendants
  const bulbs = [-0.75, 0.35, 1.4].map((x, i) => {
    const y = 1.95 + (i % 2) * 0.12;
    limb(0.004, mat("#1a1a1a")).userData.set(new THREE.Vector3(x, 4, -0.9), new THREE.Vector3(x, y + 0.06, -0.9));
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12), mat("#2b2b2b", { metalness: 0.6 }), [x, y + 0.05, -0.9]);
    return add(new THREE.SphereGeometry(0.045, 16, 12), mat("#ffd58a", { emissive: "#ffb347", emissiveIntensity: 2.2 }), [x, y, -0.9], scene, { shadow: false, scale: [1, 1.3, 1] });
  });

  // A leafy plant in the corner
  add(new THREE.CylinderGeometry(0.14, 0.11, 0.3, 20), mat("#c9c2b8", { roughness: 0.5 }), [-1.55, 0.15, -1.5]);
  for (let k = 0; k < 14; k++) {
    const a = k * 2.3, r = 0.08 + (k % 4) * 0.04;
    add(new THREE.SphereGeometry(0.09, 10, 8), mat(k % 3 ? "#3f7a3a" : "#2f6230"), [-1.55 + Math.cos(a) * r, 0.42 + (k % 5) * 0.09, -1.5 + Math.sin(a) * r], scene, { scale: [1, 0.6, 1.4], rot: [0, a, 0.4] });
  }

  // ---------- marble table ----------
  const marble = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#f3f1ee";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(120,120,130,0.35)";
    for (let v = 0; v < 9; v++) {
      g.lineWidth = 1 + (v % 3);
      g.beginPath();
      let x = (v * 71) % 512, y = 0;
      g.moveTo(x, y);
      while (y < 512) {
        x += Math.sin(y * 0.03 + v) * 14 + 6;
        y += 18;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  add(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 64), new THREE.MeshStandardMaterial({ map: marble, roughness: 0.25 }), [0, 0.73, -0.1]);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12), mat("#1d1d1d", { metalness: 0.6, roughness: 0.4 }), [0, 0.36, -0.1]);
  add(new THREE.CylinderGeometry(0.25, 0.28, 0.03, 32), mat("#1d1d1d", { metalness: 0.6, roughness: 0.4 }), [0, 0.015, -0.1]);
  const TOP = 0.75;

  // ---------- Victoria sponge ----------
  const sponge = mat("#e9c27a", { roughness: 0.85 });
  const jam = mat("#b3142b", { roughness: 0.3 });
  const cream = mat("#fffaf0", { roughness: 0.6 });
  const sugar = mat("#ffffff", { roughness: 1 });
  // Layers of a cake (or slice): sponge, jam, cream, sponge, icing sugar.
  function cake(parent, r, start, length) {
    const layer = (h, y, material, rr = r) =>
      add(new THREE.CylinderGeometry(rr, rr, h, 48, 1, false, start, length), material, [0, y, 0], parent);
    layer(0.028, 0.014, sponge);
    layer(0.006, 0.031, jam, r * 0.97);
    layer(0.01, 0.039, cream, r * 0.96);
    layer(0.028, 0.058, sponge);
    layer(0.002, 0.073, sugar, r * 0.95);
  }

  // Tim's slice on a plate
  const plate = new THREE.Group();
  plate.position.set(0.08, TOP, -0.12);
  scene.add(plate);
  add(new THREE.CylinderGeometry(0.13, 0.11, 0.015, 40), mat("#fbfbf8", { roughness: 0.25 }), [0, 0.0075, 0], plate);
  add(new THREE.TorusGeometry(0.12, 0.006, 8, 48), mat("#d4b26a", { metalness: 0.7, roughness: 0.3 }), [0, 0.016, 0], plate, { rot: [Math.PI / 2, 0, 0] });
  const slice = new THREE.Group();
  slice.position.set(-0.04, 0.016, 0.03);
  slice.rotation.y = 0.9;
  plate.add(slice);
  cake(slice, 0.1, 0, 0.75);

  // The rest of the cake on a stand
  const stand = new THREE.Group();
  stand.position.set(0.38, TOP, -0.42);
  scene.add(stand);
  add(new THREE.CylinderGeometry(0.03, 0.06, 0.12, 20), mat("#fbfbf8", { roughness: 0.25 }), [0, 0.06, 0], stand);
  add(new THREE.CylinderGeometry(0.15, 0.14, 0.012, 40), mat("#fbfbf8", { roughness: 0.25 }), [0, 0.126, 0], stand);
  const whole = new THREE.Group();
  whole.position.y = 0.132;
  stand.add(whole);
  cake(whole, 0.12, 1.2, Math.PI * 2 - 0.75);

  // Americano: cup and saucer, steaming
  const mug = new THREE.Group();
  mug.position.set(-0.22, TOP, -0.05);
  scene.add(mug);
  add(new THREE.CylinderGeometry(0.075, 0.065, 0.012, 32), mat("#ffffff", { roughness: 0.25 }), [0, 0.006, 0], mug);
  add(new THREE.CylinderGeometry(0.045, 0.03, 0.065, 28, 1, true), mat("#ffffff", { side: THREE.DoubleSide, roughness: 0.25 }), [0, 0.045, 0], mug);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.004, 24), mat("#ffffff"), [0, 0.014, 0], mug);
  add(new THREE.CylinderGeometry(0.042, 0.042, 0.003, 28), mat("#2a160c", { roughness: 0.1 }), [0, 0.07, 0], mug);
  add(new THREE.RingGeometry(0.03, 0.042, 28), mat("#8a5a34", { roughness: 0.4 }), [0, 0.0716, 0], mug, { rot: [-Math.PI / 2, 0, 0], shadow: false });
  add(new THREE.TorusGeometry(0.018, 0.006, 8, 16, Math.PI), mat("#ffffff"), [-0.05, 0.045, 0], mug, { rot: [0, 0, Math.PI / 2] });
  add(new THREE.BoxGeometry(0.008, 0.002, 0.09), mat("#cfd3d6", { metalness: 0.8, roughness: 0.3 }), [0.055, 0.014, 0.0], mug, { rot: [0, 0.4, 0] });
  const steamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false });
  const steam = Array.from({ length: 7 }, (_, k) => {
    const p = add(new THREE.SphereGeometry(0.016, 10, 8), steamMat.clone(), [0, 0.08, 0], mug, { shadow: false });
    p.userData.offset = k / 7;
    return p;
  });

  const steel = mat("#cfd3d6", { metalness: 0.8, roughness: 0.3 });

  // ---------- Tim (cartoon) ----------
  const skin = mat("#f1c6a6", { roughness: 0.6 });
  const shirt = mat("#f7f8fb", { roughness: 0.8 });
  const hairM = mat("#6b4a2e", { roughness: 0.9 });
  const tim = new THREE.Group();
  tim.position.set(0, 0, -0.62);
  scene.add(tim);
  // Chair back
  add(new THREE.BoxGeometry(0.5, 0.7, 0.05), mat("#3b2a20"), [0, 0.95, -0.2], tim);
  add(new THREE.BoxGeometry(0.5, 0.05, 0.45), mat("#3b2a20"), [0, 0.46, 0], tim);
  // Body
  add(new THREE.CapsuleGeometry(0.16, 0.2, 8, 20), shirt, [0, 1.07, 0], tim, { scale: [1.2, 1, 0.8] });
  add(new THREE.CylinderGeometry(0.05, 0.055, 0.08, 14), skin, [0, 1.36, 0.01], tim);
  // Open collar: two flaps and a V of skin
  [-1, 1].forEach((s) =>
    add(new THREE.BoxGeometry(0.075, 0.05, 0.012), shirt, [s * 0.05, 1.33, 0.1], tim, { rot: [-0.5, s * 0.35, s * 0.55] })
  );
  add(new THREE.ConeGeometry(0.04, 0.12, 3), skin, [0, 1.28, 0.115], tim, { rot: [Math.PI - 0.15, 0, 0], scale: [1, 1, 0.3] });

  // Head (its own group so it can nod while chewing)
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0.02);
  tim.add(head);
  add(new THREE.SphereGeometry(0.125, 32, 24), skin, [0, 0, 0], head, { scale: [0.95, 1.08, 0.95] });
  add(new THREE.SphereGeometry(0.128, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM, [0, 0.014, -0.008], head, { scale: [0.98, 1.08, 0.99], rot: [-0.32, 0, 0.06] });
  add(new THREE.SphereGeometry(0.05, 14, 10), hairM, [0.03, 0.105, 0.04], head, { scale: [1.4, 0.45, 1] });
  [-1, 1].forEach((s) => {
    add(new THREE.SphereGeometry(0.026, 12, 10), skin, [s * 0.118, -0.005, 0], head, { scale: [0.5, 1, 0.8] });
    add(new THREE.SphereGeometry(0.014, 12, 10), mat("#2c4a66", { roughness: 0.3 }), [s * 0.043, 0.02, 0.112], head);
    add(new THREE.SphereGeometry(0.004, 8, 6), mat("#ffffff"), [s * 0.043 + 0.005, 0.026, 0.124], head, { shadow: false });
    add(new THREE.BoxGeometry(0.04, 0.008, 0.01), hairM, [s * 0.045, 0.052, 0.112], head, { rot: [0, 0, s * -0.12] });
  });
  add(new THREE.SphereGeometry(0.018, 12, 10), mat("#e8b394"), [0, -0.005, 0.124], head, { scale: [0.9, 1, 1] });
  // Short beard along the jaw and a moustache
  const beardM = mat("#7a5232", { roughness: 1 });
  add(new THREE.SphereGeometry(0.123, 28, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), beardM, [0, -0.012, 0.006], head, { scale: [0.98, 1.1, 0.99] });
  add(new THREE.TorusGeometry(0.03, 0.009, 8, 16, Math.PI), beardM, [0, -0.045, 0.108], head, { scale: [1, 0.5, 0.6] });
  // Mouth: dark oval that opens for each bite
  const mouth = add(new THREE.SphereGeometry(0.03, 16, 10), mat("#5a1f1f"), [0, -0.06, 0.112], head, { scale: [0.9, 0.25, 0.4], shadow: false });
  // Lanyard + badge
  const lanyardMat = mat("#1f6fd1");
  const neckL = new THREE.Vector3(-0.05, 1.33, 0.06);
  const neckR = new THREE.Vector3(0.05, 1.33, 0.06);
  const badgeTop = new THREE.Vector3(0, 1.12, 0.145);
  [neckL, neckR].forEach((n) => limb(0.006, lanyardMat).userData.set(n.clone().add(tim.position), badgeTop.clone().add(tim.position)));
  add(
    new THREE.PlaneGeometry(0.1, 0.13),
    new THREE.MeshStandardMaterial({ map: textTexture(["HELLO", "TIM"], { w: 256, h: 320, font: "bold 80px Roboto, sans-serif" }), roughness: 0.5 }),
    [0, 1.05, 0.15],
    tim,
    { rot: [-0.18, 0, 0] }
  );

  // Arms: shoulder -> elbow -> hand, re-aimed every frame.
  const W = (x, y, z) => new THREE.Vector3(x, y, z).add(tim.position);
  const arms = [-1, 1].map((s) => ({
    s,
    shoulder: W(s * 0.21, 1.25, 0),
    upper: limb(0.045, shirt),
    fore: limb(0.04, shirt),
    hand: add(new THREE.SphereGeometry(0.035, 14, 10), skin),
    elbowBall: add(new THREE.SphereGeometry(0.045, 12, 10), shirt),
  }));
  // A cake fork in his right hand; his left rests by the coffee.
  const fork = new THREE.Group();
  scene.add(fork);
  add(new THREE.BoxGeometry(0.01, 0.004, 0.11), steel, [0, 0, 0.0], fork);
  for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.003, 0.003, 0.03), steel, [(k - 1) * 0.005, 0, 0.068], fork);
  const bite = new THREE.Group();
  bite.position.set(0, 0.012, 0.075);
  fork.add(bite);
  add(new THREE.BoxGeometry(0.026, 0.011, 0.022), sponge, [0, -0.008, 0], bite);
  add(new THREE.BoxGeometry(0.025, 0.004, 0.021), jam, [0, -0.0005, 0], bite);
  add(new THREE.BoxGeometry(0.025, 0.004, 0.021), cream, [0, 0.0035, 0], bite);
  add(new THREE.BoxGeometry(0.026, 0.011, 0.022), sponge, [0, 0.011, 0], bite);

  const forkRest = new THREE.Vector3(0.06, TOP + 0.09, -0.16);
  const forkMouth = new THREE.Vector3(0.02, 1.38, -0.37); // hand under the chin, tines at the mouth
  const restHand = new THREE.Vector3(-0.15, TOP + 0.04, -0.2);
  const tmp = new THREE.Vector3();

  function placeArm(arm, hand) {
    // Elbow sits out to the side and below the line from shoulder to hand.
    const mid = tmp.copy(arm.shoulder).lerp(hand, 0.5);
    const elbow = mid.clone().add(new THREE.Vector3(arm.s * 0.11, -0.1, -0.02));
    arm.upper.userData.set(arm.shoulder, elbow);
    arm.fore.userData.set(elbow, hand);
    arm.elbowBall.position.copy(elbow);
    arm.hand.position.copy(hand);
  }

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight("#fff0dc", "#3a2618", 0.9));
  const sun = new THREE.DirectionalLight("#ffe6c4", 1.8);
  sun.position.set(1.6, 3.2, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 2, bottom: -0.5, near: 0.5, far: 8 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  bulbs.forEach((b) => {
    const l = new THREE.PointLight("#ffb860", 0.9, 3.5);
    l.position.copy(b.position);
    scene.add(l);
  });

  // ---------- animation ----------
  const ease = (t) => t * t * (3 - 2 * t);
  const clamp01 = (t) => Math.min(1, Math.max(0, t));
  const CYCLE = 4.2;
  const clock = new THREE.Clock();
  let raf;

  function frame() {
    const t = clock.getElapsedTime();
    const c = t % CYCLE;
    // 0–1.3 cutting, 1.3–2.1 lift, 2.1–2.9 chew at mouth, 2.9–3.7 lower, rest
    const up = c < 1.3 ? 0 : c < 2.1 ? ease((c - 1.3) / 0.8) : c < 2.9 ? 1 : c < 3.7 ? 1 - ease((c - 2.9) / 0.8) : 0;
    const hand = forkRest.clone().lerp(forkMouth, up);
    if (c < 1.3) hand.y += Math.abs(Math.sin(c * 5)) * 0.01; // cutting a forkful
    placeArm(arms[1], hand);
    fork.position.copy(hand);
    // Tines down into the cake at rest; turned round to face the mouth when lifted.
    fork.rotation.set(0.35 + up * 0.1, 0.25 + up * (Math.PI - 0.25), 0);
    bite.visible = !(c > 2.35 && c < 3.9);

    placeArm(arms[0], restHand);

    // Mouth opens as the fork arrives, then chews.
    const open = c > 1.8 && c < 2.35 ? clamp01((c - 1.8) / 0.3) : c >= 2.35 && c < 3.4 ? 0.35 + 0.35 * Math.abs(Math.sin((c - 2.35) * 9)) : 0;
    mouth.scale.y = 0.25 + open * 0.75;
    head.rotation.x = -0.12 + up * 0.08 + (c > 2.35 && c < 3.4 ? Math.sin((c - 2.35) * 9) * 0.02 : 0);
    head.rotation.z = Math.sin(t * 0.7) * 0.03;

    steam.forEach((p) => {
      const k = (t * 0.35 + p.userData.offset) % 1;
      p.position.set(Math.sin(k * 7 + p.userData.offset * 10) * 0.015, 0.1 + k * 0.22, Math.cos(k * 5) * 0.01);
      p.scale.setScalar(0.6 + k * 1.6);
      p.material.opacity = 0.35 * (1 - k);
    });

    // Slow, gentle camera drift
    camera.position.set(-0.05 + Math.sin(t * 0.15) * 0.3, 1.5 + Math.sin(t * 0.21) * 0.03, 1.95);
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = el;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();
  frame();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((m) => {
        m.map?.dispose?.();
        m.dispose?.();
      });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
