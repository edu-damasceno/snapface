import { useCallback, useRef } from 'react';

interface WakeLockSentinel {
  release(): Promise<void>;
}

interface WakeLockManager {
  acquireWakeLock: () => Promise<void>;
  releaseWakeLock: () => Promise<void>;
  isSupported: boolean;
}

export const useWakeLock = (): WakeLockManager => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isSupported = 'wakeLock' in navigator;

  const acquireWakeLock = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    if (wakeLockRef.current) return;

    try {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = wakeLock;

      wakeLock.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Non-blocking — wake lock is optional
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (!wakeLockRef.current) return;

    try {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  return { acquireWakeLock, releaseWakeLock, isSupported };
};
