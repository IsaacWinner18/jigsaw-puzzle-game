import { PuzzleLevel } from '../types/puzzle';

/**
 * Procedural Art Generators for Campaign Levels.
 * Generates vivid, high-contrast, beautiful art pieces at 1000x750 (4:3 aspect ratio).
 */

function makeBaseCanvas(w: number = 1000, h: number = 750) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx, w, h };
}

const levelImageCache = new Map<string, HTMLImageElement>();

export function preloadLevelImage(url: string) {
  if (typeof window === 'undefined' || !url || levelImageCache.has(url)) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  levelImageCache.set(url, img);
}

function createLevelImageCanvasGenerator(
  imageUrl: string,
  fallbackFn: (w?: number, h?: number) => HTMLCanvasElement
): (w?: number, h?: number) => HTMLCanvasElement {
  return (w: number = 1000, h: number = 750) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    if (typeof window !== 'undefined') {
      let img = levelImageCache.get(imageUrl);
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        levelImageCache.set(imageUrl, img);
      }

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, w, h);
        return canvas;
      }

      // Draw rich procedural fallback while image loads
      const fallback = fallbackFn(w, h);
      ctx.drawImage(fallback, 0, 0, w, h);

      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      };
      return canvas;
    }

    return fallbackFn(w, h);
  };
}

