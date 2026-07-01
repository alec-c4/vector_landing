const canvas = document.getElementById('hero-sphere') as HTMLCanvasElement | null;
if (canvas && window.matchMedia('(min-width: 768px)').matches) {
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas!.width = canvas!.offsetWidth * dpr;
    canvas!.height = canvas!.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  new ResizeObserver(() => { ctx.resetTransform(); resize(); }).observe(canvas);

  const phi = (1 + Math.sqrt(5)) / 2;
  const verts: [number, number, number][] = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map((v) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / l) as [number, number, number];
  });
  let faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  function subdivide(v: [number, number, number][], f: [number, number, number][], n: number) {
    for (let iter = 0; iter < n; iter++) {
      const nf: [number, number, number][] = [];
      const mid: Record<string, number> = {};
      const getMid = (a: number, b: number) => {
        const k = `${Math.min(a, b)}_${Math.max(a, b)}`;
        if (mid[k] != null) return mid[k];
        const va = v[a];
        const vb = v[b];
        const m: [number, number, number] = [(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2];
        const l = Math.hypot(...m);
        m[0] /= l;
        m[1] /= l;
        m[2] /= l;
        return mid[k] = v.push(m) - 1;
      };
      for (const [a, b, c] of f) {
        const ab = getMid(a, b);
        const bc = getMid(b, c);
        const ca = getMid(c, a);
        nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      }
      f = nf;
    }
    return { v, f };
  }

  const outerR = 2;
  const innerR = 1.2;
  const { v: ov, f: of2 } = subdivide(verts.map((v) => [...v] as [number, number, number]), faces, 3);
  const scaled = ov.map((v) => [v[0] * outerR, v[1] * outerR, v[2] * outerR] as [number, number, number]);

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of of2) {
    for (const [x, y] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const k = `${Math.min(x, y)}_${Math.max(x, y)}`;
      if (!edgeSet.has(k)) { edgeSet.add(k); edges.push([x, y]); }
    }
  }

  const v2: [number, number, number][] = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map((v) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / l) as [number, number, number];
  });
  const { v: iv, f: if2 } = subdivide(v2, [...faces], 1);
  const scaled2 = iv.map((v) => [v[0] * innerR, v[1] * innerR, v[2] * innerR] as [number, number, number]);
  const edgeSet2 = new Set<string>();
  const edges2: [number, number][] = [];
  for (const [a, b, c] of if2) {
    for (const [x, y] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const k = `${Math.min(x, y)}_${Math.max(x, y)}`;
      if (!edgeSet2.has(k)) { edgeSet2.add(k); edges2.push([x, y]); }
    }
  }

  const PARTS = 800;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < PARTS; i++) {
    const r = 1.6 + Math.random() * 0.4;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pts.push([r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)]);
  }

  let ry = 0;
  let rx = 0;
  let rz = 0;
  let pry = 0;
  let prx = 0;
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
  });

  function rotY(v: [number, number, number], a: number): [number, number, number] {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  }
  function rotX(v: [number, number, number], a: number): [number, number, number] {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  }
  function rotZ(v: [number, number, number], a: number): [number, number, number] {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  }

  const CAM_Z = 5;
  const FL_HALF_ANGLE = Math.tan(25 * Math.PI / 180);
  function project(v: [number, number, number], w: number, h: number): [number, number, number] {
    const dz = CAM_Z - v[2];
    if (dz <= 0.01) return [w / 2, h / 2, 0.01];
    const fl = (h * 0.5) / FL_HALF_ANGLE;
    const scale = fl / dz;
    return [w / 2 + v[0] * scale, h / 2 - v[1] * scale, dz];
  }

  let elapsed = 0;
  let last = performance.now();

  function frame() {
    requestAnimationFrame(frame);
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    elapsed += dt;

    ry += dt * 0.15;
    rx = Math.sin(elapsed * 0.3) * 0.15 + mouseY * 0.2;
    rz = mouseX * 0.1;
    pry -= dt * 0.08;
    prx += dt * 0.04;
    const breathe = 1 + Math.sin(elapsed * 0.9) * 0.18;

    const W = canvas!.offsetWidth;
    const H = canvas!.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    const xfOuter = scaled.map((v) => {
      const b: [number, number, number] = [v[0] * breathe, v[1] * breathe, v[2] * breathe];
      return project(rotZ(rotX(rotY(b, ry), rx), rz), W, H);
    });
    const xfInner = scaled2.map((v) => {
      const rotated = rotZ(rotX(rotY(rotX(rotY(v, 0.3), 0.5), ry), rx), rz);
      return project(rotated, W, H);
    });
    const xfParts = pts.map((v) => project(rotX(rotY(v, pry), prx), W, H));

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(167,139,250,0.55)';
    ctx.lineWidth = 0.8;
    for (const [a, b] of edges) {
      const pa = xfOuter[a];
      const pb = xfOuter[b];
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(139,92,246,0.4)';
    ctx.lineWidth = 0.6;
    for (const [a, b] of edges2) {
      const pa = xfInner[a];
      const pb = xfInner[b];
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(125,211,252,0.9)';
    for (const p of xfParts) {
      const size = 1.5 / (p[2] / CAM_Z);
      ctx.beginPath();
      ctx.arc(p[0], p[1], Math.max(0.3, size * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  frame();
}
