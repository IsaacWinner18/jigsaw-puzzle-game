'use client';

import { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Copy,
  Check,
  Crown,
  Users,
  Play,
  ArrowLeft,
  Share2,
  Trophy,
  Zap,
  Timer,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PuzzleBoard } from '@/components/game/PuzzleBoard';
import { PuzzlePiece } from '@/components/game/PuzzlePiece';
import { CornerReference } from '@/components/game/CornerReference';
import { MULTIPLAYER_PUZZLES, preloadPuzzleImage } from '@/lib/multiplayerPuzzles';
import {
  MultiplayerRoomState,
  MultiplayerPlayer,
  subscribeToRoom,
} from '@/lib/multiplayerStore';
import { sliceImageIntoPieces, checkPieceSnap, computePieceStagingPositions } from '@/lib/puzzleMath';
import { sound } from '@/lib/audio';
import { usePassizy } from '@/hooks/usePassizy';
import { getPlayerProfile, savePlayerName } from '@/lib/playerProfile';
import { PuzzlePieceData, PuzzleConfig } from '@/types/puzzle';

function MultiplayerRoomContent() {
  const router = useRouter();
  const params = useParams();
  const rawCode = params?.code;
  const roomCode = typeof rawCode === 'string' ? rawCode.toUpperCase() : 'LOBBY';

  const { student, triggerHaptic } = usePassizy();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Modal & Notice States
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [isConfirmingExit, setIsConfirmingExit] = useState(false);
  const [roomClosedModalOpen, setRoomClosedModalOpen] = useState(false);
  const [forfeitWonByOpponentExit, setForfeitWonByOpponentExit] = useState(false);
  const [opponentNotice, setOpponentNotice] = useState<string | null>(null);

  const [customName, setCustomName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInputValue, setNameInputValue] = useState<string>('');

  // Local player profile (Zero Mock Data, distinct session IDs per tab)
  const localPlayer = useMemo<MultiplayerPlayer>(() => {
    const profile = getPlayerProfile(student);
    return {
      id: profile.id,
      name: customName || profile.name,
      department: student?.department,
      isHost: false,
      piecesLocked: 0,
      totalPieces: 16,
      status: 'ready',
    };
  }, [student, customName]);

  // Selected puzzle configuration
  const puzzleTheme = useMemo(() => {
    const id = roomState?.puzzleId || 'tom-jerry';
    return MULTIPLAYER_PUZZLES.find((p) => p.id === id) || MULTIPLAYER_PUZZLES[0];
  }, [roomState?.puzzleId]);

  // Preload high-res 8k 3D artwork during lobby phase
  useEffect(() => {
    if (puzzleTheme?.imageUrl) {
      preloadPuzzleImage(puzzleTheme.imageUrl);
    }
  }, [puzzleTheme]);

  // Puzzle gameplay states
  const [pieces, setPieces] = useState<PuzzlePieceData[]>([]);
  const [ghostImageUrl, setGhostImageUrl] = useState<string | null>(null);
  const [lockedCount, setLockedCount] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [dragState, setDragState] = useState<{
    pieceId: number;
    startPointerX: number;
    startPointerY: number;
    startPieceX: number;
    startPieceY: number;
  } | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const highestZIndex = useRef<number>(100);
  const timerIntervalRef = useRef<number | null>(null);
  const broadcastRef = useRef<((state: MultiplayerRoomState) => void) | null>(null);
  const broadcastActionRef = useRef<((action: 'PLAYER_LEFT' | 'PLAYER_FORFEIT' | 'ROOM_CLOSED', payload?: any) => void) | null>(null);
  const hasInitializedPiecesRef = useRef<boolean>(false);

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
      rows: 4,
      cols: 4,
      boardWidth: w,
      boardHeight: h,
      tabRatio: 0.22,
      snapThreshold: 18,
      pieceStyle: 'classic',
      adaptiveDifficulty: false,
      adaptiveSkillFactor: 1.0,
    };
  });

  // Responsive dimensions updater
  useEffect(() => {
    const updateDimensions = () => {
      if (!tableRef.current) return;
      const w = tableRef.current.clientWidth;
      const h = tableRef.current.clientHeight || (typeof window !== 'undefined' ? window.innerHeight - 60 : 700);

      let targetW = 540;
      if (w < 640) {
        const maxH = Math.max(180, Math.floor((h - 100) * 0.38));
        targetW = Math.min(Math.max(260, w - 32), Math.round(maxH * (4 / 3)), 330);
      } else if (w < 1024) {
        const maxH = Math.max(240, Math.floor((h - 110) * 0.44));
        targetW = Math.min(Math.max(340, w - 48), Math.round(maxH * (4 / 3)), 480);
      } else {
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

  // Synchronized Countdown Sequence
  const startCountdownSequence = useCallback(() => {
    setCountdown(3);
    sound.playPickup();
    triggerHaptic('light');

    let count = 3;
    const interval = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playPickup();
        triggerHaptic('light');
      } else if (count === 0) {
        setCountdown(0); // "GO!"
        sound.playSnap();
        triggerHaptic('heavy');
      } else {
        clearInterval(interval);
        setCountdown(null);
        // Switch to playing
        setRoomState((prev) => {
          if (!prev) return null;
          const playingState: MultiplayerRoomState = {
            ...prev,
            status: 'playing',
            startedAt: Date.now(),
          };
          if (prev.hostId === localPlayer.id) {
            broadcastRef.current?.(playingState);
            fetch('/api/multiplayer/room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'update', code: roomCode, room: playingState }),
            }).catch(() => {});
          }
          return playingState;
        });
      }
    }, 1000);
  }, [triggerHaptic, localPlayer.id, roomCode]);

  // Initialize room & sync subscription (Pure Supabase / Network - Zero Browser Storage)
  useEffect(() => {
    let isSubscribed = true;
    let cleanupSync: (() => void) | null = null;

    async function initRoom() {
      setIsLoadingRoom(true);
      setRoomError(null);

      let state: MultiplayerRoomState | null = null;

      // Query official serverless / Supabase backend for room state with retries
      for (let retry = 0; retry < 5 && !state; retry++) {
        if (retry > 0) {
          await new Promise((r) => setTimeout(r, 450));
          if (!isSubscribed) return;
        }
        try {
          const res = await fetch('/api/multiplayer/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', code: roomCode }),
          });
          const data = await res.json();
          if (data.success && data.room) {
            state = data.room;
            break;
          } else if (data.error && retry >= 2) {
            if (isSubscribed) {
              setRoomError(data.error);
              setIsLoadingRoom(false);
            }
            return;
          }
        } catch (err) {
          console.error('Failed fetching official room from backend', err);
        }
      }

      if (!state) {
        if (isSubscribed) {
          setRoomError('The battle room code does not exist or has expired.');
          setIsLoadingRoom(false);
        }
        return;
      }

      // Check room status condition
      if (state.status === 'closed') {
        if (isSubscribed) {
          setRoomError('This battle room was closed by the host.');
          setIsLoadingRoom(false);
        }
        return;
      }

      const existingPlayerIds = Object.keys(state.players || {});
      const isAlreadyInRoom = existingPlayerIds.includes(localPlayer.id);

      if (state.status === 'finished' && !isAlreadyInRoom) {
        if (isSubscribed) {
          setRoomError('This battle has already finished.');
          setIsLoadingRoom(false);
        }
        return;
      }

      if ((state.status === 'playing' || state.status === 'countdown') && !isAlreadyInRoom) {
        if (isSubscribed) {
          setRoomError('This battle is already in progress.');
          setIsLoadingRoom(false);
        }
        return;
      }

      if (state.status === 'waiting' && !isAlreadyInRoom && existingPlayerIds.length >= 2) {
        if (isSubscribed) {
          setRoomError('This 1v1 battle arena is already full (2/2 competitors).');
          setIsLoadingRoom(false);
        }
        return;
      }

      // Register current player in room roster
      state.players[localPlayer.id] = {
        ...localPlayer,
        isHost: state.hostId === localPlayer.id,
        totalPieces: state.rows * state.cols,
      };

      if (isSubscribed) {
        setRoomState(state);
        setIsLoadingRoom(false);
      }

      // Sync joiner to serverless state
      try {
        await fetch('/api/multiplayer/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            code: roomCode,
            player: state.players[localPlayer.id],
          }),
        });
      } catch {}

      if (!isSubscribed) return;

      // Subscribe to real-time events via Supabase Realtime channel
      const { broadcastUpdate, broadcastAction, unsubscribe } = subscribeToRoom(roomCode, localPlayer, {
        onStateUpdate: (updated) => {
          if (!isSubscribed) return;
          setRoomState((prev) => {
            if (prev?.status === 'waiting' && updated.status === 'countdown') {
              startCountdownSequence();
            }
            return updated;
          });
        },
        onPlayerLeft: (playerId) => {
          if (!isSubscribed) return;
          setRoomState((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            delete updatedPlayers[playerId];
            return { ...prev, players: updatedPlayers };
          });
          setOpponentNotice('Opponent left the room');
          setTimeout(() => setOpponentNotice(null), 4000);
        },
        onPlayerForfeit: () => {
          if (!isSubscribed) return;
          triggerHaptic('heavy');
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.65 },
          });
          sound.playSnap();
          setRoomState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: 'finished',
              winnerId: localPlayer.id,
              winnerName: localPlayer.name,
            };
          });
          setForfeitWonByOpponentExit(true);
        },
        onRoomClosed: () => {
          if (!isSubscribed) return;
          setRoomClosedModalOpen(true);
        },
        onPresenceLeave: (playerId) => {
          if (!isSubscribed) return;
          setRoomState((prev) => {
            if (!prev) return null;
            if (prev.status === 'waiting') {
              const updatedPlayers = { ...prev.players };
              delete updatedPlayers[playerId];
              return { ...prev, players: updatedPlayers };
            }
            return prev;
          });
        },
      });

      if (!isSubscribed) {
        unsubscribe();
        return;
      }

      broadcastRef.current = broadcastUpdate;
      broadcastActionRef.current = broadcastAction;
      broadcastUpdate(state);
      cleanupSync = unsubscribe;
    }

    initRoom();

    return () => {
      isSubscribed = false;
      broadcastRef.current = null;
      broadcastActionRef.current = null;
      if (cleanupSync) cleanupSync();
    };
  }, [roomCode, localPlayer.id, startCountdownSequence, triggerHaptic]);

  // Rename player dynamically and broadcast update to room
  const handleSaveName = () => {
    const clean = nameInputValue.trim();
    if (clean) {
      savePlayerName(clean);
      setCustomName(clean);
      if (roomState) {
        const updated: MultiplayerRoomState = {
          ...roomState,
          players: {
            ...roomState.players,
            [localPlayer.id]: {
              ...roomState.players[localPlayer.id],
              name: clean,
            },
          },
        };
        setRoomState(updated);
        broadcastRef.current?.(updated);
      }
    }
    setIsEditingName(false);
  };

  // Host triggers the game start
  const handleHostStartGame = () => {
    if (!roomState) return;
    triggerHaptic('medium');

    const updated: MultiplayerRoomState = {
      ...roomState,
      status: 'countdown',
      countdownValue: 3,
    };
    broadcastRef.current?.(updated);
    startCountdownSequence();
  };

  // Safe Exit Handlers with Modals
  const handleOpenExitModal = () => {
    triggerHaptic('light');
    setExitModalOpen(true);
  };

  const handleConfirmExit = async () => {
    setIsConfirmingExit(true);
    triggerHaptic('medium');

    try {
      const isLobby = roomState?.status === 'waiting';

      if (isLobby) {
        // Leaving lobby
        await fetch('/api/multiplayer/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            code: roomCode,
            playerId: localPlayer.id,
          }),
        });

        if (isHost) {
          broadcastActionRef.current?.('ROOM_CLOSED', { reason: 'Host closed the room' });
        } else {
          broadcastActionRef.current?.('PLAYER_LEFT', { playerId: localPlayer.id });
        }
      } else {
        // Forfeiting active match
        await fetch('/api/multiplayer/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'forfeit',
            code: roomCode,
            playerId: localPlayer.id,
          }),
        });

        broadcastActionRef.current?.('PLAYER_FORFEIT', { playerId: localPlayer.id });
      }
    } catch (err) {
      console.error('Error during exit:', err);
    } finally {
      setIsConfirmingExit(false);
      setExitModalOpen(false);
      router.push('/multiplayer');
    }
  };

  // Generate deterministic puzzle pieces once room enters 'playing'
  useEffect(() => {
    if (roomState?.status === 'playing' && puzzleTheme) {
      if (hasInitializedPiecesRef.current) return;
      hasInitializedPiecesRef.current = true;

      const rows = roomState.rows;
      const cols = roomState.cols;
      const activeConfig: PuzzleConfig = {
        ...config,
        rows,
        cols,
      };

      const art = puzzleTheme.generateArt();
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = activeConfig.boardWidth;
      tempCanvas.height = activeConfig.boardHeight;
      const tCtx = tempCanvas.getContext('2d')!;
      tCtx.drawImage(art, 0, 0, activeConfig.boardWidth, activeConfig.boardHeight);
      setGhostImageUrl(tempCanvas.toDataURL('image/jpeg', 0.9));

      const tableRect = tableRef.current?.getBoundingClientRect();
      const boardRect = boardRef.current?.getBoundingClientRect();

      const containerWidth = tableRect?.width || (typeof window !== 'undefined' ? window.innerWidth : 390);
      const containerHeight = tableRect?.height || (typeof window !== 'undefined' ? window.innerHeight - 56 : 600);

      const boardOffsetX = boardRect && tableRect ? boardRect.left - tableRect.left : Math.max(0, (containerWidth - activeConfig.boardWidth) / 2);
      const boardOffsetY = boardRect && tableRect ? boardRect.top - tableRect.top : 16;

      // Deterministic generation using room.seed!
      const generatedPieces = sliceImageIntoPieces(
        art,
        activeConfig,
        containerWidth,
        containerHeight,
        boardOffsetX,
        boardOffsetY,
        roomState.seed
      );

      setPieces(generatedPieces);
      setLockedCount(0);
      setTimeElapsed(0);
      highestZIndex.current = 100;
    } else if (roomState?.status !== 'playing') {
      hasInitializedPiecesRef.current = false;
    }
  }, [roomState?.status, puzzleTheme, config]);

  // Stopwatch timer during active gameplay
  useEffect(() => {
    if (roomState?.status === 'playing') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [roomState?.status]);


  // Pointer drag interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, piece: PuzzlePieceData) => {
    if (piece.isLocked || roomState?.status !== 'playing') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    highestZIndex.current += 1;
    const newZIndex = highestZIndex.current;
    setPieces((prev) => prev.map((p) => (p.id === piece.id ? { ...p, zIndex: newZIndex } : p)));

    setDragState({
      pieceId: piece.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPieceX: piece.currentX,
      startPieceY: piece.currentY,
    });

    sound.playPickup();
    triggerHaptic('light');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const deltaX = e.clientX - dragState.startPointerX;
    const deltaY = e.clientY - dragState.startPointerY;
    const newX = dragState.startPieceX + deltaX;
    const newY = dragState.startPieceY + deltaY;

    setPieces((prev) =>
      prev.map((p) => (p.id === dragState.pieceId ? { ...p, currentX: newX, currentY: newY } : p))
    );
  };

  const handlePointerUp = async () => {
    if (!dragState) return;
    const piece = pieces.find((p) => p.id === dragState.pieceId);
    setDragState(null);
    if (!piece || piece.isLocked) return;

    if (boardRef.current && tableRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const tableRect = tableRef.current.getBoundingClientRect();
      const boardOffsetX = boardRect.left - tableRect.left + tableRef.current.scrollLeft;
      const boardOffsetY = boardRect.top - tableRect.top + tableRef.current.scrollTop;

      const shouldSnap = checkPieceSnap(piece, boardOffsetX, boardOffsetY, config.snapThreshold);

      if (shouldSnap) {
        const exactX = boardOffsetX + piece.targetX;
        const exactY = boardOffsetY + piece.targetY;

        setPieces((prev) =>
          prev.map((p) =>
            p.id === piece.id ? { ...p, currentX: exactX, currentY: exactY, isLocked: true, zIndex: 10 } : p
          )
        );

        const newLockedCount = lockedCount + 1;
        setLockedCount(newLockedCount);
        sound.playSnap();
        triggerHaptic('medium');

        // Broadcast progress update to room
        if (roomState) {
          const isPlayerDone = newLockedCount === pieces.length;
          const updated: MultiplayerRoomState = {
            ...roomState,
            status: isPlayerDone ? 'finished' : roomState.status,
            winnerId: isPlayerDone ? localPlayer.id : roomState.winnerId,
            winnerName: isPlayerDone ? localPlayer.name : roomState.winnerName,
            players: {
              ...roomState.players,
              [localPlayer.id]: {
                ...localPlayer,
                piecesLocked: newLockedCount,
                completedAt: isPlayerDone ? Date.now() : undefined,
                elapsedSeconds: isPlayerDone ? timeElapsed : undefined,
                status: isPlayerDone ? 'finished' : 'playing',
              },
            },
          };

          broadcastRef.current?.(updated);

          // Submit to Next.js Serverless Route for authoritative victory verification
          if (isPlayerDone) {
            triggerHaptic('heavy');
            confetti({
              particleCount: 40,
              spread: 55,
              origin: { y: 0.65 },
              scalar: 0.8,
              disableForReducedMotion: true,
            });

            try {
              await fetch('/api/multiplayer/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  roomCode,
                  playerId: localPlayer.id,
                  playerName: localPlayer.name,
                  elapsedSeconds: timeElapsed,
                }),
              });
            } catch {
              // Local winner registered
            }
          }
        }
      } else {
        sound.playDrop();
      }
    }
  };

  const handleRearrangeTray = () => {
    if (!tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const boardRect = boardRef.current?.getBoundingClientRect();

    const boardOffsetX = boardRect ? boardRect.left - tableRect.left : Math.max(0, (tableRect.width - config.boardWidth) / 2);
    const boardOffsetY = boardRect ? boardRect.top - tableRect.top : 16;
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
      boardOffsetY,
      roomState?.seed
    );

    let looseIdx = 0;
    setPieces((prev) =>
      prev.map((p) => {
        if (p.isLocked) return p;
        const pos = newPositions[looseIdx++] || { x: p.currentX, y: p.currentY };
        return { ...p, currentX: pos.x, currentY: pos.y };
      })
    );
    sound.playPickup();
    triggerHaptic('light');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    triggerHaptic('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isHost = roomState?.hostId === localPlayer.id;
  const isPlaying = roomState?.status === 'playing';
  const isFinished = roomState?.status === 'finished';
  const isWinner = roomState?.winnerId === localPlayer.id;

  const playerList = useMemo(() => {
    return Object.values(roomState?.players || {});
  }, [roomState?.players]);

  const opponentPlayer = useMemo(() => {
    return playerList.find((p) => p.id !== localPlayer.id) || null;
  }, [playerList, localPlayer.id]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Loading or Room Error Guards
  if (roomError) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-inter">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 text-2xl font-anton">
          ⚠️
        </div>
        <h1 className="text-2xl font-anton tracking-wide uppercase text-white mb-2">
          Unable to Join Room
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 font-inter leading-relaxed">
          {roomError}
        </p>
        <Button
          onClick={() => router.push('/multiplayer')}
          variant="amber"
          size="default"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Multiplayer</span>
        </Button>
      </div>
    );
  }

  if (isLoadingRoom || !roomState) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-inter">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-anton tracking-wider uppercase text-white mb-1">
          Connecting to Arena...
        </h2>
      </div>
    );
  }

  // If waiting in lobby: render Room Setup & Player Joins
  if (roomState?.status === 'waiting') {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-inter select-none overflow-x-hidden pt-[max(12px,var(--passizy-safe-area-top))] pb-[max(16px,var(--passizy-safe-area-bottom))]">
        {/* Header */}
        <header className="w-full max-w-4xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-800">
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenExitModal}
            className="gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHost ? 'close room' : 'exit'}</span>
          </Button>
        </header>

        {/* Main Lobby View */}
        <main className="w-full max-w-3xl mx-auto px-4 py-6 flex-1 flex flex-col justify-center items-center">
          {/* Room Code Showcase */}
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md text-center mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-poppins mb-2">
              Multiplayer Match Code
            </div>

            {/* Giant Room Code Display */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
              {roomCode.split('').map((char, idx) => (
                <div
                  key={idx}
                  className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl bg-slate-950 border-2 border-amber-400/60 flex items-center justify-center text-2xl sm:text-3xl font-anton text-amber-400 shadow-lg shadow-amber-500/10"
                >
                  {char}
                </div>
              ))}
            </div>

            {/* Copy Actions */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="amberOutline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Invite Link'}</span>
              </Button>
            </div>
          </div>

          {/* Selected Puzzle Summary */}
          <div className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {puzzleTheme.imageUrl ? (
                <img
                  src={puzzleTheme.imageUrl}
                  alt={puzzleTheme.title}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-anton text-lg">
                  🧩
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white font-poppins">{puzzleTheme.title}</div>
                <div className="text-xs text-slate-400 font-inter">
                  {puzzleTheme.difficulty} · {roomState.rows}×{roomState.cols} ({roomState.rows * roomState.cols} Pieces)
                </div>
              </div>
            </div>
          </div>

          {/* Joined Competitors Roster */}
          <div className="w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-3 text-xs font-poppins">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>players({playerList.length}/2)</span>
              </span>
             
            </div>

            <div className="space-y-2">
              {playerList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {p.id === localPlayer.id && isEditingName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={18}
                              value={nameInputValue}
                              onChange={(e) => setNameInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                              }}
                              className="bg-slate-900 border border-amber-400 rounded px-2 py-0.5 text-xs text-amber-300 font-inter focus:outline-none w-28"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingName(false)}
                              className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>{p.name}</span>
                            {p.isHost && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-anton uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                <Crown className="w-2.5 h-2.5" /> Host
                              </span>
                            )}
                            {p.id === localPlayer.id && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-inter">(You)</span>
                                <button
                                  onClick={() => {
                                    setNameInputValue(p.name);
                                    setIsEditingName(true);
                                  }}
                                  className="text-[10px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer ml-1"
                                >
                                  Edit Name
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-inter">
                        {p.department ? p.department : p.isHost ? 'Room Leader' : 'Competitor'}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-poppins font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>
              ))}
            </div>

            {/* Waiting for competitor banner */}
            {isHost && playerList.length === 1 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-inter">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Waiting for a competitor to join with room code...</span>
                </span>
                <button
                  onClick={handleCopyLink}
                  className="text-amber-400 hover:text-amber-300 font-semibold font-poppins cursor-pointer"
                >
                  Share Link
                </button>
              </div>
            )}
          </div>

          {/* Launch Controls - Real Competitors Only */}
          {isHost ? (
            <Button
              onClick={handleHostStartGame}
              disabled={playerList.length < 2}
              variant="amber"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 gap-2 text-base shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{playerList.length < 2 ? 'Waiting for Rival to Join...' : 'Start 1v1 Race'}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-3 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-poppins animate-pulse">
              <span>Waiting for host to start match</span>
            </div>
          )}
        </main>

        {/* Lobby Exit Confirmation Modal */}
        {exitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-anton uppercase text-white tracking-wide mb-1.5">
                {isHost ? 'Close Battle Room?' : 'Leave Room?'}
              </h3>

              <p className="text-xs text-slate-400 font-inter mb-6 leading-relaxed">
                {isHost
                  ? 'As the room leader, closing this battle room will remove all waiting players.'
                  : 'Are you sure you want to exit this battle room?'}
              </p>

              <div className="flex items-center gap-3 justify-center">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setExitModalOpen(false)}
                  disabled={isConfirmingExit}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="default"
                  onClick={handleConfirmExit}
                  disabled={isConfirmingExit}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {isConfirmingExit ? 'Exiting...' : isHost ? 'Close Room' : 'Leave Room'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Room Closed by Host Modal */}
        {roomClosedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-anton uppercase text-white tracking-wide mb-1.5">
                Battle Room Closed
              </h3>
              <p className="text-xs text-slate-400 font-inter mb-6 leading-relaxed">
                The host has dissolved this battle room. You have been returned to the lobby.
              </p>
              <Button
                variant="amber"
                size="default"
                onClick={() => router.push('/multiplayer')}
                className="w-full"
              >
                Back to Multiplayer
              </Button>
            </div>
          </div>
        )}

        {/* Floating Notice Toast */}
        {opponentNotice && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl text-xs font-poppins shadow-xl backdrop-blur-md animate-bounce">
            {opponentNotice}
          </div>
        )}
      </div>
    );
  }

  // Active Race View (100dvh Fullscreen Responsive Tabletop)
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden fixed inset-0 flex flex-col justify-between bg-slate-950 text-slate-100 font-inter select-none touch-none">
      {/* Synchronized 3-2-1 Dramatic Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="text-7xl sm:text-9xl font-anton text-amber-400 tracking-wider animate-bounce">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
            <div className="text-sm font-poppins text-slate-400 mt-2 tracking-widest uppercase">
              {countdown === 0 ? 'Solve as fast as you can!' : 'starting...'}
            </div>
          </div>
        </div>
      )}

      {/* Realtime Race HUD Header Bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 text-slate-100 h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-3 z-30 shrink-0">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenExitModal}
            className="gap-1 px-2 h-7"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Forfeit</span>
          </Button>
        </div>

        {/* Live Race Head-to-Head Tracker */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs font-poppins">
          {/* Local Player Progress */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-amber-400">You:</span>
            <span className="font-mono text-slate-200 font-bold">{lockedCount}/{pieces.length}</span>
          </div>

          {/* Opponent Progress */}
          {opponentPlayer && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-indigo-400 truncate max-w-[80px] sm:max-w-[120px]">
                {opponentPlayer.name}:
              </span>
              <span className="font-mono text-slate-300 font-bold">
                {opponentPlayer.piecesLocked}/{pieces.length}
              </span>
            </div>
          )}

          {/* Live Stopwatch */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 rounded-lg text-amber-400 font-mono font-bold text-xs">
            <Timer className="w-3.5 h-3.5" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Tool Buttons */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowGhost(!showGhost)}
            className="gap-1 px-2 h-7"
            title="Toggle Ghost Guide"
          >
            {showGhost ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Guide</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRearrangeTray}
            className="gap-1 px-2 h-7"
            title="Sort Pieces into Clean Slots"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Arrange</span>
          </Button>
        </div>
      </header>

      {/* Main Tabletop Game Area */}
      <main
        ref={tableRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 relative w-full flex flex-col items-center justify-start p-2 sm:p-4 overflow-hidden touch-none"
        style={{
          backgroundColor: '#090d16',
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%),
            radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px',
        }}
      >
        {/* Solving Mat Frame */}
        <div className="relative mt-0.5 sm:mt-1 z-10 shrink-0">
          <PuzzleBoard
            config={config}
            pieces={pieces}
            showGhost={showGhost}
            isBlankBoard={false}
            ghostImageUrl={ghostImageUrl}
            hintedPiece={null}
            isComplete={isFinished}
            boardRef={boardRef}
          />
        </div>

        {/* Draggable Pieces Layer */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {pieces.map((piece) => (
            <PuzzlePiece
              key={piece.id}
              piece={piece}
              isDragging={dragState?.pieceId === piece.id}
              isHinted={false}
              filterEdgesOnly={false}
              onPointerDown={handlePointerDown}
            />
          ))}
        </div>

        {/* Compact Reference Pill */}
        <CornerReference
          ghostImageUrl={ghostImageUrl}
          title={puzzleTheme.title}
          isLevel5Plus={false}
          isComplete={isFinished}
        />
      </main>

      {/* Race Results & Victory Celebration Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl bg-slate-900 border-2 shadow-2xl text-center ${
            isWinner ? 'border-amber-400' : 'border-rose-500/40'
          }`}>
            <div className={`w-16 h-16 rounded-2xl text-3xl flex items-center justify-center mx-auto mb-3 shadow-lg ${
              isWinner
                ? 'bg-amber-400 text-slate-950 font-anton shadow-amber-400/30'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-rose-500/10'
            }`}>
              {isWinner ? '🏆' : '💔'}
            </div>

            <h2 className={`text-2xl sm:text-3xl font-anton tracking-wider uppercase mb-1 ${
              isWinner ? 'text-white' : 'text-rose-400'
            }`}>
              {isWinner ? 'Victory! You Won!' : 'You Lost!'}
            </h2>

            <p className="text-xs text-slate-400 font-inter mb-4">
              {isWinner
                ? `You conquered the ${puzzleTheme.title} puzzle in ${formatTime(timeElapsed)}!`
                : `${roomState?.winnerName || 'Your opponent'} crossed the finish line first!`}
            </p>

            {/* Match Stats */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-poppins">Winner</div>
                <div className="text-sm font-bold text-amber-400 font-poppins truncate">
                  {roomState?.winnerName || 'Winner'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-poppins">Your Time</div>
                <div className="text-sm font-bold text-white font-mono">
                  {formatTime(timeElapsed)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 justify-center">
              <Button
                variant="amber"
                size="default"
                onClick={() => {
                  triggerHaptic('medium');
                  router.push('/multiplayer');
                }}
                className="gap-1.5 flex-1"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Play New Match</span>
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={() => router.push('/')}
                className="gap-1.5 flex-1"
              >
                <span>Main Menu</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit Match Confirmation Modal */}
      {exitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-anton uppercase text-white tracking-wide mb-1.5">
              Forfeit Match?
            </h3>

            <p className="text-xs text-slate-400 font-inter mb-6 leading-relaxed">
              Leaving during an active puzzle battle will count as an immediate forfeit and defeat.
            </p>

            <div className="flex items-center gap-3 justify-center">
              <Button
                variant="outline"
                size="default"
                onClick={() => setExitModalOpen(false)}
                disabled={isConfirmingExit}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={handleConfirmExit}
                disabled={isConfirmingExit}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isConfirmingExit ? 'Exiting...' : 'Forfeit & Leave'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Room Closed by Host Modal */}
      {roomClosedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-anton uppercase text-white tracking-wide mb-1.5">
              Battle Room Closed
            </h3>
            <p className="text-xs text-slate-400 font-inter mb-6 leading-relaxed">
              The host has dissolved this battle room. You have been returned to the lobby.
            </p>
            <Button
              variant="amber"
              size="default"
              onClick={() => router.push('/multiplayer')}
              className="w-full"
            >
              Back to Multiplayer
            </Button>
          </div>
        </div>
      )}

      {/* Floating Notice Toast */}
      {opponentNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl text-xs font-poppins shadow-xl backdrop-blur-md animate-bounce">
          {opponentNotice}
        </div>
      )}
    </div>
  );
}

export default function MultiplayerRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-950 text-amber-400 font-poppins">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-wider font-semibold">Connecting...</span>
          </div>
        </div>
      }
    >
      <MultiplayerRoomContent />
    </Suspense>
  );
}
