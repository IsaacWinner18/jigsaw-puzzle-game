/**
 * Curated Multiplayer Battle Puzzles
 * All unlocked, tiered by difficulty and featuring artistic themes
 * distinct from the solo campaign progression.
 */

export interface MultiplayerPuzzleTheme {
  id: string;
  title: string;
  tagline: string;
  difficulty: 'Beginner' | 'Artisan' | 'Master' | 'Grandmaster';
  rows: number;
  cols: number;
  targetSeconds: number;
  accentColor: string;
  description: string;
  imageUrl?: string;
  generateArt: () => HTMLCanvasElement;
}

const imageCache = new Map<string, HTMLImageElement>();

export function preloadPuzzleImage(url: string) {
  if (typeof window === 'undefined' || !url || imageCache.has(url)) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  imageCache.set(url, img);
}

function createImageCanvasGenerator(imageUrl: string, fallbackFn: () => HTMLCanvasElement): () => HTMLCanvasElement {
  return () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d')!;

    if (typeof window !== 'undefined') {
      let img = imageCache.get(imageUrl);
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        imageCache.set(imageUrl, img);
      }

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, 1200, 900);
        return canvas;
      }

      // Draw rich procedural fallback while image loads
      const fallback = fallbackFn();
      ctx.drawImage(fallback, 0, 0, 1200, 900);

      img.onload = () => {
        ctx.clearRect(0, 0, 1200, 900);
        ctx.drawImage(img, 0, 0, 1200, 900);
      };
      return canvas;
    }

    return fallbackFn();
  };
}

/**
 * Procedural Art Generators for Multiplayer Battles
 */

// 1. Neo Tokyo Cyberpunk Rain (3x3 - 9 pieces)
function createCyberpunkRain(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Dark cyber night sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 900);
  skyGrad.addColorStop(0, '#050510');
  skyGrad.addColorStop(0.6, '#0f0a28');
  skyGrad.addColorStop(1, '#1a0b36');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 900);

  // Futuristic skyscraper silhouettes with neon windows
  const buildings = [
    { x: 40, w: 140, h: 620, color: '#f43f5e' },
    { x: 190, w: 180, h: 720, color: '#06b6d4' },
    { x: 390, w: 160, h: 560, color: '#a855f7' },
    { x: 570, w: 220, h: 760, color: '#3b82f6' },
    { x: 810, w: 150, h: 640, color: '#f59e0b' },
    { x: 980, w: 180, h: 690, color: '#ec4899' },
  ];

  buildings.forEach((b) => {
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(b.x, 900 - b.h, b.w, b.h);

    // Neon edge highlight
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 18;
    ctx.strokeRect(b.x, 900 - b.h, b.w, b.h);
    ctx.shadowBlur = 0;

    // Glowing window grids
    for (let wy = 900 - b.h + 30; wy < 870; wy += 28) {
      for (let wx = b.x + 20; wx < b.x + b.w - 20; wx += 24) {
        if (Math.sin(wx * 11 + wy * 19) > -0.2) {
          ctx.fillStyle = b.color;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(wx, wy, 14, 16);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  });

  // Giant holographic neon moon
  const moonGrad = ctx.createRadialGradient(600, 240, 20, 600, 240, 180);
  moonGrad.addColorStop(0, '#ffffff');
  moonGrad.addColorStop(0.4, '#ec4899');
  moonGrad.addColorStop(0.8, '#a855f7');
  moonGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(600, 240, 180, 0, Math.PI * 2);
  ctx.fill();

  // Cyber rain streaks
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 350; i++) {
    const rx = (i * 97) % 1200;
    const ry = (i * 137) % 900;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 8, ry + 24);
    ctx.stroke();
  }

  return canvas;
}