// 1. Morning Sunflower
function drawSunflower(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#38bdf8');
  sky.addColorStop(0.7, '#bae6fd');
  sky.addColorStop(1, '#86efac');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Big glowing sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(850, 140, 80, 0, Math.PI * 2);
  ctx.fill();

  // Green stem and leaves
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(500, 750);
  ctx.bezierCurveTo(490, 600, 520, 480, 500, 380);
  ctx.stroke();

  // Leaves
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(380, 560, 110, 45, -0.4, 0, Math.PI * 2);
  ctx.ellipse(630, 510, 120, 50, 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Sunflower petals
  const cx = 500, cy = 360, petalCount = 20;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i * Math.PI * 2) / petalCount;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#eab308';
    ctx.beginPath();
    ctx.ellipse(150, 0, 100, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sunflower central disc
  const disc = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100);
  disc.addColorStop(0, '#451a03');
  disc.addColorStop(0.8, '#78350f');
  disc.addColorStop(1, '#b45309');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, 95, 0, Math.PI * 2);
  ctx.fill();

  // Seed pattern dots
  ctx.fillStyle = '#292524';
  for (let r = 15; r < 85; r += 14) {
    const dots = Math.floor(r * 0.7);
    for (let d = 0; d < dots; d++) {
      const a = (d * Math.PI * 2) / dots + r * 0.1;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

// 2. Cozy Cottage
function drawCozyCottage(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, 450);
  sky.addColorStop(0, '#60a5fa');
  sky.addColorStop(1, '#fed7aa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 450);

  // Soft rolling hills
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(200, 580, 400, 0, Math.PI * 2);
  ctx.arc(800, 560, 450, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 480, w, 270);

  // Cottage Body
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(360, 360, 280, 200);

  // Stone Chimney
  ctx.fillStyle = '#64748b';
  ctx.fillRect(570, 230, 45, 120);
  // Smoke puffs
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(590, 200, 16, 0, Math.PI * 2);
  ctx.arc(605, 170, 22, 0, Math.PI * 2);
  ctx.arc(630, 135, 28, 0, Math.PI * 2);
  ctx.fill();

  // Roof (Terracotta Red)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(330, 360);
  ctx.lineTo(500, 240);
  ctx.lineTo(670, 360);
  ctx.closePath();
  ctx.fill();

  // Wooden Door
  ctx.fillStyle = '#b45309';
  ctx.fillRect(475, 440, 50, 120);
  // Door handle
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(485, 500, 4, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Windows
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(390, 400, 55, 55);
  ctx.fillRect(555, 400, 55, 55);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(390, 400, 55, 55);
  ctx.strokeRect(555, 400, 55, 55);

  // Cobblestone path
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(475, 560);
  ctx.lineTo(525, 560);
  ctx.bezierCurveTo(560, 650, 430, 700, 460, 750);
  ctx.lineTo(390, 750);
  ctx.bezierCurveTo(390, 700, 450, 650, 475, 560);
  ctx.fill();

  // Picket fence
  ctx.fillStyle = '#ffffff';
  for (let x = 120; x < 350; x += 32) {
    ctx.fillRect(x, 480, 14, 80);
    ctx.beginPath();
    ctx.moveTo(x, 480);
    ctx.lineTo(x + 7, 465);
    ctx.lineTo(x + 14, 480);
    ctx.fill();
  }
  ctx.fillRect(110, 500, 250, 10);

  return canvas;
}

// 3. Hot Air Balloons
function drawHotAirBalloons(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0284c7');
  sky.addColorStop(0.5, '#7dd3fc');
  sky.addColorStop(1, '#ffedd5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Mountains below
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.moveTo(0, 750);
  ctx.lineTo(200, 600);
  ctx.lineTo(450, 680);
  ctx.lineTo(750, 560);
  ctx.lineTo(1000, 750);
  ctx.fill();

  // Main Hot Air Balloon (Center-Left)
  const bx = 380, by = 280, br = 120;
  const stripes = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = stripes[i];
    ctx.beginPath();
    ctx.ellipse(bx, by, br - i * 16, br + 25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Basket
  ctx.fillStyle = '#78350f';
  ctx.fillRect(bx - 22, by + br + 45, 44, 35);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 30, by + br + 20);
  ctx.lineTo(bx - 18, by + br + 45);
  ctx.moveTo(bx + 30, by + br + 20);
  ctx.lineTo(bx + 18, by + br + 45);
  ctx.stroke();

  // Secondary Balloon (Distant, Right)
  const b2x = 750, b2y = 190, b2r = 65;
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.ellipse(b2x, b2y, b2r, b2r + 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(b2x, b2y, b2r - 20, b2r + 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(b2x - 12, b2y + b2r + 24, 24, 20);

  return canvas;
}

// 4. Emerald Alpine Lake
function drawAlpineLake(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, '#1e3a8a');
  sky.addColorStop(0.5, '#38bdf8');
  sky.addColorStop(1, '#fde68a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 420);

  // Snow Peaks
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.lineTo(250, 150);
  ctx.lineTo(500, 320);
  ctx.lineTo(750, 120);
  ctx.lineTo(1000, 420);
  ctx.fill();

  // Snow
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(250, 150);
  ctx.lineTo(210, 220);
  ctx.lineTo(290, 220);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(750, 120);
  ctx.lineTo(690, 210);
  ctx.lineTo(810, 210);
  ctx.fill();

  // Pine Forest
  ctx.fillStyle = '#064e3b';
  for (let x = 0; x < w; x += 18) {
    const th = 40 + Math.sin(x * 0.05) * 15;
    ctx.beginPath();
    ctx.moveTo(x, 420);
    ctx.lineTo(x + 9, 420 - th);
    ctx.lineTo(x + 18, 420);
    ctx.fill();
  }

  // Turquoise Lake
  const lake = ctx.createLinearGradient(0, 420, 0, h);
  lake.addColorStop(0, '#0284c7');
  lake.addColorStop(0.5, '#0d9488');
  lake.addColorStop(1, '#064e3b');
  ctx.fillStyle = lake;
  ctx.fillRect(0, 420, w, h - 420);

  // Reflection streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  for (let y = 460; y < h; y += 22) {
    ctx.beginPath();
    ctx.moveTo(200, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }

  return canvas;
}

// 5. Tropical Toucan
function drawToucan(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  // Lush jungle backdrop
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 0, w, h);

  // Big monstera leaves in background
  ctx.fillStyle = '#047857';
  for (let i = 0; i < 8; i++) {
    const lx = (i * 140) % w;
    const ly = 100 + ((i * 90) % 500);
    ctx.beginPath();
    ctx.ellipse(lx, ly, 150, 90, (i * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Branch
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 35;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.bezierCurveTo(300, 480, 700, 560, 1000, 500);
  ctx.stroke();

  // Toucan Body (Black)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(480, 380, 95, 140, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // White Throat Bib
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(440, 320, 55, 75, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Toucan Eye
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(430, 290, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(430, 290, 7, 0, Math.PI * 2);
  ctx.fill();

  // Massive Bright Orange & Yellow Beak
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(420, 270);
  ctx.bezierCurveTo(300, 240, 180, 320, 160, 380);
  ctx.bezierCurveTo(240, 410, 380, 380, 420, 340);
  ctx.closePath();
  ctx.fill();

  // Beak Tip (Red & Black)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(220, 335);
  ctx.lineTo(160, 380);
  ctx.lineTo(240, 400);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(170, 375, 12, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// 6. Sunset Coast
function drawSunsetCoast(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, 460);
  sky.addColorStop(0, '#581c87');
  sky.addColorStop(0.3, '#c026d3');
  sky.addColorStop(0.6, '#f97316');
  sky.addColorStop(1, '#fef08a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 460);

  // Big setting sun
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(350, 440, 70, 0, Math.PI * 2);
  ctx.fill();

  // Ocean
  const ocean = ctx.createLinearGradient(0, 460, 0, h);
  ocean.addColorStop(0, '#c2410c');
  ocean.addColorStop(0.4, '#1e293b');
  ocean.addColorStop(1, '#0f172a');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 460, w, h - 460);

  // Cliff & Lighthouse
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(1000, h);
  ctx.lineTo(700, h);
  ctx.bezierCurveTo(740, 600, 780, 500, 840, 430);
  ctx.lineTo(1000, 360);
  ctx.closePath();
  ctx.fill();

  // Lighthouse
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(860, 330, 24, 75);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(860, 350, 24, 18);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(866, 316, 12, 14);

  return canvas;
}

// 7. Kyoto Autumn Garden
function drawKyotoGarden(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, w, h);

  // Pond
  const pond = ctx.createLinearGradient(0, 350, 0, h);
  pond.addColorStop(0, '#047857');
  pond.addColorStop(1, '#064e3b');
  ctx.fillStyle = pond;
  ctx.fillRect(0, 350, w, h - 350);

  // Arched Red Bridge
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(500, 450, 200, Math.PI * 1.25, Math.PI * 1.75);
  ctx.stroke();

  // Maple leaves frame
  const leafCols = ['#dc2626', '#f97316', '#eab308'];
  for (let i = 0; i < 70; i++) {
    const lx = (i < 35 ? (i * 26) % 350 : 650 + ((i * 24) % 350));
    const ly = 30 + ((i * 23) % 240);
    ctx.fillStyle = leafCols[i % leafCols.length];
    ctx.beginPath();
    ctx.arc(lx, ly, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// 8. Desert Dunes
function drawDesertDunes(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#0284c7');
  sky.addColorStop(1, '#ffedd5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 400);

  // Sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(800, 160, 60, 0, Math.PI * 2);
  ctx.fill();

  // Distant Pyramids
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(350, 400);
  ctx.lineTo(460, 260);
  ctx.lineTo(570, 400);
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(460, 260);
  ctx.lineTo(570, 400);
  ctx.lineTo(640, 400);
  ctx.fill();

  // Sand Dunes
  const duneGrad = ctx.createLinearGradient(0, 400, 0, h);
  duneGrad.addColorStop(0, '#f59e0b');
  duneGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = duneGrad;
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.bezierCurveTo(250, 360, 400, 460, 700, 420);
  ctx.bezierCurveTo(850, 400, 950, 450, 1000, 430);
  ctx.lineTo(1000, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Second dune ridge
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(0, 540);
  ctx.bezierCurveTo(350, 520, 600, 640, 1000, 580);
  ctx.lineTo(1000, h);
  ctx.lineTo(0, h);
  ctx.fill();

  return canvas;
}

// 9. Coral Reef
function drawCoralReef(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, '#0284c7');
  sea.addColorStop(0.5, '#0891b2');
  sea.addColorStop(1, '#0f172a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);

  // Coral Formations
  const coralColors = ['#f43f5e', '#a855f7', '#fb923c', '#eab308'];
  for (let x = 60; x < w; x += 110) {
    ctx.fillStyle = coralColors[(x / 110) % coralColors.length];
    const ch = 120 + ((x * 19) % 180);
    ctx.beginPath();
    ctx.moveTo(x - 30, h);
    ctx.bezierCurveTo(x - 40, h - ch * 0.7, x + 40, h - ch * 0.7, x + 30, h);
    ctx.fill();
  }

  // Clownfish
  const fx = 480, fy = 340;
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(fx, fy, 65, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  // White stripes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(fx - 15, fy - 35, 14, 70);
  ctx.fillRect(fx + 20, fy - 25, 12, 50);

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(fx - 40, fy - 8, 5, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// 10. The Enchanted Castle (Milestone 1)
function drawEnchantedCastle(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  // Twilight Sky
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#312e81');
  sky.addColorStop(0.5, '#7c3aed');
  sky.addColorStop(1, '#f472b6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 480);

  // Full Moon
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(220, 180, 75, 0, Math.PI * 2);
  ctx.fill();

  // Castle Spires
  ctx.fillStyle = '#1e1b4b';
  // Central Keep
  ctx.fillRect(400, 280, 200, 260);
  // Spire cone
  ctx.beginPath();
  ctx.moveTo(380, 280);
  ctx.lineTo(500, 110);
  ctx.lineTo(620, 280);
  ctx.fill();

  // Left Tower
  ctx.fillRect(290, 320, 90, 220);
  ctx.beginPath();
  ctx.moveTo(275, 320);
  ctx.lineTo(335, 180);
  ctx.lineTo(395, 320);
  ctx.fill();

  // Right Tower
  ctx.fillRect(620, 320, 90, 220);
  ctx.beginPath();
  ctx.moveTo(605, 320);
  ctx.lineTo(665, 180);
  ctx.lineTo(725, 320);
  ctx.fill();

  // Golden Windows
  ctx.fillStyle = '#fde047';
  ctx.fillRect(480, 340, 40, 60);
  ctx.fillRect(320, 380, 30, 45);
  ctx.fillRect(650, 380, 30, 45);

  // Forest & River below
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 540, w, h - 540);

  return canvas;
}

// 11-20: World 2 Artworks (Intermediate)
function drawBambooForest(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  ctx.fillStyle = '#ecfccb';
  ctx.fillRect(0, 0, w, h);
  for (let x = 20; x < w; x += 35) {
    ctx.fillStyle = (x % 70 === 0) ? '#15803d' : '#4ade80';
    ctx.fillRect(x, 0, 18, h);
    // Joints
    for (let y = 50; y < h; y += 90) {
      ctx.fillStyle = '#14532d';
      ctx.fillRect(x - 2, y, 22, 6);
    }
  }
  return canvas;
}

function drawVenetianGondola(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#38bdf8');
  sky.addColorStop(1, '#fdba74');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 400);

  // Venice Canal Water
  const water = ctx.createLinearGradient(0, 400, 0, h);
  water.addColorStop(0, '#0284c7');
  water.addColorStop(1, '#0f172a');
  ctx.fillStyle = water;
  ctx.fillRect(0, 400, w, h - 400);

  // Venetian Buildings
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(50, 180, 240, 240);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(700, 150, 260, 270);

  // Gondola
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(500, 560, 160, 30, 0.05, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function drawAurora(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, w, h);

  // Aurora curtains
  const aGrad = ctx.createLinearGradient(0, 80, 0, 450);
  aGrad.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
  aGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
  aGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = aGrad;
  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.bezierCurveTo(300, 60, 700, 260, 1000, 120);
  ctx.lineTo(1000, 480);
  ctx.lineTo(0, 480);
  ctx.fill();

  // Snowy mountains
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(250, 460);
  ctx.lineTo(550, 520);
  ctx.lineTo(850, 440);
  ctx.lineTo(1000, h);
  ctx.fill();

  return canvas;
}

function drawRoyalPalace(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, '#1e3a8a');
  sky.addColorStop(1, '#fed7aa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, 420);

  // Palace Facade
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(150, 240, 700, 240);

  // Classical Columns
  ctx.fillStyle = '#cbd5e1';
  for (let x = 200; x <= 800; x += 60) {
    ctx.fillRect(x, 260, 18, 220);
  }

  // Golden Dome
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(500, 240, 95, Math.PI, 0);
  ctx.fill();

  // Grand Courtyard Tiles
  const yard = ctx.createLinearGradient(0, 480, 0, h);
  yard.addColorStop(0, '#334155');
  yard.addColorStop(1, '#0f172a');
  ctx.fillStyle = yard;
  ctx.fillRect(0, 480, w, h - 480);

  return canvas;
}

// 21-25: World 3 Artworks (The Master Collection)
function drawCosmicNebula(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  const colors = ['rgba(168, 85, 247, 0.4)', 'rgba(236, 72, 153, 0.4)', 'rgba(6, 182, 212, 0.3)'];
  [[400, 350, 300], [650, 400, 280], [500, 480, 250]].forEach(([x, y, r], idx) => {
    const rad = ctx.createRadialGradient(x, y, 10, x, y, r);
    rad.addColorStop(0, colors[idx]);
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Hundreds of fine stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 200; i++) {
    const sx = ((i * 1337) % w);
    const sy = ((i * 3137) % h);
    ctx.fillRect(sx, sy, (i % 5 === 0 ? 3 : 1.5), (i % 5 === 0 ? 3 : 1.5));
  }

  return canvas;
}

function drawStainedGlass(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  const cx = 500, cy = 375;
  const colors = ['#dc2626', '#2563eb', '#16a34a', '#eab308', '#9333ea', '#ea580c'];

  for (let r = 50; r < 340; r += 45) {
    const petals = 12;
    for (let p = 0; p < petals; p++) {
      const a = (p * Math.PI * 2) / petals;
      ctx.fillStyle = colors[(p + r) % colors.length];
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  return canvas;
}

function drawCelestialAstro(w: number = 1000, h: number = 750): HTMLCanvasElement {
  const { canvas, ctx } = makeBaseCanvas(w, h);
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Golden celestial rings
  const cx = 500, cy = 375;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;

  [100, 180, 260, 330].forEach((rad) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Constellation star lines
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI * 2) / 16;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 340, cy + Math.sin(a) * 340);
    ctx.stroke();
  }

  // Glowing center sun
  const sun = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
  sun.addColorStop(0, '#ffffff');
  sun.addColorStop(0.5, '#fde047');
  sun.addColorStop(1, '#ea580c');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, 55, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * The 25 Curated Campaign Levels
 */
export const CAMPAIGN_LEVELS: PuzzleLevel[] = [
  // --- WORLD 1: NOVICE REALMS (9–25 pieces) ---
  {
    id: 1,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Pikachu: Volt Surge',
    subtitle: 'High-voltage electric sparks and joyful energy',
    description: '3D Pikachu crackling with vibrant lightning. An energetic start for mastering interlocking tabs.',
    rows: 3,
    cols: 3,
    totalPieces: 9,
    difficulty: 'Beginner',
    targetTimeSeconds: 45,
    twoStarTimeSeconds: 90,
    maxHints: -1,
    imageUrl: '/images/puzzles/solo-01-pikachu.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-01-pikachu.jpg', drawSunflower),
  },
  {
    id: 2,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Super Mario: Mushroom Kingdom',
    subtitle: 'Classic question blocks, gold coins, and joyful jumps',
    description: '3D Mario leaping through the kingdom. High contrast colors guide your border assembly.',
    rows: 3,
    cols: 3,
    totalPieces: 9,
    difficulty: 'Beginner',
    targetTimeSeconds: 50,
    twoStarTimeSeconds: 100,
    maxHints: -1,
    imageUrl: '/images/puzzles/solo-02-mario.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-02-mario.jpg', drawCozyCottage),
  },
  {
    id: 3,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Sonic: Green Hill Sprint',
    subtitle: 'Supersonic loop-de-loops and checkered loopways',
    description: 'Sonic blitzing across the iconic landscape at supersonic speed. Look for distinctive blue quills.',
    rows: 3,
    cols: 4,
    totalPieces: 12,
    difficulty: 'Beginner',
    targetTimeSeconds: 65,
    twoStarTimeSeconds: 120,
    maxHints: -1,
    imageUrl: '/images/puzzles/solo-03-sonic.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-03-sonic.jpg', drawHotAirBalloons),
  },
  {
    id: 4,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Naruto: Sage Rasengan',
    subtitle: 'Spiraling chakra sphere and shinobi determination',
    description: '16 pieces. Naruto Uzumaki channeling radiant sage jutsu with dynamic energy bursts.',
    rows: 4,
    cols: 4,
    totalPieces: 16,
    difficulty: 'Beginner',
    targetTimeSeconds: 85,
    twoStarTimeSeconds: 160,
    maxHints: -1,
    imageUrl: '/images/puzzles/solo-04-naruto.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-04-naruto.jpg', drawAlpineLake),
  },
  {
    id: 5,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'SpongeBob: Bikini Bottom Joy',
    subtitle: 'Undersea bubbles and pineapple paradise',
    description: '16 pieces. SpongeBob and Patrick in a colorful underwater celebration.',
    rows: 4,
    cols: 4,
    totalPieces: 16,
    difficulty: 'Beginner',
    targetTimeSeconds: 90,
    twoStarTimeSeconds: 170,
    maxHints: -1,
    imageUrl: '/images/puzzles/solo-05-spongebob.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-05-spongebob.jpg', drawToucan),
  },
  {
    id: 6,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Miles Morales: Leap of Faith',
    subtitle: 'Neon Manhattan skyline in the Spider-Verse',
    description: '20 pieces. Miles falling upwards against inverted skyscrapers and neon reflections.',
    rows: 4,
    cols: 5,
    totalPieces: 20,
    difficulty: 'Beginner',
    targetTimeSeconds: 110,
    twoStarTimeSeconds: 200,
    maxHints: 3,
    imageUrl: '/images/puzzles/solo-06-spiderman.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-06-spiderman.jpg', drawSunsetCoast),
  },
  {
    id: 7,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Spirited Away: Dragon Haku',
    subtitle: 'The River Spirit soaring through twilight clouds',
    description: '20 pieces. Chihiro riding the majestic white dragon in Hayao Miyazaki’s timeless masterpiece.',
    rows: 4,
    cols: 5,
    totalPieces: 20,
    difficulty: 'Beginner',
    targetTimeSeconds: 120,
    twoStarTimeSeconds: 210,
    maxHints: 3,
    imageUrl: '/images/puzzles/solo-07-spiritedaway.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-07-spiritedaway.jpg', drawKyotoGarden),
  },
  {
    id: 8,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Goku: Ultra Instinct',
    subtitle: 'Silver divine aura in the Tournament of Power',
    description: '25 pieces. Son Goku shattering mortal limits with autonomous combat instincts.',
    rows: 5,
    cols: 5,
    totalPieces: 25,
    difficulty: 'Beginner',
    targetTimeSeconds: 140,
    twoStarTimeSeconds: 240,
    maxHints: 3,
    imageUrl: '/images/puzzles/solo-08-goku.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-08-goku.jpg', drawDesertDunes),
  },
  {
    id: 9,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Demon Slayer: Water Dragon',
    subtitle: 'Tanjiro Kamado striking with constant tidal flux',
    description: '25 pieces. Glowing blue water dragon arcs wrapped around the black Nichirin blade.',
    rows: 5,
    cols: 5,
    totalPieces: 25,
    difficulty: 'Beginner',
    targetTimeSeconds: 150,
    twoStarTimeSeconds: 250,
    maxHints: 2,
    imageUrl: '/images/puzzles/solo-09-demonslayer.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-09-demonslayer.jpg', drawCoralReef),
  },
  {
    id: 10,
    worldId: 1,
    worldName: 'World 1: Novice Realms',
    title: 'Luffy: Gear Fourth',
    subtitle: 'Bounce-Man armament haki explosion',
    description: '25 pieces. Monkey D. Luffy engulfed in raw steam and supreme conqueror power.',
    rows: 5,
    cols: 5,
    totalPieces: 25,
    difficulty: 'Beginner',
    targetTimeSeconds: 160,
    twoStarTimeSeconds: 260,
    maxHints: 2,
    imageUrl: '/images/puzzles/solo-10-luffy.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-10-luffy.jpg', drawEnchantedCastle),
  },

  // --- WORLD 2: ARTISAN CHRONICLES (36–64 pieces) ---
  {
    id: 11,
    worldId: 2,
    worldName: 'World 2: Artisan Chronicles',
    title: 'Deku: Full Cowl 100%',
    subtitle: 'One For All emerald lightning burst',
    description: '36 pieces. Izuku Midoriya radiating limitless energy and hero conviction.',
    rows: 6,
    cols: 6,
    totalPieces: 36,
    difficulty: 'Intermediate',
    targetTimeSeconds: 200,
    twoStarTimeSeconds: 320,
    maxHints: 2,
    imageUrl: '/images/puzzles/solo-11-deku.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-11-deku.jpg', drawBambooForest),
  },
  {
    id: 12,
    worldId: 2,
    worldName: 'World 2: Artisan Chronicles',
    title: 'Rick & Morty: Citadel Portal',
    subtitle: 'Dimensional escape through glowing green wormhole',
    description: '36 pieces. Multiverse mayhem as Rick and Morty leap between parallel realities.',
    rows: 6,
    cols: 6,
    totalPieces: 36,
    difficulty: 'Intermediate',
    targetTimeSeconds: 220,
    twoStarTimeSeconds: 340,
    maxHints: 2,
    imageUrl: '/images/puzzles/solo-12-rickmorty.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-12-rickmorty.jpg', drawVenetianGondola),
  },
  {
    id: 13,
    worldId: 2,
    worldName: 'World 2: Artisan Chronicles',
    title: 'Mega Charizard: Dragon Inferno',
    subtitle: 'Blistering blue flames and draconic supremacy',
    description: '48 pieces (6×8). Mega Charizard breathing catastrophic azure fire across the night.',
    rows: 6,
    cols: 8,
    totalPieces: 48,
    difficulty: 'Intermediate',
    targetTimeSeconds: 260,
    twoStarTimeSeconds: 400,
    maxHints: 1,
    imageUrl: '/images/puzzles/solo-13-charizard.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-13-charizard.jpg', drawAurora),
  },
  {
    id: 14,
    worldId: 2,
    worldName: 'World 2: Artisan Chronicles',
    title: 'Attack on Titan: Captain Levi',
    subtitle: 'Humanity’s strongest soldier in supersonic slice',
    description: '64 pieces (8×8). Levi Ackerman maneuvering through the forest canopy with razor blades.',
    rows: 8,
    cols: 8,
    totalPieces: 64,
    difficulty: 'Intermediate',
    targetTimeSeconds: 340,
    twoStarTimeSeconds: 500,
    maxHints: 1,
    imageUrl: '/images/puzzles/solo-14-levi.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-14-levi.jpg', drawRoyalPalace),
  },

  // --- WORLD 3: MASTER COLLECTION (64–100 pieces) ---
  {
    id: 15,
    worldId: 3,
    worldName: 'World 3: The Master Collection',
    title: 'Jujutsu Kaisen: Gojo Satoru',
    subtitle: 'Domain Expansion: Infinite Void',
    description: '64 pieces (8×8). The strongest sorcerer opening the limitless space of unbounded information.',
    rows: 8,
    cols: 8,
    totalPieces: 64,
    difficulty: 'Expert',
    targetTimeSeconds: 360,
    twoStarTimeSeconds: 540,
    maxHints: 1,
    imageUrl: '/images/puzzles/solo-15-gojo.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-15-gojo.jpg', drawCosmicNebula),
  },
  {
    id: 16,
    worldId: 3,
    worldName: 'World 3: The Master Collection',
    title: 'Sailor Moon: Cosmic Power',
    subtitle: 'Silver Millennium princess and starlight radiance',
    description: '80 pieces (8×10). Usagi Tsukino surrounded by celestial gems, roses, and sparkling cosmos.',
    rows: 8,
    cols: 10,
    totalPieces: 80,
    difficulty: 'Expert',
    targetTimeSeconds: 420,
    twoStarTimeSeconds: 650,
    maxHints: 1,
    imageUrl: '/images/puzzles/solo-16-sailormoon.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-16-sailormoon.jpg', drawStainedGlass),
  },
  {
    id: 17,
    worldId: 3,
    worldName: 'World 3: The Master Collection',
    title: 'Arcane: Jinx Firelight',
    subtitle: 'Neon graffiti chaos and Zaunite fireworks',
    description: '100 pieces (10×10). The grand finale puzzle featuring Jinx in the breathtaking visual style of Arcane.',
    rows: 10,
    cols: 10,
    totalPieces: 100,
    difficulty: 'Expert',
    targetTimeSeconds: 500,
    twoStarTimeSeconds: 800,
    maxHints: 1,
    imageUrl: '/images/puzzles/solo-17-jinx.jpg',
    generateArt: createLevelImageCanvasGenerator('/images/puzzles/solo-17-jinx.jpg', drawCelestialAstro),
  },
];
