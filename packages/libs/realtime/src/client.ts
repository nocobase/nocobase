import {
  encodeRealtimeClientMessage,
  parseRealtimeServerMessage,
  validateRealtimeTopic,
  type RealtimeClientMessage,
  type RealtimeServerMessage,
} from './protocol.js';

export type RealtimeEvent<Payload = unknown> = Extract<
  RealtimeServerMessage,
  { readonly type: 'event' }
> & { readonly payload: Payload };

export type RealtimeErrorEvent = Extract<
  RealtimeServerMessage,
  { readonly type: 'error' }
>;

export type RealtimeListener<Payload> = (event: RealtimeEvent<Payload>) => void;

export interface RealtimeClient {
  readonly connected: boolean;
  /** Whether any topic is subscribed, without opening a connection. */
  readonly active: boolean;
  subscribe<Payload>(
    topic: string,
    listener: RealtimeListener<Payload>,
  ): () => void;
  onOpen(listener: () => void): () => void;
  onError(listener: (event: RealtimeErrorEvent) => void): () => void;
  reconnect(): void;
  close(): void;
}

export interface RealtimeClientOptions {
  readonly pingInterval?: number;
  readonly reconnectMaxInterval?: number;
  readonly resolveUrl: () => string | undefined;
}

type UntypedRealtimeListener = RealtimeListener<unknown>;

export function createRealtimeClient(
  options: RealtimeClientOptions,
): RealtimeClient {
  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let reconnectCount = 0;
  let manuallyClosed = false;
  const openListeners = new Set<() => void>();
  const errorListeners = new Set<(event: RealtimeErrorEvent) => void>();
  const topicListeners = new Map<string, Set<UntypedRealtimeListener>>();

  const client: RealtimeClient = {
    get active(): boolean {
      return topicListeners.size > 0;
    },

    get connected(): boolean {
      return socket?.readyState === WebSocket.OPEN;
    },

    subscribe<Payload>(
      topic: string,
      listener: RealtimeListener<Payload>,
    ): () => void {
      validateRealtimeTopic(topic);
      const listeners =
        topicListeners.get(topic) ?? new Set<UntypedRealtimeListener>();
      const wasEmpty = listeners.size === 0;
      listeners.add(listener as UntypedRealtimeListener);
      topicListeners.set(topic, listeners);

      if (wasEmpty && client.connected) {
        sendSubscription(topic);
      } else if (!socket) {
        connect();
      }

      return (): void => {
        listeners.delete(listener as UntypedRealtimeListener);
        if (listeners.size > 0) return;
        topicListeners.delete(topic);
        send({ type: 'unsubscribe', topic });
        if (topicListeners.size === 0) client.close();
      };
    },

    onOpen(listener: () => void): () => void {
      openListeners.add(listener);
      return (): void => {
        openListeners.delete(listener);
      };
    },

    onError(listener: (event: RealtimeErrorEvent) => void): () => void {
      errorListeners.add(listener);
      return (): void => {
        errorListeners.delete(listener);
      };
    },

    reconnect(): void {
      if (topicListeners.size === 0) return;
      manuallyClosed = false;
      reconnectCount = 0;
      stopPing();
      socket?.close();
      socket = undefined;
      connect();
    },

    close(): void {
      manuallyClosed = true;
      clearReconnectTimer();
      stopPing();
      socket?.close();
      socket = undefined;
    },
  };

  function connect(): void {
    if (typeof WebSocket === 'undefined') return;
    if (
      socket?.readyState === WebSocket.CONNECTING ||
      socket?.readyState === WebSocket.OPEN
    ) {
      return;
    }
    const resolvedUrl = options.resolveUrl();
    if (!resolvedUrl) return;
    const websocketUrl = toWebSocketUrl(resolvedUrl);
    if (!websocketUrl) return;

    manuallyClosed = false;
    clearReconnectTimer();
    const nextSocket = new WebSocket(websocketUrl);
    socket = nextSocket;

    nextSocket.onopen = (): void => {
      if (socket !== nextSocket) return;
      reconnectCount = 0;
      startPing();
      for (const topic of topicListeners.keys()) sendSubscription(topic);
      for (const listener of openListeners) {
        notifyListener(listener, 'Realtime open listener failed.');
      }
    };
    nextSocket.onmessage = (event: MessageEvent<unknown>): void => {
      if (socket !== nextSocket || typeof event.data !== 'string') return;
      let message: RealtimeServerMessage;
      try {
        message = parseRealtimeServerMessage(event.data);
      } catch (error) {
        console.warn('Unable to parse NocoBase realtime message.', error);
        return;
      }
      if (message.type === 'event') {
        for (const listener of topicListeners.get(message.topic) ?? []) {
          notifyListener(
            () => listener(message),
            `Realtime listener for topic "${message.topic}" failed.`,
          );
        }
      } else if (message.type === 'error') {
        for (const listener of errorListeners) {
          notifyListener(
            () => listener(message),
            'Realtime error listener failed.',
          );
        }
      }
    };
    nextSocket.onerror = (): void => {
      // The close event owns reconnection because browsers do not expose a
      // useful WebSocket error reason.
    };
    nextSocket.onclose = (): void => {
      if (socket !== nextSocket) return;
      socket = undefined;
      stopPing();
      if (!manuallyClosed && topicListeners.size > 0) scheduleReconnect();
    };
  }

  function send(message: RealtimeClientMessage): boolean {
    if (!client.connected) return false;
    socket?.send(encodeRealtimeClientMessage(message));
    return true;
  }

  function sendSubscription(topic: string): void {
    send({ type: 'subscribe', id: `subscribe:${topic}`, topic });
  }

  function scheduleReconnect(): void {
    clearReconnectTimer();
    const maxInterval = options.reconnectMaxInterval ?? 30_000;
    const delay = Math.min(
      maxInterval,
      1_000 * 2 ** Math.min(reconnectCount, 5),
    );
    reconnectCount += 1;
    reconnectTimer = setTimeout(connect, delay);
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }

  function startPing(): void {
    stopPing();
    pingTimer = setInterval(
      () => send({ type: 'ping' }),
      options.pingInterval ?? 300_000,
    );
  }

  function stopPing(): void {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = undefined;
  }

  return client;
}

function notifyListener(listener: () => void, message: string): void {
  try {
    listener();
  } catch (error) {
    console.error(message, error);
  }
}

function toWebSocketUrl(value: string): string | undefined {
  const absolute = /^[a-z][a-z\d+.-]*:/i.test(value);
  if (!absolute && typeof window === 'undefined') return undefined;
  const base = typeof window === 'undefined' ? undefined : window.location.href;
  const url = new URL(value, base);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return undefined;
  return url.toString();
}