// 2. Cosmic Nebula & Starlight (4x4 - 16 pieces)
function createCosmicNebula(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Deep space base
  ctx.fillStyle = '#03020a';
  ctx.fillRect(0, 0, 1200, 900);

  // Swirling gas clouds
  const nebulaColors = [
    { x: 380, y: 400, r: 380, col: 'rgba(168, 85, 247, 0.45)' },
    { x: 780, y: 480, r: 420, col: 'rgba(59, 130, 246, 0.4)' },
    { x: 600, y: 350, r: 280, col: 'rgba(236, 72, 153, 0.35)' },
    { x: 920, y: 260, r: 240, col: 'rgba(245, 158, 11, 0.3)' },
  ];

  nebulaColors.forEach((n) => {
    const rad = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
    rad.addColorStop(0, n.col);
    rad.addColorStop(0.7, n.col.replace(/[\d\.]+\)$/, '0.1)'));
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 1200, 900);
  });

  // Brilliant celestial stars
  for (let i = 0; i < 400; i++) {
    const sx = (i * 179 + 31) % 1200;
    const sy = (i * 223 + 47) % 900;
    const size = ((i * 13) % 4) + 1;

    ctx.fillStyle = i % 8 === 0 ? '#fde047' : i % 5 === 0 ? '#67e8f9' : '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();

    // Cross glint on large stars
    if (size >= 3.5) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy);
      ctx.lineTo(sx + 12, sy);
      ctx.moveTo(sx, sy - 12);
      ctx.lineTo(sx, sy + 12);
      ctx.stroke();
    }
  }

  // Ringed golden exoplanet
  ctx.save();
  ctx.translate(320, 580);
  ctx.rotate(-0.35);

  // Back half of planetary rings
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.ellipse(0, 0, 220, 50, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  // Planet body
  const planetGrad = ctx.createRadialGradient(-30, -30, 15, 0, 0, 110);
  planetGrad.addColorStop(0, '#fef08a');
  planetGrad.addColorStop(0.5, '#f59e0b');
  planetGrad.addColorStop(0.9, '#92400e');
  planetGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 110, 0, Math.PI * 2);
  ctx.fill();

  // Front half of planetary rings
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.ellipse(0, 0, 220, 50, 0, 0, Math.PI);
  ctx.stroke();

  ctx.restore();

  return canvas;
}

