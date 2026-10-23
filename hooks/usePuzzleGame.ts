'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PuzzlePieceData,
  PuzzleConfig,
  PuzzleLevel,
  LevelProgress,
} from '@/types/puzzle';
import {
  sliceImageIntoPieces,
  checkPieceSnap,
  computePieceStagingPositions,
} from '@/lib/puzzleMath';
import { sound } from '@/lib/audio';

interface UsePuzzleGameOptions {
  campaignProgress: Record<number, LevelProgress>;
}

export function usePuzzleGame({ campaignProgress }: UsePuzzleGameOptions) {
  const [currentLevel, setCurrentLevel] = useState<PuzzleLevel | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number>(-1);

  const [config, setConfig] = useState<PuzzleConfig>(() => {
    const isClient = typeof window !== 'undefined';
    const winW = isClient ? window.innerWidth : 600;
    const winH = isClient ? window.innerHeight : 800;

    let w = 540;
    if (winW < 640) {
      const maxH = Math.max(180, Math.floor((winH - 120) * 0.38));
      w = Math.min(Math.max(260, winW - 32), Math.round(maxH * (4 / 3)), 330);
    } else if (winW < 900) {
      w = Math.min(460, winW - 48);
    }
    const h = Math.round(w * 0.75);

    return {
      rows: 3,
      cols: 3,
      boardWidth: w,
      boardHeight: h,
      tabRatio: 0.22,
      snapThreshold: 18,
      pieceStyle: 'classic',
      adaptiveDifficulty: true,
      adaptiveSkillFactor: 1.0,
    };
  });

  const [pieces, setPieces] = useState<PuzzlePieceData[]>([]);
  const [ghostImageUrl, setGhostImageUrl] = useState<string | null>(null);
  const [currentArtworkTitle, setCurrentArtworkTitle] = useState<string>('Morning Sunflower');
  const [currentSource, setCurrentSource] = useState<HTMLCanvasElement | HTMLImageElement | null>(null);

  const [lockedCount, setLockedCount] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [filterEdgesOnly, setFilterEdgesOnly] = useState<boolean>(false);
  const [hintedPiece, setHintedPiece] = useState<PuzzlePieceData | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const highestZIndex = useRef<number>(100);
  const timerIntervalRef = useRef<number | null>(null);

  const [dragState, setDragState] = useState<{
    pieceId: number;
    startPointerX: number;
    startPointerY: number;
    startPieceX: number;
    startPieceY: number;
  } | null>(null);

  // Compute adaptive skill factor from campaignProgress dynamically
  const adaptiveSkillFactor = useMemo(() => {
    const completedList = Object.values(campaignProgress).filter((p) => p.completed);
    if (completedList.length > 0) {
      const avgStars = completedList.reduce((acc, p) => acc + p.stars, 0) / completedList.length;
      if (avgStars >= 2.7) return 1.45;
      if (avgStars >= 2.3) return 1.30;
      if (avgStars >= 1.8) return 1.15;
    }
    return 1.0;
  }, [campaignProgress]);

  const configRef = useRef(config);
  configRef.current = config;

  // Load and slice an image into pieces on the board
  const loadPuzzle = useCallback(
    (source: HTMLCanvasElement | HTMLImageElement, title: string, customConfig?: PuzzleConfig) => {
      const activeConfig = customConfig || configRef.current;
      setCurrentSource(source);
      setCurrentArtworkTitle(title);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = activeConfig.boardWidth;
      tempCanvas.height = activeConfig.boardHeight;
      const tCtx = tempCanvas.getContext('2d')!;

      const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
      const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

      let drawW = activeConfig.boardWidth;
      let drawH = activeConfig.boardHeight;
      let drawX = 0;
      let drawY = 0;

      if (srcW > 0 && srcH > 0) {
        const srcRatio = srcW / srcH;
        const boardRatio = activeConfig.boardWidth / activeConfig.boardHeight;
        if (srcRatio > boardRatio) {
          drawH = activeConfig.boardHeight;
          drawW = activeConfig.boardHeight * srcRatio;
          drawX = (activeConfig.boardWidth - drawW) / 2;
        } else {
          drawW = activeConfig.boardWidth;
          drawH = activeConfig.boardWidth / srcRatio;
          drawY = (activeConfig.boardHeight - drawH) / 2;
        }
      }

      tCtx.drawImage(source, drawX, drawY, drawW, drawH);
      const ghostUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
      setGhostImageUrl(ghostUrl);

      const tableRect = tableRef.current?.getBoundingClientRect();
      const boardRect = boardRef.current?.getBoundingClientRect();

      const containerWidth =
        tableRect?.width || (typeof window !== 'undefined' ? window.innerWidth : 390);
      const containerHeight =
        tableRect?.height || (typeof window !== 'undefined' ? window.innerHeight - 56 : 600);

      const boardOffsetX =
        boardRect && tableRect
          ? boardRect.left - tableRect.left + (tableRef.current?.scrollLeft || 0)
          : Math.max(0, (containerWidth - activeConfig.boardWidth) / 2);
      const boardOffsetY =
        boardRect && tableRect
          ? boardRect.top - tableRect.top + (tableRef.current?.scrollTop || 0)
          : 16;

      const generatedPieces = sliceImageIntoPieces(
        source,
        activeConfig,
        containerWidth,
        containerHeight,
        boardOffsetX,
        boardOffsetY
      );

      setPieces(generatedPieces);
      setLockedCount(0);
      setTimeElapsed(0);
      setIsComplete(false);
      setHintedPiece(null);
      setIsPlaying(true);
      highestZIndex.current = 100;
    },
    []
  );

  // Launch a specific Campaign Level with Adaptive Difficulty scaling
  const handleStartLevel = useCallback(
    (level: PuzzleLevel) => {
      setCurrentLevel(level);
      setHintsRemaining(level.maxHints);

      let activeRows = level.rows;
      let activeCols = level.cols;
      const currentConfig = configRef.current;

      if (currentConfig.adaptiveDifficulty && adaptiveSkillFactor >= 1.25) {
        if (level.rows <= 3 && level.cols <= 3) {
          activeRows = 3;
          activeCols = 4;
        } else if (level.rows <= 4 && level.cols <= 4) {
          activeRows = 4;
          activeCols = 5;
        } else if (level.rows <= 5 && level.cols <= 5) {
          activeRows = 5;
          activeCols = 6;
        } else if (level.rows <= 6 && level.cols <= 6) {
          activeRows = 6;
          activeCols = 7;
        }
      }

      const pw = currentConfig.boardWidth / activeCols;
      const adaptiveSnap = Math.max(12, Math.min(18, Math.round(pw * 0.28)));

      const newConfig: PuzzleConfig = {
        ...currentConfig,
        rows: activeRows,
        cols: activeCols,
        adaptiveSkillFactor,
        snapThreshold: adaptiveSnap,
      };
      setConfig(newConfig);

      const art = level.generateArt();
      loadPuzzle(art, level.title, newConfig);
    },
    [adaptiveSkillFactor, loadPuzzle]
  );

  // Timer effect
  useEffect(() => {
    if (isPlaying && !isComplete && currentSource) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, isComplete, currentSource]);

  // Dynamic responsive dimensions for tablet and mobile (evaluates width & height)
  useEffect(() => {
    const updateDimensions = () => {
      if (!tableRef.current) return;
      const w = tableRef.current.clientWidth;
      const h =
        tableRef.current.clientHeight ||
        (typeof window !== 'undefined' ? window.innerHeight - 60 : 700);

      let targetW = 540;

      if (w < 640) {
        // Mobile: leave ample height for piece tray, fit in 100dvh without scrolling
        const maxH = Math.max(180, Math.floor((h - 100) * 0.38));
        targetW = Math.min(Math.max(260, w - 32), Math.round(maxH * (4 / 3)), 330);
      } else if (w < 1024) {
        // Tablet: balanced layout
        const maxH = Math.max(240, Math.floor((h - 110) * 0.44));
        targetW = Math.min(Math.max(340, w - 48), Math.round(maxH * (4 / 3)), 480);
      } else {
        // Desktop: comfortable solving mat with side gutters
        const maxH = Math.max(300, Math.floor((h - 120) * 0.65));
        targetW = Math.min(620, Math.round(maxH * (4 / 3)));
      }

      const targetH = Math.round(targetW * 0.75);

      if (targetW !== config.boardWidth || targetH !== config.boardHeight) {
        setConfig((prev) => ({
          ...prev,
          boardWidth: targetW,
          boardHeight: targetH,
        }));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [config.boardWidth, config.boardHeight]);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, piece: PuzzlePieceData) => {
    if (piece.isLocked) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    highestZIndex.current += 1;
    const newZIndex = highestZIndex.current;

    setPieces((prev) =>
      prev.map((p) => (p.id === piece.id ? { ...p, zIndex: newZIndex } : p))
    );

    setDragState({
      pieceId: piece.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPieceX: piece.currentX,
      startPieceY: piece.currentY,
    });

    sound.playPickup();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startPointerX;
    const deltaY = e.clientY - dragState.startPointerY;

    const newX = dragState.startPieceX + deltaX;
    const newY = dragState.startPieceY + deltaY;

    const piece = pieces.find((p) => p.id === dragState.pieceId);
    const tabSize = piece?.tabSize || 10;

    // Gentle bounding clamping to prevent pieces from disappearing off-screen
    const clampedX = Math.max(-tabSize / 2, newX);
    const clampedY = Math.max(-tabSize / 2, newY);

    setPieces((prev) =>
      prev.map((p) => (p.id === dragState.pieceId ? { ...p, currentX: clampedX, currentY: clampedY } : p))
    );
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    const piece = pieces.find((p) => p.id === dragState.pieceId);
    setDragState(null);

    if (!piece || piece.isLocked) return;

    if (boardRef.current && tableRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const tableRect = tableRef.current.getBoundingClientRect();

      // Accurate board offset factoring in container scroll positions
      const boardOffsetX = boardRect.left - tableRect.left + tableRef.current.scrollLeft;
      const boardOffsetY = boardRect.top - tableRect.top + tableRef.current.scrollTop;

      const shouldSnap = checkPieceSnap(
        piece,
        boardOffsetX,
        boardOffsetY,
        config.snapThreshold
      );

      if (shouldSnap) {
        const exactX = boardOffsetX + piece.targetX;
        const exactY = boardOffsetY + piece.targetY;

        setPieces((prev) =>
          prev.map((p) =>
            p.id === piece.id
              ? {
                  ...p,
                  currentX: exactX,
                  currentY: exactY,
                  isLocked: true,
                  zIndex: 10,
                }
              : p
          )
        );

        const newLockedCount = lockedCount + 1;
        setLockedCount(newLockedCount);
        sound.playSnap();

        if (hintedPiece?.id === piece.id) {
          setHintedPiece(null);
        }

        if (newLockedCount === pieces.length) {
          setIsComplete(true);
          setIsPlaying(false);
        }
      } else {
        sound.playDrop();
      }
    }
  };

  const handleTriggerHint = () => {
    if (hintsRemaining === 0) return;

    const loosePieces = pieces.filter((p) => !p.isLocked);
    if (loosePieces.length === 0) return;

    const candidate = loosePieces.find((p) => p.isEdgePiece) || loosePieces[0];
    setHintedPiece(candidate);
    sound.playHint();

    if (hintsRemaining > 0) {
      setHintsRemaining((prev) => prev - 1);
    }

    setTimeout(() => {
      setHintedPiece((curr) => (curr?.id === candidate.id ? null : curr));
    }, 4500);
  };

  const handleRearrangeTray = () => {
    if (!tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const boardRect = boardRef.current?.getBoundingClientRect();

    const boardOffsetX =
      boardRect
        ? boardRect.left - tableRect.left + tableRef.current.scrollLeft
        : Math.max(0, (tableRect.width - config.boardWidth) / 2);
    const boardOffsetY =
      boardRect
        ? boardRect.top - tableRect.top + tableRef.current.scrollTop
        : 16;

    const pw = config.boardWidth / config.cols;
    const ph = config.boardHeight / config.rows;

    const loosePieces = pieces.filter((p) => !p.isLocked);
    if (loosePieces.length === 0) return;

    const newPositions = computePieceStagingPositions(
      loosePieces.length,
      pw,
      ph,
      config.boardWidth,
      config.boardHeight,
      tableRect.width,
      tableRect.height,
      boardOffsetX,
      boardOffsetY
    );

    let looseIdx = 0;
    const updatedPieces = pieces.map((p) => {
      if (p.isLocked) return p;
      const pos = newPositions[looseIdx++] || { x: p.currentX, y: p.currentY };
      return {
        ...p,
        currentX: pos.x,
        currentY: pos.y,
      };
    });

    setPieces(updatedPieces);
    sound.playPickup();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const toggleAdaptive = () => {
    setConfig((prev) => ({
      ...prev,
      adaptiveDifficulty: !prev.adaptiveDifficulty,
    }));
  };

  return {
    currentLevel,
    setCurrentLevel,
    config,
    setConfig,
    pieces,
    ghostImageUrl,
    currentArtworkTitle,
    currentSource,
    lockedCount,
    timeElapsed,
    isPlaying,
    isComplete,
    setIsComplete,
    showGhost,
    setShowGhost,
    filterEdgesOnly,
    setFilterEdgesOnly,
    hintedPiece,
    isMuted,
    toggleMute,
    hintsRemaining,
    dragState,
    tableRef,
    boardRef,
    loadPuzzle,
    handleStartLevel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTriggerHint,
    handleRearrangeTray,
    toggleAdaptive,
  };
}
