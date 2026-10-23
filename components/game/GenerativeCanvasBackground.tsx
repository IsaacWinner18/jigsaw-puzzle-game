'use client';

import React, { useEffect, useRef } from 'react';

export const GenerativeCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating 3D decorative puzzle piece particles
    interface FloatingPiece {
      x: number;
      y: number;
      z: number;
      size: number;
      angle: number;
      vAngle: number;
      vx: number;
      vy: number;
      color: string;
    }

    const colors = [
      'rgba(251, 191, 36, 0.45)', // Amber
      'rgba(99, 102, 241, 0.45)', // Indigo
      'rgba(168, 85, 247, 0.4)',  // Purple
      'rgba(6, 182, 212, 0.35)',  // Cyan
    ];

    const pieces: FloatingPiece[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.8 + 0.2,
      size: Math.random() * 24 + 18,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.015,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Render loop
    let tick = 0;
    const render = () => {
      tick += 0.008;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Radial Ambient Backlight
      const ambient = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      ambient.addColorStop(0, '#0b1120');
      ambient.addColorStop(0.5, '#040711');
      ambient.addColorStop(1, '#02040a');
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Perspective Grid Horizon
      ctx.save();
      const horizonY = height * 0.55;
      const fov = 350;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)';
      ctx.lineWidth = 1;

      // Vanishing point perspective lines
      const vanishingX = width / 2;
      const numLines = 28;
      for (let i = -numLines; i <= numLines; i++) {
        const bottomX = vanishingX + (i * width) / 12;
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal lines receding into distance (logarithmic spacing)
      const gridOffset = (tick * 40) % 50;
      for (let d = 10; d < height - horizonY + 50; d += 22) {
        const y = horizonY + Math.pow((d + gridOffset) / (height - horizonY + 50), 2.2) * (height - horizonY);
        if (y <= height) {
          const alpha = Math.min(0.25, ((y - horizonY) / (height - horizonY)) * 0.35);
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 3. Floating 3D Jigsaw Outlines
      pieces.forEach((p) => {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;
        p.angle += p.vAngle;

        if (p.x < -60) p.x = width + 60;
        if (p.x > width + 60) p.x = -60;
        if (p.y < -60) p.y = height + 60;
        if (p.y > height + 60) p.y = -60;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(p.z, p.z);

        // Draw iconic jigsaw piece path
        const s = p.size;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = p.color.replace(/[\d\.]+\)$/, '0.06)');

        ctx.beginPath();
        // Top edge with tab
        ctx.moveTo(-s, -s);
        ctx.lineTo(-s * 0.3, -s);
        ctx.arc(0, -s - s * 0.3, s * 0.3, Math.PI * 0.7, Math.PI * 0.3, false);
        ctx.lineTo(s, -s);
        // Right edge with blank
        ctx.lineTo(s, -s * 0.3);
        ctx.arc(s - s * 0.3, 0, s * 0.3, Math.PI * 1.2, Math.PI * 0.8, true);
        ctx.lineTo(s, s);
        // Bottom edge
        ctx.lineTo(s * 0.3, s);
        ctx.arc(0, s + s * 0.3, s * 0.3, Math.PI * 1.7, Math.PI * 1.3, false);
        ctx.lineTo(-s, s);
        // Left edge
        ctx.lineTo(-s, -s);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle vignette mask */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/90 pointer-events-none" />
    </div>
  );
};
