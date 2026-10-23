import { PresetArtwork } from '../types/puzzle';

/**
 * Procedural Canvas Artworks.
 * These generate rich, high-resolution artistic scenes directly into HTML5 canvases,
 * completely offline with zero external network dependencies or broken URLs.
 */

function createAlpineLake(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 480);
  skyGrad.addColorStop(0, '#1e3a8a');
  skyGrad.addColorStop(0.4, '#3b82f6');
  skyGrad.addColorStop(0.7, '#93c5fd');
  skyGrad.addColorStop(1, '#fed7aa');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 480);

  // Warm sun
  const sunGrad = ctx.createRadialGradient(850, 180, 10, 850, 180, 140);
  sunGrad.addColorStop(0, '#fffbeb');
  sunGrad.addColorStop(0.3, '#fef08a');
  sunGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.4)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(850, 180, 140, 0, Math.PI * 2);
  ctx.fill();

  // Distant soft mountains
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(0, 440);
  ctx.lineTo(150, 260);
  ctx.lineTo(320, 340);
  ctx.lineTo(520, 220);
  ctx.lineTo(760, 360);
  ctx.lineTo(950, 240);
  ctx.lineTo(1200, 440);
  ctx.closePath();
  ctx.fill();

  // Mid-ground rugged snow peaks
  const peakGrad = ctx.createLinearGradient(0, 160, 0, 500);
  peakGrad.addColorStop(0, '#e2e8f0');
  peakGrad.addColorStop(0.5, '#475569');
  peakGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = peakGrad;
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.lineTo(240, 170);
  ctx.lineTo(460, 380);
  ctx.lineTo(650, 140);
  ctx.lineTo(820, 320);
  ctx.lineTo(1040, 180);
  ctx.lineTo(1200, 480);
  ctx.closePath();
  ctx.fill();

  // Snow caps
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(240, 170);
  ctx.lineTo(210, 220);
  ctx.lineTo(250, 240);
  ctx.lineTo(270, 210);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(650, 140);
  ctx.lineTo(600, 210);
  ctx.lineTo(640, 230);
  ctx.lineTo(670, 200);
  ctx.lineTo(700, 225);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(1040, 180);
  ctx.lineTo(1000, 230);
  ctx.lineTo(1050, 250);
  ctx.lineTo(1075, 220);
  ctx.closePath();
  ctx.fill();

  // Pine tree forest layer along mountain base
  ctx.fillStyle = '#064e3b';
  for (let x = 0; x < 1200; x += 14) {
    const treeH = 35 + Math.sin(x * 0.05) * 18 + ((x * 17) % 25);
    ctx.beginPath();
    ctx.moveTo(x, 480);
    ctx.lineTo(x + 7, 480 - treeH);
    ctx.lineTo(x + 14, 480);
    ctx.fill();
  }

  // Turquoise Glacial Lake
  const lakeGrad = ctx.createLinearGradient(0, 480, 0, 900);
  lakeGrad.addColorStop(0, '#0284c7');
  lakeGrad.addColorStop(0.3, '#0891b2');
  lakeGrad.addColorStop(0.7, '#0f766e');
  lakeGrad.addColorStop(1, '#064e3b');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, 480, 1200, 420);

  // Water reflections (soft blurred horizontal strokes)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  for (let y = 500; y < 880; y += 16) {
    ctx.beginPath();
    const startX = 200 + Math.sin(y) * 120;
    const len = 400 + Math.cos(y * 2) * 200;
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + len, y);
    ctx.stroke();
  }

  // Fore-shore grass and stone elements
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(0, 800);
  ctx.bezierCurveTo(200, 780, 450, 860, 600, 900);
  ctx.closePath();
  ctx.fill();

  // Wildflower dots
  const flowerColors = ['#f43f5e', '#facc15', '#a855f7', '#ffffff'];
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    const fx = 20 + ((i * 37) % 360);
    const fy = 810 + ((i * 23) % 80);
    ctx.beginPath();
    ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function createSunsetCoast(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Sunset sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, 520);
  sky.addColorStop(0, '#4c1d95');
  sky.addColorStop(0.3, '#be185d');
  sky.addColorStop(0.6, '#ea580c');
  sky.addColorStop(0.85, '#f59e0b');
  sky.addColorStop(1, '#fef08a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1200, 520);

  // Brilliant setting sun
  const sun = ctx.createRadialGradient(400, 480, 5, 400, 480, 120);
  sun.addColorStop(0, '#ffffff');
  sun.addColorStop(0.3, '#fef08a');
  sun.addColorStop(0.6, '#fb923c');
  sun.addColorStop(1, 'transparent');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(400, 480, 120, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  ctx.fillStyle = 'rgba(124, 45, 18, 0.35)';
  ctx.beginPath();
  ctx.ellipse(320, 220, 220, 30, -0.05, 0, Math.PI * 2);
  ctx.ellipse(750, 280, 280, 38, 0.04, 0, Math.PI * 2);
  ctx.ellipse(180, 340, 160, 24, 0.02, 0, Math.PI * 2);
  ctx.fill();

  // Ocean
  const ocean = ctx.createLinearGradient(0, 520, 0, 900);
  ocean.addColorStop(0, '#c2410c');
  ocean.addColorStop(0.15, '#9a3412');
  ocean.addColorStop(0.4, '#1e293b');
  ocean.addColorStop(1, '#0f172a');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 520, 1200, 380);

  // Sun trail on water
  const trail = ctx.createLinearGradient(400, 520, 400, 900);
  trail.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
  trail.addColorStop(0.5, 'rgba(251, 146, 60, 0.5)');
  trail.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = trail;
  ctx.beginPath();
  ctx.moveTo(380, 520);
  ctx.lineTo(420, 520);
  ctx.lineTo(540, 900);
  ctx.lineTo(260, 900);
  ctx.closePath();
  ctx.fill();

  // Ocean wave crests
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2.5;
  for (let y = 540; y < 880; y += 22) {
    ctx.beginPath();
    for (let x = 0; x < 1200; x += 15) {
      const waveOffset = Math.sin(x * 0.04 + y) * 4;
      if (x === 0) ctx.moveTo(x, y + waveOffset);
      else ctx.lineTo(x, y + waveOffset);
    }
    ctx.stroke();
  }

  // Dramatic Coastal Cliffs on right
  const cliff = ctx.createLinearGradient(800, 360, 1200, 900);
  cliff.addColorStop(0, '#292524');
  cliff.addColorStop(0.7, '#1c1917');
  cliff.addColorStop(1, '#0c0a09');
  ctx.fillStyle = cliff;
  ctx.beginPath();
  ctx.moveTo(1200, 900);
  ctx.lineTo(760, 900);
  ctx.bezierCurveTo(800, 750, 830, 620, 870, 540);
  ctx.lineTo(920, 420);
  ctx.lineTo(960, 370);
  ctx.lineTo(1200, 330);
  ctx.closePath();
  ctx.fill();

  // Lighthouse silhouette on the cliff top
  ctx.fillStyle = '#0c0a09';
  ctx.fillRect(950, 310, 16, 60);
  ctx.fillRect(944, 304, 28, 8);
  ctx.beginPath();
  ctx.arc(958, 298, 8, 0, Math.PI * 2);
  ctx.fill();

  // Lighthouse light beam
  const beam = ctx.createRadialGradient(958, 298, 2, 600, 240, 400);
  beam.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  beam.addColorStop(0.3, 'rgba(254, 240, 138, 0.4)');
  beam.addColorStop(1, 'transparent');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(958, 298);
  ctx.lineTo(450, 210);
  ctx.lineTo(470, 270);
  ctx.closePath();
  ctx.fill();

  // Soaring seagulls
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  [[250, 180, 18], [300, 150, 22], [340, 195, 14], [620, 230, 16]].forEach(([gx, gy, sz]) => {
    ctx.beginPath();
    ctx.arc(gx - sz / 2, gy, sz / 2, Math.PI, 0, false);
    ctx.arc(gx + sz / 2, gy, sz / 2, Math.PI, 0, false);
    ctx.stroke();
  });

  return canvas;
}

