'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { PassizySDK, StudentProfile, LaunchContext } from '@/types/passizy';

function isParamConsumed(param: string | null): boolean {
  if (!param || typeof window === 'undefined') return false;
  try {
    return window.sessionStorage?.getItem(`consumed_param_${param}`) === 'true';
  } catch {
    return false;
  }
}

export function usePassizy() {
  const [session, setSession] = useState<LaunchContext | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [startParam, setStartParam] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p =
        new URLSearchParams(window.location.search).get('startapp') ||
        new URLSearchParams(window.location.search).get('start_param') ||
        null;
      if (p && !isParamConsumed(p)) {
        return p;
      }
    }
    return null;
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    isMounted.current = true;

    async function initSDK() {
      // Helper to retrieve window.Passizy with slight polling for script load
      const getSDK = (): PassizySDK | undefined => {
        if (typeof window !== 'undefined' && window.Passizy) {
          return window.Passizy;
        }
        return undefined;
      };

      let sdk = getSDK();
      if (!sdk && typeof window !== 'undefined') {
        // Allow up to 1.5 seconds for CDN script to mount
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (!isMounted.current) return;
          sdk = getSDK();
          if (sdk) break;
        }
      }

      if (!sdk) {
        if (isMounted.current) {
          setStudent(null);
          setIsInitialized(true);
        }
        return;
      }

      try {
        const ctx = await sdk.init({
          onThemeChange: (theme) => {
            if (typeof document !== 'undefined') {
              document.documentElement.classList.toggle('dark', theme === 'dark');
            }
          },
          onPause: () => {
            console.log('[Passizy] App paused / backgrounded');
          },
          onResume: () => {
            console.log('[Passizy] App resumed / foregrounded');
          },
        });

        if (isMounted.current) {
          setSession(ctx);
          // Extract startParam from session context or URL query
          const initialParam =
            ctx.startParam ||
            (typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('startapp') ||
                new URLSearchParams(window.location.search).get('start_param')
              : null);
          if (initialParam && !isParamConsumed(initialParam)) {
            setStartParam(initialParam);
          }

          // Subscribe to live in-app deep links without iframe reload
          if (typeof sdk.onDeepLink === 'function') {
            unsubDeepLink = sdk.onDeepLink((param) => {
              if (isMounted.current && param) {
                setStartParam(param);
              }
            });
          }

          // Only provide student profile if running embedded in real Passizy app (zero mock data)
          const isRealEmbedded = typeof sdk.isEmbedded === 'function' ? sdk.isEmbedded() : false;
          setStudent(isRealEmbedded ? ctx.student : null);
          setIsInitialized(true);
        }
      } catch (err) {
        if (isMounted.current) {
          setStudent(null);
          setIsInitialized(true);
        }
      }
    }

    let unsubDeepLink: (() => void) | undefined;
    initSDK();

    return () => {
      isMounted.current = false;
      if (unsubDeepLink) unsubDeepLink();
    };
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (typeof window !== 'undefined' && window.Passizy?.haptics) {
        window.Passizy.haptics.impact(type);
      }
    } catch {
      // Haptics not supported or outside iframe
    }
  }, []);

  const setHeaderTitle = useCallback((title: string) => {
    try {
      if (typeof window !== 'undefined' && window.Passizy?.navigation) {
        window.Passizy.navigation.setTitle(title);
      }
    } catch {
      // Silently ignore if outside Passizy container
    }
  }, []);

  const consumeStartParam = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        if (startParam) {
          window.sessionStorage?.setItem(`consumed_param_${startParam}`, 'true');
        }
        const url = new URL(window.location.href);
        const p1 = url.searchParams.get('startapp');
        const p2 = url.searchParams.get('start_param');
        if (p1) window.sessionStorage?.setItem(`consumed_param_${p1}`, 'true');
        if (p2) window.sessionStorage?.setItem(`consumed_param_${p2}`, 'true');
        if (url.searchParams.has('startapp') || url.searchParams.has('start_param')) {
          url.searchParams.delete('startapp');
          url.searchParams.delete('start_param');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
        }
      } catch {}
    }
    setStartParam(null);
  }, [startParam]);

  const hideBackButton = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.Passizy?.navigation?.backButton) {
        window.Passizy.navigation.backButton.hide();
      }
    } catch {
      // Silently ignore
    }
  }, []);

  const setupBackButton = useCallback((onBack: () => void) => {
    let unsub: (() => void) | undefined;
    try {
      if (typeof window !== 'undefined' && window.Passizy?.navigation?.backButton) {
        window.Passizy.navigation.backButton.show();
        unsub = window.Passizy.navigation.backButton.onClick(onBack);
      }
    } catch {
      // Silently ignore
    }

    return () => {
      try {
        if (unsub) unsub();
        if (typeof window !== 'undefined' && window.Passizy?.navigation?.backButton) {
          window.Passizy.navigation.backButton.hide();
        }
      } catch {
        // Silently ignore
      }
    };
  }, []);

  const getShareUrl = useCallback(
    (options?: { startParam?: string; appId?: string }) => {
      if (typeof window !== 'undefined' && window.Passizy?.getShareUrl) {
        return window.Passizy.getShareUrl(options);
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://passizy.com';
      const resolvedAppId =
        options?.appId ||
        session?.appId ||
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('app_id') ||
            new URLSearchParams(window.location.search).get('appId')
          : null);
      const basePath = resolvedAppId ? `${origin}/me/games/${resolvedAppId}` : origin;
      const param = options?.startParam || startParam;
      return param ? `${basePath}?startapp=${encodeURIComponent(param)}` : basePath;
    },
    [session, startParam]
  );

  const share = useCallback(
    async (options?: { startParam?: string; appId?: string; title?: string; text?: string; url?: string }) => {
      if (typeof window !== 'undefined' && window.Passizy?.share) {
        return window.Passizy.share(options);
      }
      // Fallback
      const shareUrl = options?.url || getShareUrl(options);
      const title = options?.title || (typeof document !== 'undefined' ? document.title : 'Passizy');
      const text = options?.text || 'Play on Passizy';
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title,
            text,
            url: shareUrl,
          });
          return true;
        } catch (e: any) {
          if (e?.name === 'AbortError') return false;
        }
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      return false;
    },
    [getShareUrl]
  );

  const goBack = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.Passizy?.navigation?.back) {
        window.Passizy.navigation.back();
      } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
        window.history.back();
      }
    } catch {
      // Silently ignore
    }
  }, []);

  const exit = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.Passizy?.navigation) {
        if (typeof window.Passizy.navigation.exit === 'function') {
          window.Passizy.navigation.exit();
        } else {
          window.Passizy.navigation.close();
        }
      } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            protocol: 'PASSIZY_MINI_APP_V1',
            type: 'NAV_CLOSE',
            requestId: `exit_${Date.now()}`,
          },
          '*'
        );
      }
    } catch {
      // Silently ignore
    }
  }, []);

  return {
    session,
    student,
    startParam,
    consumeStartParam,
    isInitialized,
    triggerHaptic,
    setHeaderTitle,
    setupBackButton,
    hideBackButton,
    goBack,
    back: goBack,
    exit,
    getShareUrl,
    share,
  };
}
