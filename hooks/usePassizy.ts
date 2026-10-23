'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { PassizySDK, StudentProfile, LaunchContext } from '@/types/passizy';

export function usePassizy() {
  const [session, setSession] = useState<LaunchContext | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
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

    initSDK();

    return () => {
      isMounted.current = false;
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

  return {
    session,
    student,
    isInitialized,
    triggerHaptic,
    setHeaderTitle,
    setupBackButton,
  };
}