// 3. Ethereal Forest Spirit (5x5 - 25 pieces)
function createForestSpirit(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Deep emerald forest gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 900);
  bgGrad.addColorStop(0, '#022c22');
  bgGrad.addColorStop(0.6, '#064e3b');
  bgGrad.addColorStop(1, '#021812');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 900);

  // Bioluminescent ancient trees
  for (let i = 0; i < 7; i++) {
    const tx = 90 + i * 170;
    const tw = 60 + ((i * 17) % 40);

    ctx.fillStyle = '#011c14';
    ctx.fillRect(tx - tw / 2, 260, tw, 640);

    // Glowing moss veins
    ctx.strokeStyle = i % 2 === 0 ? '#34d399' : '#a7f3d0';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(tx, 300);
    ctx.quadraticCurveTo(tx + 20, 500, tx - 10, 750);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Glowing spirit orb creature
  const spiritGrad = ctx.createRadialGradient(600, 480, 20, 600, 480, 160);
  spiritGrad.addColorStop(0, '#ffffff');
  spiritGrad.addColorStop(0.4, '#a7f3d0');
  spiritGrad.addColorStop(0.7, '#34d399');
  spiritGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spiritGrad;
  ctx.beginPath();
  ctx.arc(600, 480, 160, 0, Math.PI * 2);
  ctx.fill();

  // Floating luminescent spore motes
  for (let i = 0; i < 220; i++) {
    const mx = (i * 163 + 17) % 1200;
    const my = (i * 197 + 29) % 900;
    ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.beginPath();
    ctx.arc(mx, my, ((i * 7) % 4) + 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// 4. Golden Dragon of Kyoto (6x6 - 36 pieces)
function createGoldenDragon(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Imperial red and gold leaf texture
  const redGrad = ctx.createRadialGradient(600, 450, 100, 600, 450, 700);
  redGrad.addColorStop(0, '#7f1d1d');
  redGrad.addColorStop(0.5, '#450a0a');
  redGrad.addColorStop(1, '#1c0404');
  ctx.fillStyle = redGrad;
  ctx.fillRect(0, 0, 1200, 900);

  // Traditional Japanese Seigaiha wave arches at bottom
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 2;
  for (let r = 700; r < 920; r += 32) {
    for (let c = 0; c < 1250; c += 80) {
      ctx.beginPath();
      ctx.arc(c, r, 50, Math.PI, 0);
      ctx.stroke();
    }
  }

  // Giant serpentine golden dragon coils
  ctx.save();
  ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
  ctx.shadowBlur = 25;

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 42;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(150, 650);
  ctx.bezierCurveTo(300, 200, 500, 750, 750, 300);
  ctx.bezierCurveTo(900, 100, 1050, 500, 1080, 350);
  ctx.stroke();

  // Dragon scales overlay
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 24;
  ctx.stroke();

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Dragon blazing pearl of wisdom
  const pearlGrad = ctx.createRadialGradient(980, 260, 10, 980, 260, 75);
  pearlGrad.addColorStop(0, '#ffffff');
  pearlGrad.addColorStop(0.4, '#fbbf24');
  pearlGrad.addColorStop(0.8, '#ef4444');
  pearlGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = pearlGrad;
  ctx.beginPath();
  ctx.arc(980, 260, 75, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  return canvas;
}

// 5. Dora the Explorer: Lost Rainforest Temple (5x5 - 25 pieces)
function createDoraLostJungle(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Warm golden rainforest sky with tropical mist
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 600);
  skyGrad.addColorStop(0, '#fef08a');
  skyGrad.addColorStop(0.3, '#86efac');
  skyGrad.addColorStop(0.7, '#059669');
  skyGrad.addColorStop(1, '#064e3b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 900);

  // Volumetric golden sunbeams piercing through jungle canopy
  ctx.save();
  ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(100 + i * 180, 0);
    ctx.lineTo(240 + i * 200, 0);
    ctx.lineTo(380 + i * 220, 900);
    ctx.lineTo(200 + i * 200, 900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Tiered ancient Mayan golden pyramid in the midground
  const pyrGrad = ctx.createLinearGradient(600, 180, 600, 520);
  pyrGrad.addColorStop(0, '#f59e0b');
  pyrGrad.addColorStop(0.5, '#b45309');
  pyrGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = pyrGrad;

  // Pyramid tiers
  const tiers = [
    { y: 460, w: 460, h: 60 },
    { y: 400, w: 380, h: 60 },
    { y: 340, w: 300, h: 60 },
    { y: 280, w: 220, h: 60 },
    { y: 220, w: 140, h: 60 },
  ];
  tiers.forEach((t) => {
    ctx.fillRect(600 - t.w / 2, t.y, t.w, t.h);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.strokeRect(600 - t.w / 2, t.y, t.w, t.h);
  });

  // Central ceremonial temple shrine atop pyramid
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(560, 160, 80, 60);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(585, 180, 30, 40);

  // Cascading turquoise waterfall on the left
  const waterGrad = ctx.createLinearGradient(120, 280, 240, 900);
  waterGrad.addColorStop(0, '#67e8f9');
  waterGrad.addColorStop(0.6, '#06b6d4');
  waterGrad.addColorStop(1, '#0e7490');
  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.moveTo(140, 300);
  ctx.bezierCurveTo(120, 450, 170, 600, 130, 900);
  ctx.lineTo(260, 900);
  ctx.bezierCurveTo(280, 650, 230, 450, 210, 300);
  ctx.closePath();
  ctx.fill();

  // Waterfall foam and spray ripples
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(140 + ((i * 23) % 110), 320 + ((i * 17) % 550), 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  // Foreground ancient mossy stone ruins bridge
  const bridgeGrad = ctx.createLinearGradient(0, 640, 0, 900);
  bridgeGrad.addColorStop(0, '#1c1917');
  bridgeGrad.addColorStop(0.5, '#292524');
  bridgeGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = bridgeGrad;
  ctx.beginPath();
  ctx.moveTo(0, 720);
  ctx.quadraticCurveTo(600, 640, 1200, 720);
  ctx.lineTo(1200, 900);
  ctx.lineTo(0, 900);
  ctx.closePath();
  ctx.fill();

  // Dora's iconic Purple Explorer Backpack on ancient stone pedestal
  ctx.save();
  ctx.translate(600, 710);

  // Backpack shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 45, 90, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Purple backpack body with 3D gradient
  const bagGrad = ctx.createRadialGradient(-20, -10, 10, 0, 0, 90);
  bagGrad.addColorStop(0, '#c084fc');
  bagGrad.addColorStop(0.6, '#9333ea');
  bagGrad.addColorStop(1, '#581c87');
  ctx.fillStyle = bagGrad;
  ctx.beginPath();
  ctx.roundRect(-70, -60, 140, 100, 24);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Front pouch
  ctx.fillStyle = '#7e22ce';
  ctx.beginPath();
  ctx.roundRect(-50, -10, 100, 45, 14);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Golden buckle
  ctx.fillStyle = '#fde047';
  ctx.fillRect(-12, 5, 24, 14);
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(-7, 8, 14, 8);

  // The smiling Map rolled up in side pocket
  ctx.save();
  ctx.translate(55, -45);
  ctx.rotate(0.25);
  const mapGrad = ctx.createLinearGradient(0, -30, 0, 30);
  mapGrad.addColorStop(0, '#fef08a');
  mapGrad.addColorStop(0.8, '#fde047');
  mapGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = mapGrad;
  ctx.beginPath();
  ctx.roundRect(-16, -35, 32, 70, 8);
  ctx.fill();
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Map's cheerful eyes and smile
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-6, -10, 3, 0, Math.PI * 2);
  ctx.arc(6, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -3, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Giant tropical monstera leaves on borders
  ctx.fillStyle = '#065f46';
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.translate(i < 4 ? 40 : 1160, 350 + (i % 4) * 130);
    ctx.rotate(i < 4 ? 0.4 + i * 0.15 : -0.4 - i * 0.15);
    ctx.beginPath();
    ctx.ellipse(0, 0, 140, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // Scarlet Macaw perched on right moss branch
  ctx.save();
  ctx.translate(1020, 480);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 55, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.ellipse(12, 10, 18, 45, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(8, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(18, -25);
  ctx.lineTo(35, -15);
  ctx.lineTo(20, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Fluttering glowing Blue Morpho Butterflies
  const butterflies = [
    { x: 380, y: 520, s: 1.2 },
    { x: 820, y: 430, s: 1.0 },
    { x: 490, y: 320, s: 0.8 },
  ];
  butterflies.forEach((b) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.s, b.s);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(-15, -10, 20, 14, 0.4, 0, Math.PI * 2);
    ctx.ellipse(15, -10, 20, 14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(-8, -5, 10, 7, 0.4, 0, Math.PI * 2);
    ctx.ellipse(8, -5, 10, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  return canvas;
}

// 6. Bikini Bottom: Luminescent Jellyfish Fields (6x6 - 36 pieces)
function createBikiniBottom(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Deep vibrant turquoise underwater seascape
  const seaGrad = ctx.createLinearGradient(0, 0, 0, 900);
  seaGrad.addColorStop(0, '#06b6d4');
  seaGrad.addColorStop(0.3, '#0891b2');
  seaGrad.addColorStop(0.7, '#0e7490');
  seaGrad.addColorStop(1, '#164e63');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, 0, 1200, 900);

  // Underwater dancing caustic sunlight rays
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(60 + i * 150, 0);
    ctx.lineTo(160 + i * 150, 0);
    ctx.lineTo(260 + i * 160, 900);
    ctx.lineTo(120 + i * 160, 900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Sandy seabed with floral mounds
  const floorGrad = ctx.createLinearGradient(0, 720, 0, 900);
  floorGrad.addColorStop(0, '#fef08a');
  floorGrad.addColorStop(0.5, '#fde047');
  floorGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(0, 760);
  ctx.bezierCurveTo(400, 710, 800, 800, 1200, 740);
  ctx.lineTo(1200, 900);
  ctx.lineTo(0, 900);
  ctx.closePath();
  ctx.fill();

  // Whimsical Pineapple house silhouette in the far distance
  ctx.save();
  ctx.translate(980, 680);
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 65, 95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 12, -95, 14, 45, i * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(-15, -20, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Giant glowing luminescent pink Jellyfish swarm
  const jellyfish = [
    { x: 340, y: 320, r: 85, glow: '#f472b6' },
    { x: 720, y: 240, r: 105, glow: '#ec4899' },
    { x: 520, y: 520, r: 70, glow: '#f472b6' },
    { x: 180, y: 580, r: 55, glow: '#fbcfe8' },
    { x: 880, y: 460, r: 65, glow: '#f472b6' },
  ];

  jellyfish.forEach((j) => {
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.shadowColor = j.glow;
    ctx.shadowBlur = 30;

    const bellGrad = ctx.createRadialGradient(0, -j.r * 0.3, 10, 0, 0, j.r);
    bellGrad.addColorStop(0, '#ffffff');
    bellGrad.addColorStop(0.4, '#fbcfe8');
    bellGrad.addColorStop(0.8, '#f472b6');
    bellGrad.addColorStop(1, 'rgba(236, 72, 153, 0.7)');
    ctx.fillStyle = bellGrad;

    ctx.beginPath();
    ctx.arc(0, 0, j.r, Math.PI, 0);
    ctx.quadraticCurveTo(j.r * 0.5, j.r * 0.2, 0, j.r * 0.1);
    ctx.quadraticCurveTo(-j.r * 0.5, j.r * 0.2, -j.r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#db2777';
    for (let s = -2; s <= 2; s++) {
      ctx.beginPath();
      ctx.arc(s * (j.r * 0.3), -j.r * 0.45, j.r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)';
    ctx.lineWidth = 4;
    for (let t = -3; t <= 3; t++) {
      const tx = t * (j.r * 0.25);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.bezierCurveTo(tx - 20, j.r * 0.7, tx + 25, j.r * 1.3, tx - 10, j.r * 2.1);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Floating luminescent bubbles
  for (let i = 0; i < 90; i++) {
    const bx = (i * 137 + 29) % 1200;
    const by = (i * 179 + 43) % 900;
    const br = ((i * 7) % 10) + 4;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx - br * 0.35, by - br * 0.35, br * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return canvas;
}

export const MULTIPLAYER_PUZZLES: MultiplayerPuzzleTheme[] = [
  {
    id: 'tom-jerry',
    title: 'Tom & Jerry: Retro Chase',
    tagline: 'Hilarious living room chase & glowing cheese hole',
    difficulty: 'Beginner',
    rows: 3,
    cols: 3,
    targetSeconds: 45,
    accentColor: '#f59e0b',
    imageUrl: '/images/puzzles/tom-jerry-chase.jpg',
    description: '3D Pixar-style living room mayhem with flying books, mousetraps, and Jerry escaping into his cozy cheese door.',
    generateArt: createImageCanvasGenerator('/images/puzzles/tom-jerry-chase.jpg', createCyberpunkRain),
  },
  {
    id: 'frozen-realm',
    title: 'Frozen: Crystalline Ice Palace',
    tagline: 'Majestic ice spires under shimmering aurora borealis',
    difficulty: 'Artisan',
    rows: 4,
    cols: 4,
    targetSeconds: 120,
    accentColor: '#06b6d4',
    imageUrl: '/images/puzzles/frozen-realm.jpg',
    description: 'Hyper-realistic 8K 3D winter wonder with glowing cyan icicles, frozen bridge, and magical polar aurora.',
    generateArt: createImageCanvasGenerator('/images/puzzles/frozen-realm.jpg', createCosmicNebula),
  },
  {
    id: 'rick-morty',
    title: 'Rick & Morty: Multiverse Citadel',
    tagline: 'Swirling neon-green portal across alien dimensions',
    difficulty: 'Master',
    rows: 5,
    cols: 5,
    targetSeconds: 240,
    accentColor: '#22c55e',
    imageUrl: '/images/puzzles/rick-morty-portal.jpg',
    description: 'Deep cosmic sci-fi space station with hovering portal fluid, floating crystal asteroids, and retro terminals.',
    generateArt: createImageCanvasGenerator('/images/puzzles/rick-morty-portal.jpg', createForestSpirit),
  },
  {
    id: 'dora-jungle',
    title: 'Dora: Lost Rainforest Temple',
    tagline: 'Ancient Mayan pyramid & purple backpack expedition',
    difficulty: 'Master',
    rows: 5,
    cols: 5,
    targetSeconds: 240,
    accentColor: '#a855f7',
    description: 'Vibrant tropical jungle with cascading turquoise waterfalls, ancient stone ruins, and exotic wildlife.',
    generateArt: createDoraLostJungle,
  },
  {
    id: 'bikini-bottom',
    title: 'Bikini Bottom: Jellyfish Fields',
    tagline: 'Luminescent pink jellyfish & underwater coral realm',
    difficulty: 'Grandmaster',
    rows: 6,
    cols: 6,
    targetSeconds: 360,
    accentColor: '#ec4899',
    description: 'Surreal 3D underwater spectacle with sunbeam caustics, glowing jellyfish bells, and coral reefs.',
    generateArt: createBikiniBottom,
  },
  {
    id: 'cyberpunk-rain',
    title: 'Neo Tokyo: Cyber Rain',
    tagline: 'Vibrant neon cityscapes & rain glints',
    difficulty: 'Beginner',
    rows: 3,
    cols: 3,
    targetSeconds: 45,
    accentColor: '#38bdf8',
    description: 'A 9-piece lightning sprint. Perfect for warmups and rapid 1v1 rematches.',
    generateArt: createCyberpunkRain,
  },
];
