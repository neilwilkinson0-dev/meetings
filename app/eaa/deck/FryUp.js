"use client";

import { useEffect, useRef } from "react";

// A cartoon (not a likeness) of Tim tucking into a full English in a hotel
// breakfast room, built from three.js primitives. Loaded only when the
// slide is on screen, and torn down when it leaves.
export default function FryUp() {
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

  return <div ref={mount} className="eaa-fryup-canvas" />;
}

function buildScene(THREE, el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#4b2475");
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

  // ---------- room ----------
  add(new THREE.PlaneGeometry(12, 12), mat("#6b4a3a"), [0, 0, 0], scene, { rot: [-Math.PI / 2, 0, 0], shadow: false });
  add(new THREE.PlaneGeometry(12, 6), mat("#4b2475"), [0, 3, -2.2], scene, { shadow: false });
  // A breakfast sign and a framed print on the wall.
  add(
    new THREE.PlaneGeometry(1.3, 0.42),
    new THREE.MeshBasicMaterial({ map: textTexture(["FULL ENGLISH", "served 7–10am"], { w: 640, h: 220, bg: "#f4e9ff", fg: "#4b2475", font: "bold 64px Roboto, sans-serif" }) }),
    [1.05, 1.72, -2.19],
    scene,
    { shadow: false }
  );
  add(new THREE.BoxGeometry(0.62, 0.48, 0.03), mat("#2b1640"), [-1.7, 1.15, -2.18]);
  add(new THREE.PlaneGeometry(0.54, 0.4), mat("#f0b84a", { emissive: "#5a3a00", emissiveIntensity: 0.3 }), [-1.7, 1.15, -2.16], scene, { shadow: false });
  add(new THREE.CircleGeometry(0.09, 24), mat("#fff3c4", { emissive: "#fff3c4", emissiveIntensity: 0.6 }), [-1.7, 1.19, -2.155], scene, { shadow: false });

  // ---------- table ----------
  const wood = mat("#c89a6a", { roughness: 0.55 });
  add(new THREE.BoxGeometry(1.5, 0.05, 0.95), wood, [0, 0.725, -0.05]);
  [[-0.68, 0.38], [0.68, 0.38], [-0.68, -0.48], [0.68, -0.48]].forEach(([x, z]) =>
    add(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10), mat("#3a2a20"), [x, 0.35, z])
  );
  const TOP = 0.75;

  // ---------- the fry up ----------
  const plate = new THREE.Group();
  plate.position.set(0, TOP, -0.08);
  scene.add(plate);
  add(new THREE.CylinderGeometry(0.2, 0.17, 0.02, 40), mat("#fbfbf8", { roughness: 0.25 }), [0, 0.01, 0], plate);
  add(new THREE.TorusGeometry(0.185, 0.008, 8, 48), mat("#e7e7e2", { roughness: 0.25 }), [0, 0.021, 0], plate, { rot: [Math.PI / 2, 0, 0] });
  const S = 0.024; // food sits on the plate surface

  // Fried eggs
  [[-0.07, 0.07], [0.02, 0.1]].forEach(([x, z], i) => {
    add(new THREE.CylinderGeometry(0.055, 0.058, 0.006, 20), mat("#fffdf5", { roughness: 0.35 }), [x, S, z], plate, { scale: [1, 1, 0.85 + i * 0.1] });
    add(new THREE.SphereGeometry(0.022, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#ffb21e", { roughness: 0.2 }), [x + 0.005, S + 0.002, z], plate);
  });
  // Bacon: wavy rashers
  [0, 1].forEach((i) => {
    const r = new THREE.Group();
    r.position.set(0.09, S + 0.006, -0.02 + i * 0.045);
    r.rotation.y = 0.35;
    plate.add(r);
    for (let k = 0; k < 6; k++) {
      add(new THREE.BoxGeometry(0.022, 0.006, 0.04), mat(k % 2 ? "#b8433a" : "#d9776a"), [(k - 2.5) * 0.02, Math.sin(k * 1.4 + i) * 0.004, 0], r, { rot: [0, 0, Math.sin(k * 1.4 + i) * 0.3] });
    }
    add(new THREE.BoxGeometry(0.12, 0.0062, 0.008), mat("#f2d6c4"), [0, 0.001, 0.016], r);
  });
  // Sausages
  [[-0.11, -0.05, 0.4], [-0.08, -0.09, 0.2]].forEach(([x, z, ry]) =>
    add(new THREE.CapsuleGeometry(0.017, 0.07, 6, 12), mat("#8a4a26", { roughness: 0.45 }), [x, S + 0.017, z], plate, { rot: [0, ry, Math.PI / 2] })
  );
  // Beans
  add(new THREE.CylinderGeometry(0.048, 0.05, 0.008, 20), mat("#c8541f", { roughness: 0.3 }), [0.0, S + 0.002, -0.08], plate);
  const bean = new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 8, 6), mat("#d65f24", { roughness: 0.25 }), 26);
  const dummy = new THREE.Object3D();
  for (let k = 0; k < 26; k++) {
    const a = k * 2.4, rr = 0.04 * Math.sqrt(k / 26);
    dummy.position.set(Math.cos(a) * rr, S + 0.009 + (k % 3) * 0.002, -0.08 + Math.sin(a) * rr);
    dummy.scale.set(1.3, 0.9, 1);
    dummy.rotation.y = a;
    dummy.updateMatrix();
    bean.setMatrixAt(k, dummy.matrix);
  }
  bean.castShadow = true;
  plate.add(bean);
  // Mushrooms, tomato, black pudding, hash brown
  [[0.06, -0.12], [0.1, -0.09]].forEach(([x, z]) =>
    add(new THREE.SphereGeometry(0.022, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat("#5a3b2a"), [x, S, z], plate, { scale: [1, 0.6, 1] })
  );
  add(new THREE.SphereGeometry(0.028, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#d8352a", { roughness: 0.3 }), [0.14, S, 0.06], plate);
  add(new THREE.CircleGeometry(0.024, 16), mat("#f06a4a"), [0.14, S + 0.0005, 0.06], plate, { rot: [-Math.PI / 2, 0, 0], shadow: false });
  [[-0.13, 0.0], [-0.14, 0.05]].forEach(([x, z]) =>
    add(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16), mat("#2a1416"), [x, S + 0.006, z], plate)
  );
  add(new THREE.BoxGeometry(0.06, 0.016, 0.04), mat("#d79a3a", { roughness: 0.8 }), [0.06, S + 0.008, 0.03], plate, { rot: [0, -0.4, 0] });

  // Toast on a side plate
  add(new THREE.CylinderGeometry(0.09, 0.08, 0.012, 28), mat("#fbfbf8", { roughness: 0.25 }), [-0.42, TOP + 0.006, 0.05]);
  [0, 1].forEach((i) =>
    add(new THREE.BoxGeometry(0.1, 0.012, 0.1), mat(i ? "#d9a35a" : "#e3b36d", { roughness: 0.9 }), [-0.42 + i * 0.015, TOP + 0.02 + i * 0.012, 0.05 - i * 0.01], scene, { rot: [0, 0.3 + i * 0.4, 0] })
  );

  // Mug of tea with steam
  const mug = new THREE.Group();
  mug.position.set(0.4, TOP, 0.02);
  scene.add(mug);
  add(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 24, 1, true), mat("#ffffff", { side: THREE.DoubleSide, roughness: 0.3 }), [0, 0.05, 0], mug);
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 24), mat("#ffffff"), [0, 0.0025, 0], mug);
  add(new THREE.CylinderGeometry(0.043, 0.043, 0.004, 24), mat("#a86b3c", { roughness: 0.2 }), [0, 0.085, 0], mug);
  add(new THREE.TorusGeometry(0.026, 0.008, 8, 20, Math.PI), mat("#ffffff"), [0.048, 0.05, 0], mug, { rot: [0, 0, -Math.PI / 2] });
  const steamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false });
  const steam = Array.from({ length: 7 }, (_, k) => {
    const p = add(new THREE.SphereGeometry(0.018, 10, 8), steamMat.clone(), [0, 0.1, 0], mug, { shadow: false });
    p.userData.offset = k / 7;
    return p;
  });

  // Sauce bottles
  [[0.56, -0.32, "#c41e1e", "#1a1a1a"], [0.64, -0.26, "#4a2412", "#1a1a1a"]].forEach(([x, z, body, cap]) => {
    add(new THREE.CylinderGeometry(0.03, 0.034, 0.13, 16), mat(body, { roughness: 0.35 }), [x, TOP + 0.065, z]);
    add(new THREE.CylinderGeometry(0.014, 0.024, 0.04, 12), mat(body, { roughness: 0.35 }), [x, TOP + 0.15, z]);
    add(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12), mat(cap), [x, TOP + 0.18, z]);
  });

  // Knife and fork rest
  const steel = mat("#cfd3d6", { metalness: 0.8, roughness: 0.3 });

  // ---------- Tim (cartoon) ----------
  const skin = mat("#f1c6a6", { roughness: 0.6 });
  const shirt = mat("#f7f8fb", { roughness: 0.8 });
  const hairM = mat("#6b4a2e", { roughness: 0.9 });
  const tim = new THREE.Group();
  tim.position.set(0, 0, -0.62);
  scene.add(tim);
  // Chair back
  add(new THREE.BoxGeometry(0.5, 0.7, 0.05), mat("#2f1a47"), [0, 0.95, -0.2], tim);
  add(new THREE.BoxGeometry(0.5, 0.05, 0.45), mat("#2f1a47"), [0, 0.46, 0], tim);
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
  // Cutlery held in each hand
  const fork = new THREE.Group();
  scene.add(fork);
  add(new THREE.BoxGeometry(0.012, 0.004, 0.13), steel, [0, 0, 0.0], fork);
  for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.0025, 0.003, 0.035), steel, [(k - 1.5) * 0.0045, 0, 0.08], fork);
  const bite = add(new THREE.CapsuleGeometry(0.014, 0.02, 6, 10), mat("#8a4a26", { roughness: 0.45 }), [0, 0.012, 0.085], fork, { rot: [0, 0, Math.PI / 2] });
  const knife = new THREE.Group();
  scene.add(knife);
  add(new THREE.BoxGeometry(0.014, 0.004, 0.2), steel, [0, 0, 0.02], knife);

  const forkRest = new THREE.Vector3(0.09, TOP + 0.075, -0.13);
  const forkMouth = new THREE.Vector3(0.02, 1.38, -0.37); // hand under the chin, tines at the mouth
  const knifeHand = new THREE.Vector3(-0.1, TOP + 0.075, -0.14);
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
  scene.add(new THREE.HemisphereLight("#fff4e6", "#3b2350", 1.1));
  const sun = new THREE.DirectionalLight("#fff1dc", 2.2);
  sun.position.set(1.6, 3.2, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 2, bottom: -0.5, near: 0.5, far: 8 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const fill = new THREE.PointLight("#c9a0ff", 1.2, 6);
  fill.position.set(-1.5, 1.8, 1);
  scene.add(fill);

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
    if (c < 1.3) hand.x += Math.sin(c * 14) * 0.008; // a bit of sawing
    placeArm(arms[1], hand);
    fork.position.copy(hand);
    // Tines down into the plate at rest; turned round to face the mouth when lifted.
    fork.rotation.set(0.35 + up * 0.1, 0.25 + up * (Math.PI - 0.25), 0);
    bite.visible = !(c > 2.35 && c < 3.9);

    const knifePos = knifeHand.clone();
    knifePos.x += c < 1.3 ? Math.sin(c * 14 + 1) * 0.012 : 0;
    placeArm(arms[0], knifePos);
    knife.position.copy(knifePos);
    knife.rotation.set(0.3, -0.35, 0);

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
