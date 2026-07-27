export type RealtimeEventType =
  | 'PRODUCT_MUTATED'
  | 'USAGE_MUTATED'
  | 'PAYMENT_MUTATED'
  | 'PRESET_MUTATED';

export interface RealtimePayload {
  type: RealtimeEventType;
  action?: 'create' | 'update' | 'delete' | 'refresh';
  data?: any;
  timestamp: number;
}

const CHANNEL_NAME = 'productpen_realtime_channel';
const CUSTOM_EVENT_NAME = 'productpen_realtime_event';

// Singleton BroadcastChannel instance in browser environment
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported or failed to initialize:', e);
  }
}

/**
 * Dispatch a real-time event across the current window and all open browser tabs/windows.
 */
export function broadcastRealtimeEvent(
  type: RealtimeEventType,
  action: 'create' | 'update' | 'delete' | 'refresh' = 'refresh',
  data?: any
) {
  if (typeof window === 'undefined') return;

  const payload: RealtimePayload = {
    type,
    action,
    data,
    timestamp: Date.now(),
  };

  // 1. Dispatch custom DOM event for current page components
  window.dispatchEvent(
    new CustomEvent(CUSTOM_EVENT_NAME, { detail: payload })
  );

  // 2. Broadcast event to other browser tabs via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {
      console.warn('Error posting broadcast message:', e);
    }
  }
}

/**
 * Subscribe to real-time events across components and browser tabs.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToRealtimeEvents(
  callback: (payload: RealtimePayload) => void,
  targetTypes?: RealtimeEventType[]
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (payload: RealtimePayload) => {
    if (!targetTypes || targetTypes.includes(payload.type)) {
      callback(payload);
    }
  };

  // Handler for custom DOM event (same tab)
  const domListener = (event: Event) => {
    const customEvt = event as CustomEvent<RealtimePayload>;
    if (customEvt.detail) {
      handleMessage(customEvt.detail);
    }
  };

  // Handler for BroadcastChannel event (other tabs)
  const broadcastListener = (event: MessageEvent<RealtimePayload>) => {
    if (event.data) {
      handleMessage(event.data);
    }
  };

  window.addEventListener(CUSTOM_EVENT_NAME, domListener);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', broadcastListener);
  }

  return () => {
    window.removeEventListener(CUSTOM_EVENT_NAME, domListener);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', broadcastListener);
    }
  };
}
