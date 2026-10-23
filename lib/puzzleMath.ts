import { EdgeType, PieceEdges, PuzzleConfig, PuzzlePieceData } from '../types/puzzle';
import { createPRNG } from './seededRandom';

/**
 * Mathematical Jigsaw Puzzle Separation & Slicing Engine
 */

export interface EdgeMatrix {
  horizontal: EdgeType[][]; // (rows - 1) x cols
  vertical: EdgeType[][];   // rows x (cols - 1)
}

/**
 * Generates complimentary interlocking tab (+1) and blank (-1) matrices.
 * Internal edges are randomized; outer edges are flat (0).
 * Supports optional deterministic seed for fair multiplayer races.
 */
export function generateEdgeMatrix(rows: number, cols: number, seed?: number): EdgeMatrix {
  const rng = seed !== undefined ? createPRNG(seed) : Math.random;

  const horizontal: EdgeType[][] = [];
  for (let r = 0; r < rows - 1; r++) {
    horizontal[r] = [];
    for (let c = 0; c < cols; c++) {
      // 50% chance tab (+1) or blank (-1)
      horizontal[r][c] = rng() < 0.5 ? 1 : -1;
    }
  }

  const vertical: EdgeType[][] = [];
  for (let r = 0; r < rows; r++) {
    vertical[r] = [];
    for (let c = 0; c < cols - 1; c++) {
      vertical[r][c] = rng() < 0.5 ? 1 : -1;
    }
  }

  return { horizontal, vertical };
}

/**
 * Returns edges for piece at (row, col) given the edge matrix.
 */
export function getPieceEdges(row: number, col: number, rows: number, cols: number, matrix: EdgeMatrix): PieceEdges {
  const top: EdgeType = row === 0 ? 0 : (-matrix.horizontal[row - 1][col] as EdgeType);
  const bottom: EdgeType = row === rows - 1 ? 0 : matrix.horizontal[row][col];
  const left: EdgeType = col === 0 ? 0 : (-matrix.vertical[row][col - 1] as EdgeType);
  const right: EdgeType = col === cols - 1 ? 0 : matrix.vertical[row][col];

  return { top, right, bottom, left };
}

/**
 * Draws a single classic jigsaw edge contour using symmetric cubic bezier curves.
 * (x1, y1) -> (x2, y2).
 * (nx, ny) is the outward unit normal direction for a positive tab (+1).
 */
function drawEdgeCurve(
  ctx: CanvasRenderingContext2D | Path2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edgeType: EdgeType,
  nx: number,
  ny: number,
  tabSize: number,
  style: 'classic' | 'geometric'
) {
  if (edgeType === 0 || style === 'geometric') {
    ctx.lineTo(x2, y2);
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;

  // Actual normal direction scaled by tab protrusion (+1 outward, -1 inward)
  const normX = nx * edgeType * tabSize;
  const normY = ny * edgeType * tabSize;

  const pt = (u: number, v: number): [number, number] => [
    x1 + ux * len * u + normX * v,
    y1 + uy * len * u + normY * v,
  ];

  // Symmetric Bezier control points for clean classic tab/blank
  // u is fraction along edge (0 to 1), v is fraction of tab depth (0 to 1)
  const pStart = pt(0.35, 0.0);
  const cp1 = pt(0.38, 0.04);
  const cp2 = pt(0.36, 0.22);
  const pNeck1 = pt(0.40, 0.35);

  const cp3 = pt(0.34, 0.85);
  const cp4 = pt(0.42, 1.06);
  const pApex = pt(0.50, 1.06);

  const cp5 = pt(0.58, 1.06);
  const cp6 = pt(0.66, 0.85);
  const pNeck2 = pt(0.60, 0.35);

  const cp7 = pt(0.64, 0.22);
  const cp8 = pt(0.62, 0.04);
  const pEnd = pt(0.65, 0.0);

  ctx.lineTo(pStart[0], pStart[1]);
  ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], pNeck1[0], pNeck1[1]);
  ctx.bezierCurveTo(cp3[0], cp3[1], cp4[0], cp4[1], pApex[0], pApex[1]);
  ctx.bezierCurveTo(cp5[0], cp5[1], cp6[0], cp6[1], pNeck2[0], pNeck2[1]);
  ctx.bezierCurveTo(cp7[0], cp7[1], cp8[0], cp8[1], pEnd[0], pEnd[1]);
  ctx.lineTo(x2, y2);
}

