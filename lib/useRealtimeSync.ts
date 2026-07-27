'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  subscribeToRealtimeEvents,
  RealtimeEventType,
  RealtimePayload,
} from '@/lib/realtime';

interface UseRealtimeSyncOptions {
  events?: RealtimeEventType[];
  onEvent?: (payload: RealtimePayload) => void;
  enableFocusRefetch?: boolean;
  debounceMs?: number;
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const {
    events,
    onEvent,
    enableFocusRefetch = true,
    debounceMs = 300,
  } = options;

  const router = useRouter();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const triggerSync = (payload: RealtimePayload) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        // Trigger Next.js Server Component data revalidation
        router.refresh();

        // Trigger component level callback if provided
        if (onEventRef.current) {
          onEventRef.current(payload);
        }
      }, debounceMs);
    };

    // 1. Subscribe to BroadcastChannel & DOM real-time events
    const unsubscribe = subscribeToRealtimeEvents((payload) => {
      triggerSync(payload);
    }, events);

    // 2. Revalidate when browser tab regains focus
    const handleFocus = () => {
      if (enableFocusRefetch) {
        triggerSync({
          type: events && events[0] ? events[0] : 'PRODUCT_MUTATED',
          action: 'refresh',
          timestamp: Date.now(),
        });
      }
    };

    if (enableFocusRefetch && typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          handleFocus();
        }
      });
    }

    return () => {
      unsubscribe();
      if (enableFocusRefetch && typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [router, events, enableFocusRefetch, debounceMs]);
}