function createCosmicNebula(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Deep space void
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 1200, 900);

  // Large glowing cosmic nebula clouds
  const clouds = [
    { x: 450, y: 400, r: 380, col: 'rgba(168, 85, 247, 0.45)' }, // Purple
    { x: 680, y: 450, r: 340, col: 'rgba(236, 72, 153, 0.40)' }, // Magenta
    { x: 550, y: 550, r: 360, col: 'rgba(59, 130, 246, 0.35)' },  // Blue
    { x: 380, y: 320, r: 240, col: 'rgba(6, 182, 212, 0.30)' },   // Cyan
    { x: 780, y: 360, r: 220, col: 'rgba(244, 63, 94, 0.35)' },   // Rose
  ];

  clouds.forEach(({ x, y, r, col }) => {
    const rad = ctx.createRadialGradient(x, y, 10, x, y, r);
    rad.addColorStop(0, col);
    rad.addColorStop(0.5, col.replace(/[\d.]+\)$/, '0.15)'));
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cosmic dust swirls (spiral arms)
  ctx.lineWidth = 18;
  for (let arm = 0; arm < 3; arm++) {
    const armAngle = (arm * Math.PI * 2) / 3;
    ctx.strokeStyle = arm === 0 ? 'rgba(236, 72, 153, 0.2)' : arm === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(192, 132, 252, 0.2)';
    ctx.beginPath();
    for (let theta = 0; theta < Math.PI * 3.5; theta += 0.08) {
      const radius = 25 + theta * 32;
      const x = 580 + Math.cos(theta + armAngle) * radius;
      const y = 450 + Math.sin(theta + armAngle) * radius * 0.75;
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Glittering starfield
  for (let i = 0; i < 350; i++) {
    const sx = ((i * 12347) % 1190) + 5;
    const sy = ((i * 23497) % 890) + 5;
    const size = ((i % 7) === 0 ? 2.5 : (i % 3 === 0 ? 1.8 : 1.0));
    const alpha = 0.3 + ((i % 10) * 0.07);

    ctx.fillStyle = (i % 11 === 0 ? '#93c5fd' : i % 13 === 0 ? '#fbcfe8' : '#ffffff');
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();

    // Cross diffraction spikes on brightest stars
    if (size > 2.0 && i % 4 === 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 10, sy);
      ctx.lineTo(sx + 10, sy);
      ctx.moveTo(sx, sy - 10);
      ctx.lineTo(sx, sy + 10);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;

  // Luminous core super-star
  const coreGrad = ctx.createRadialGradient(580, 450, 4, 580, 450, 90);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#fef08a');
  coreGrad.addColorStop(0.7, 'rgba(244, 114, 182, 0.3)');
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(580, 450, 90, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function createKyotoGarden(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Morning mist background
  const mist = ctx.createLinearGradient(0, 0, 0, 900);
  mist.addColorStop(0, '#f1f5f9');
  mist.addColorStop(0.4, '#e2e8f0');
  mist.addColorStop(0.7, '#cbd5e1');
  mist.addColorStop(1, '#94a3b8');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, 1200, 900);

  // Distant bamboo grove silhouettes
  ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
  for (let x = 60; x < 1140; x += 18) {
    const bh = 300 + Math.sin(x * 0.1) * 60;
    ctx.fillRect(x, 200 - bh, 6, bh + 300);
  }

  // Koi Pond Water
  const pond = ctx.createLinearGradient(0, 450, 0, 900);
  pond.addColorStop(0, '#047857');
  pond.addColorStop(0.5, '#065f46');
  pond.addColorStop(1, '#064e3b');
  ctx.fillStyle = pond;
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(350, 440, 800, 490, 1200, 460);
  ctx.lineTo(1200, 900);
  ctx.lineTo(0, 900);
  ctx.closePath();
  ctx.fill();

  // Water ripples
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  [[350, 560, 50], [700, 640, 75], [920, 530, 40], [220, 720, 60]].forEach(([rx, ry, rad]) => {
    ctx.beginPath();
    ctx.ellipse(rx, ry, rad, rad * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Lily pads
  const padColors = ['#15803d', '#166534', '#22c55e'];
  [[300, 620, 24], [350, 650, 30], [800, 700, 26], [840, 730, 32], [600, 780, 28]].forEach(([px, py, pr], idx) => {
    ctx.fillStyle = padColors[idx % padColors.length];
    ctx.beginPath();
    ctx.arc(px, py, pr, 0.2, Math.PI * 1.85);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();
  });

  // Traditional Arched Red Bridge (Taiko-bashi)
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(600, 560, 260, Math.PI * 1.25, Math.PI * 1.75);
  ctx.stroke();

  // Bridge handrails & posts
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(600, 535, 265, Math.PI * 1.25, Math.PI * 1.75);
  ctx.stroke();

  for (let a = Math.PI * 1.26; a <= Math.PI * 1.74; a += 0.08) {
    const postX1 = 600 + Math.cos(a) * 260;
    const postY1 = 560 + Math.sin(a) * 260;
    const postX2 = 600 + Math.cos(a) * 235;
    const postY2 = 560 + Math.sin(a) * 235;
    ctx.beginPath();
    ctx.moveTo(postX1, postY1);
    ctx.lineTo(postX2, postY2);
    ctx.stroke();
  }

  // Stone lantern (Tōrō) on right bank
  ctx.fillStyle = '#64748b';
  ctx.fillRect(1000, 480, 32, 60); // base
  ctx.fillRect(990, 460, 52, 20);  // light box
  ctx.fillStyle = '#fef08a';       // warm light glow
  ctx.fillRect(1002, 465, 28, 12);
  ctx.fillStyle = '#475569';       // pagoda roof
  ctx.beginPath();
  ctx.moveTo(980, 460);
  ctx.lineTo(1052, 460);
  ctx.lineTo(1016, 425);
  ctx.closePath();
  ctx.fill();

  // Vibrant Japanese Red & Gold Maple Leaves (Momiji) framing top & sides
  const leafColors = ['#dc2626', '#b91c1c', '#f97316', '#eab308'];
  for (let i = 0; i < 90; i++) {
    const lx = (i < 50 ? (i * 28) % 450 : 800 + ((i * 24) % 400));
    const ly = 30 + ((i * 29) % 280);
    const col = leafColors[i % leafColors.length];
    const size = 12 + (i % 8);

    ctx.fillStyle = col;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate((i * 0.4) % (Math.PI * 2));
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.7, -size * 0.7, size, 0, 0, size);
    ctx.bezierCurveTo(-size, 0, -size * 0.7, -size * 0.7, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  return canvas;
}

export const PRESET_ARTWORKS: PresetArtwork[] = [
  {
    id: 'alpine',
    title: 'Emerald Alpine Serenity',
    author: 'Tabletop Atelier',
    category: 'Landscape',
    generate: createAlpineLake,
  },
  {
    id: 'sunset',
    title: 'Golden Coastline Sunset',
    author: 'Tabletop Atelier',
    category: 'Seascape',
    generate: createSunsetCoast,
  },
  {
    id: 'nebula',
    title: 'Deep Cosmic Nebula',
    author: 'Tabletop Atelier',
    category: 'Astronomy',
    generate: createCosmicNebula,
  },
  {
    id: 'garden',
    title: 'Kyoto Autumn Garden',
    author: 'Tabletop Atelier',
    category: 'Architecture',
    generate: createKyotoGarden,
  },
];