/**
 * Builds the complete closed contour for a piece inside its local piece canvas coordinate space.
 * Nominal piece body sits at (tabSize, tabSize) to (tabSize + w, tabSize + h).
 */
export function buildPiecePath(
  ctx: CanvasRenderingContext2D | Path2D,
  w: number,
  h: number,
  edges: PieceEdges,
  tabSize: number,
  style: 'classic' | 'geometric'
) {
  const x0 = tabSize;
  const y0 = tabSize;
  const x1 = tabSize + w;
  const y1 = tabSize + h;

  ctx.moveTo(x0, y0);

  // Top Edge: left to right (x0, y0) -> (x1, y0), outward normal is UP (0, -1)
  drawEdgeCurve(ctx, x0, y0, x1, y0, edges.top, 0, -1, tabSize, style);

  // Right Edge: top to bottom (x1, y0) -> (x1, y1), outward normal is RIGHT (+1, 0)
  drawEdgeCurve(ctx, x1, y0, x1, y1, edges.right, 1, 0, tabSize, style);

  // Bottom Edge: right to left (x1, y1) -> (x0, y1), outward normal is DOWN (0, +1)
  drawEdgeCurve(ctx, x1, y1, x0, y1, edges.bottom, 0, 1, tabSize, style);

  // Left Edge: bottom to top (x0, y1) -> (x0, y0), outward normal is LEFT (-1, 0)
  drawEdgeCurve(ctx, x0, y1, x0, y0, edges.left, -1, 0, tabSize, style);

  ctx.closePath();
}

/**
 * Synthesizes subtle artistic textures (fine linen canvas weave, impasto grain)
 * to increase visual richness and challenge in higher levels or adaptive difficulty mode.
 */
export function applyArtisticTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isAdaptive: boolean,
  skillFactor: number = 1.0
) {
  if (!isAdaptive && skillFactor <= 1.0) return;

  const intensity = Math.min(0.22, 0.05 * skillFactor);

  // 1. Fine linen/canvas crosshatch texture
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.7})`;
  ctx.lineWidth = 1;

  const step = 6;
  ctx.beginPath();
  for (let x = 0; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // 2. Subtle micro-stippling noise grain for higher skill levels
  if (skillFactor >= 1.2) {
    ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.35})`;
    for (let i = 0; i < 300; i++) {
      const rx = (i * 997) % w;
      const ry = (i * 1999) % h;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
  }

  ctx.restore();
}

/**
 * Computes non-overlapping, neatly organized staging positions for all pieces outside the board.
 * Guarantees NO piece spawns on the board (arrangement mat), and pieces do not bury each other.
 */
export function computePieceStagingPositions(
  totalPieces: number,
  pw: number,
  ph: number,
  boardWidth: number,
  boardHeight: number,
  containerWidth: number,
  containerHeight: number,
  customBoardOffsetX?: number,
  customBoardOffsetY?: number,
  seed?: number
): Array<{ x: number; y: number }> {
  const rng = seed !== undefined ? createPRNG(seed + 99) : Math.random;

  const boardOffsetX =
    customBoardOffsetX !== undefined
      ? customBoardOffsetX
      : Math.max(0, (containerWidth - boardWidth) / 2);
  const boardOffsetY = customBoardOffsetY !== undefined ? customBoardOffsetY : 16;

  const positions: Array<{ x: number; y: number }> = [];
  const hasSideTrays = containerWidth >= boardWidth + 240;

  if (hasSideTrays) {
    // Wide desktop layout: distribute into left and right side gutters
    const leftWidth = Math.max(10, boardOffsetX - 24);
    const rightWidth = Math.max(10, containerWidth - (boardOffsetX + boardWidth) - 24);

    const leftCols = Math.max(1, Math.min(2, Math.floor(leftWidth / (pw + 10))));
    const rightCols = Math.max(1, Math.min(2, Math.floor(rightWidth / (pw + 10))));

    let leftCount = 0;
    let rightCount = 0;

    for (let i = 0; i < totalPieces; i++) {
      const placeLeft = leftCount <= rightCount && leftWidth >= pw + 10;
      if (placeLeft || rightWidth < pw + 10) {
        const colIdx = leftCount % leftCols;
        const rowIdx = Math.floor(leftCount / leftCols);
        const colStep = leftCols > 1 ? (leftWidth - pw) / (leftCols - 1) : 0;
        const rowStep = ph + 14;
        const x = Math.round(16 + colIdx * colStep);
        const y = Math.round(boardOffsetY + rowIdx * rowStep);
        positions.push({
          x: Math.max(8, Math.min(containerWidth - pw - 8, x)),
          y: Math.max(12, Math.min(containerHeight - ph - 8, y)),
        });
        leftCount++;
      } else {
        const colIdx = rightCount % rightCols;
        const rowIdx = Math.floor(rightCount / rightCols);
        const colStep = rightCols > 1 ? (rightWidth - pw) / (rightCols - 1) : 0;
        const rowStep = ph + 14;
        const x = Math.round(boardOffsetX + boardWidth + 20 + colIdx * colStep);
        const y = Math.round(boardOffsetY + rowIdx * rowStep);
        positions.push({
          x: Math.max(8, Math.min(containerWidth - pw - 8, x)),
          y: Math.max(12, Math.min(containerHeight - ph - 8, y)),
        });
        rightCount++;
      }
    }
  } else {
    // Mobile / Tablet vertical layout: strictly placed in the bottom tray below board
    // Board occupies y from boardOffsetY to boardOffsetY + boardHeight
    const trayTop = boardOffsetY + boardHeight + 16;
    const trayHeight = Math.max(ph + 20, containerHeight - trayTop - 12);
    const trayWidth = Math.max(pw + 16, containerWidth - 24);
    const startX = Math.max(12, (containerWidth - trayWidth) / 2);

    // Calculate maximum columns that can comfortably fit
    const minColWidth = pw + 10;
    const colsInTray = Math.max(2, Math.floor(trayWidth / minColWidth));
    const rowsInTray = Math.ceil(totalPieces / colsInTray);

    const colStep = colsInTray > 1 ? (trayWidth - pw) / (colsInTray - 1) : 0;
    const maxRowStep = ph + 14;
    const availRowStep = rowsInTray > 1 ? (trayHeight - ph) / (rowsInTray - 1) : 0;
    const rowStep = rowsInTray > 1 ? Math.min(maxRowStep, Math.max(ph * 0.72, availRowStep)) : 0;

    // Create a shuffled array of slot indices so pieces aren't ordered in assembly order,
    // but each occupies an orderly, non-overlapping slot
    const slotIndices = Array.from({ length: totalPieces }, (_, idx) => idx);
    // Deterministic or pseudo-random shuffle
    for (let i = slotIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = slotIndices[i];
      slotIndices[i] = slotIndices[j];
      slotIndices[j] = tmp;
    }

    for (let i = 0; i < totalPieces; i++) {
      const slot = slotIndices[i];
      const colIdx = slot % colsInTray;
      const rowIdx = Math.floor(slot / colsInTray);

      const baseX = startX + colIdx * colStep;
      const baseY = trayTop + rowIdx * rowStep;

      // Tiny deterministic natural jitter (±2px) without overlapping
      const jitterX = Math.round((rng() * 4) - 2);
      const jitterY = Math.round((rng() * 4) - 2);

      const clampedX = Math.round(Math.max(8, Math.min(containerWidth - pw - 8, baseX + jitterX)));
      const clampedY = Math.round(Math.max(trayTop, Math.min(containerHeight - ph - 8, baseY + jitterY)));

      positions.push({ x: clampedX, y: clampedY });
    }
  }

  return positions;
}

/**
 * Slices an image or source canvas into individual puzzle pieces with accurate clipping paths.
 */
export function sliceImageIntoPieces(
  source: HTMLImageElement | HTMLCanvasElement,
  config: PuzzleConfig,
  containerWidth: number,
  containerHeight: number,
  boardOffsetX?: number,
  boardOffsetY?: number,
  seed?: number
): PuzzlePieceData[] {
  const { rows, cols, boardWidth, boardHeight, tabRatio, pieceStyle } = config;

  const pw = boardWidth / cols;
  const ph = boardHeight / rows;
  const tabSize = pieceStyle === 'geometric' ? 0 : Math.round(Math.min(pw, ph) * tabRatio);

  const edgeMatrix = generateEdgeMatrix(rows, cols, seed);
  const totalPieces = rows * cols;
  const stagingPositions = computePieceStagingPositions(
    totalPieces,
    pw,
    ph,
    boardWidth,
    boardHeight,
    containerWidth,
    containerHeight,
    boardOffsetX,
    boardOffsetY,
    seed
  );

  const pieces: PuzzlePieceData[] = [];

  // Intermediate scaled canvas of the source image to exact board dimensions
  const boardImgCanvas = document.createElement('canvas');
  boardImgCanvas.width = boardWidth;
  boardImgCanvas.height = boardHeight;
  const bCtx = boardImgCanvas.getContext('2d')!;

  // Draw source image scaled to cover board area
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  let drawW = boardWidth;
  let drawH = boardHeight;
  let drawX = 0;
  let drawY = 0;

  if (srcW > 0 && srcH > 0) {
    const srcRatio = srcW / srcH;
    const boardRatio = boardWidth / boardHeight;
    if (srcRatio > boardRatio) {
      drawH = boardHeight;
      drawW = boardHeight * srcRatio;
      drawX = (boardWidth - drawW) / 2;
    } else {
      drawW = boardWidth;
      drawH = boardWidth / srcRatio;
      drawY = (boardHeight - drawH) / 2;
    }
  }

  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(0, 0, boardWidth, boardHeight);
  bCtx.drawImage(source, drawX, drawY, drawW, drawH);

  // Apply subtle complex artistic texture based on level progression & adaptive difficulty
  applyArtisticTexture(bCtx, boardWidth, boardHeight, config.adaptiveDifficulty, config.adaptiveSkillFactor);

  let id = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edges = getPieceEdges(r, c, rows, cols, edgeMatrix);
      const isEdgePiece = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;

      const canvasWidth = Math.ceil(pw + 2 * tabSize);
      const canvasHeight = Math.ceil(ph + 2 * tabSize);

      const pieceCanvas = document.createElement('canvas');
      pieceCanvas.width = canvasWidth;
      pieceCanvas.height = canvasHeight;
      const pCtx = pieceCanvas.getContext('2d')!;

      // 1. Clip to the piece contour
      pCtx.save();
      pCtx.beginPath();
      buildPiecePath(pCtx, pw, ph, edges, tabSize, pieceStyle);
      pCtx.clip();

      // 2. Draw corresponding image slice (accounting for tab extension offsets)
      const srcSliceX = c * pw - tabSize;
      const srcSliceY = r * ph - tabSize;

      pCtx.drawImage(
        boardImgCanvas,
        srcSliceX,
        srcSliceY,
        canvasWidth,
        canvasHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      // 3. Subtle tactile inner bevel & card thickness
      pCtx.lineWidth = 2.5;
      pCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      pCtx.stroke();

      pCtx.restore();

      // 4. Subtle outer seam shadow stroke
      pCtx.save();
      pCtx.beginPath();
      buildPiecePath(pCtx, pw, ph, edges, tabSize, pieceStyle);
      pCtx.lineWidth = 1.2;
      pCtx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      pCtx.stroke();
      pCtx.restore();

      const targetX = c * pw;
      const targetY = r * ph;

      const pieceId = id++;
      const staging = stagingPositions[pieceId] || {
        x: 16 + (c * (pw + 10)),
        y: boardHeight + 40 + (r * (ph + 10)),
      };

      pieces.push({
        id: pieceId,
        row: r,
        col: c,
        edges,
        isEdgePiece,
        targetX,
        targetY,
        currentX: staging.x,
        currentY: staging.y,
        width: pw,
        height: ph,
        tabSize,
        canvasDataUrl: pieceCanvas.toDataURL(),
        canvasWidth,
        canvasHeight,
        isLocked: false,
        zIndex: 20 + pieceId,
      });
    }
  }

  return pieces;
}

/**
 * Check if a piece's current position is within snap threshold of its target board coordinate.
 */
export function checkPieceSnap(
  piece: PuzzlePieceData,
  boardOffsetX: number,
  boardOffsetY: number,
  threshold: number = 15
): boolean {
  const currentBoardRelativeX = piece.currentX - boardOffsetX;
  const currentBoardRelativeY = piece.currentY - boardOffsetY;

  const dist = Math.hypot(
    currentBoardRelativeX - piece.targetX,
    currentBoardRelativeY - piece.targetY
  );

  return dist <= threshold;
}
