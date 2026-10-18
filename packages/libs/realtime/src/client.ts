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
export type RealtimeConnectionState =
  'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';
export type RealtimeSubscriptionState =
  'pending' | 'subscribing' | 'subscribed' | 'error' | 'closed';

export interface RealtimeWatchOptions<Payload> {
  onEvent?: RealtimeListener<Payload>;
  /** Called after this topic is acknowledged, including after reconnect. Refetch missed changes here. */
  onReady?: () => void;
  onError?: (error: RealtimeErrorEvent) => void;
  onStateChange?: (state: RealtimeSubscriptionState) => void;
}
export interface RealtimeSubscription {
  readonly state: RealtimeSubscriptionState;
  readonly error: RealtimeErrorEvent | undefined;
  retry(): void;
  close(): void;
}
export interface RealtimeClient {
  readonly connected: boolean;
  readonly active: boolean;
  readonly state: RealtimeConnectionState;
  readonly ready: boolean;
  watch<Payload>(
    topic: string,
    options?: RealtimeWatchOptions<Payload>,
  ): RealtimeSubscription;
  subscribe<Payload>(
    topic: string,
    listener: RealtimeListener<Payload>,
  ): () => void;
  onOpen(listener: () => void): () => void;
  onReady(listener: () => void): () => void;
  onStateChange(listener: (state: RealtimeConnectionState) => void): () => void;
  onError(listener: (event: RealtimeErrorEvent) => void): () => void;
  reconnect(): void;
  close(): void;
}
export interface RealtimeClientOptions {
  readonly pingInterval?: number;
  readonly pongTimeout?: number;
  readonly subscriptionTimeout?: number;
  readonly reconnectMaxInterval?: number;
  readonly resolveUrl: () => string | undefined;
}
interface Topic {
  readonly name: string;
  readonly watchers: Set<RealtimeWatchOptions<unknown>>;
  state: RealtimeSubscriptionState;
  error?: RealtimeErrorEvent;
  requestId?: string;
  subscriptionId?: string;
  timer?: ReturnType<typeof setTimeout>;
}

export function createRealtimeClient(
  options: RealtimeClientOptions,
): RealtimeClient {
  let socket: WebSocket | undefined;
  let state: RealtimeConnectionState = 'idle';
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let pingTimer: ReturnType<typeof setTimeout> | undefined;
  let pongTimer: ReturnType<typeof setTimeout> | undefined;
  let pingId: string | undefined;
  let reconnectCount = 0;
  let sequence = 0;
  let wasReady = false;
  let manuallyClosed = false;
  const topics = new Map<string, Topic>();
  const openListeners = new Set<() => void>();
  const readyListeners = new Set<() => void>();
  const stateListeners = new Set<(value: RealtimeConnectionState) => void>();
  const errorListeners = new Set<(value: RealtimeErrorEvent) => void>();

  const client: RealtimeClient = {
    get active() {
      return topics.size > 0;
    },
    get connected() {
      return socket?.readyState === 1;
    },
    get state() {
      return state;
    },
    get ready() {
      return (
        client.connected &&
        topics.size > 0 &&
        [...topics.values()].every((topic) => topic.state === 'subscribed')
      );
    },
    watch<Payload>(
      name: string,
      callbacks: RealtimeWatchOptions<Payload> = {},
    ): RealtimeSubscription {
      validateRealtimeTopic(name);
      let topic = topics.get(name);
      const fresh = !topic;
      if (!topic) {
        topic = { name, watchers: new Set(), state: 'pending' };
        topics.set(name, topic);
      }
      const entry = topic;
      // Each handle owns a distinct entry even when a caller reuses its options object.
      const watcher = { ...callbacks } as RealtimeWatchOptions<unknown>;
      entry.watchers.add(watcher);
      let closed = false;
      if (fresh && client.connected) subscribe(entry);
      else if (!socket && !reconnectTimer) connect();
      if (!fresh && entry.state === 'subscribed')
        queueMicrotask(() => {
          if (!closed && entry.state === 'subscribed') notify(watcher.onReady);
        });
      return {
        get state() {
          return closed ? 'closed' : entry.state;
        },
        get error() {
          return entry.error;
        },
        retry() {
          if (
            closed ||
            entry.state === 'subscribing' ||
            entry.state === 'subscribed'
          )
            return;
          if (client.connected) subscribe(entry);
          else client.reconnect();
        },
        close() {
          if (closed) return;
          closed = true;
          entry.watchers.delete(watcher);
          if (entry.watchers.size) return;
          clearTimeout(entry.timer);
          topics.delete(name);
          send({ type: 'unsubscribe', id: id(), topic: name });
          checkReady();
          if (!topics.size) client.close();
        },
      };
    },
    subscribe<Payload>(topic: string, listener: RealtimeListener<Payload>) {
      const subscription = client.watch(topic, { onEvent: listener });
      return () => subscription.close();
    },
    onOpen: (listener) => addListener(openListeners, listener),
    onReady: (listener) => addListener(readyListeners, listener),
    onStateChange: (listener) => addListener(stateListeners, listener),
    onError: (listener) => addListener(errorListeners, listener),
    reconnect() {
      if (!topics.size) return;
      manuallyClosed = false;
      reconnectCount = 0;
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      disposeSocket();
      connect();
    },
    close() {
      manuallyClosed = true;
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      disposeSocket();
      setState('closed');
    },
  };
  function id(): string {
    return `rt:${++sequence}`;
  }
  function setState(next: RealtimeConnectionState): void {
    if (state === next) return;
    state = next;
    for (const listener of [...stateListeners]) notify(() => listener(next));
  }
  function setTopic(
    topic: Topic,
    next: RealtimeSubscriptionState,
    error?: RealtimeErrorEvent,
  ): void {
    topic.state = next;
    topic.error = error;
    for (const watcher of [...topic.watchers])
      notify(() => watcher.onStateChange?.(next));
    checkReady();
  }
  function checkReady(): void {
    const ready = client.ready;
    if (ready && !wasReady) {
      wasReady = true;
      reconnectCount = 0;
      for (const listener of [...readyListeners]) notify(listener);
    } else wasReady = ready;
  }
  function resetTopics(): void {
    for (const topic of topics.values()) {
      clearTimeout(topic.timer);
      topic.timer = undefined;
      topic.requestId = undefined;
      topic.subscriptionId = undefined;
      setTopic(topic, 'pending');
    }
  }
  function disposeSocket(): void {
    const previous = socket;
    socket = undefined;
    clearTimeout(pingTimer);
    clearTimeout(pongTimer);
    pingId = undefined;
    resetTopics();
    try {
      previous?.close();
    } catch {
      /* Already failed. */
    }
  }
  function connect(): void {
    if (typeof WebSocket === 'undefined' || !topics.size) return;
    if (socket && socket.readyState < 2) return;
    manuallyClosed = false;
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    setState('connecting');
    let next: WebSocket;
    try {
      const url = options.resolveUrl();
      if (!url) {
        scheduleReconnect();
        return;
      }
      next = new WebSocket(toWebSocketUrl(url));
    } catch (error) {
      report({
        type: 'error',
        code: 'CONNECTION_FAILED',
        message: String(error),
      });
      scheduleReconnect();
      return;
    }
    socket = next;
    next.onopen = () => {
      if (socket !== next) return;
      setState('open');
      for (const topic of topics.values()) subscribe(topic);
      startPing();
      for (const listener of [...openListeners]) notify(listener);
    };
    next.onmessage = (event: MessageEvent<unknown>) => {
      if (socket !== next || typeof event.data !== 'string') return;
      let message: RealtimeServerMessage;
      try {
        message = parseRealtimeServerMessage(event.data);
      } catch {
        report({
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Invalid realtime server message.',
        });
        return;
      }
      if (message.type === 'pong') {
        if (message.id !== pingId) return;
        clearTimeout(pongTimer);
        pingId = undefined;
        startPing();
        return;
      }
      if (message.type === 'event') {
        const topic = topics.get(message.topic);
        if (topic?.state !== 'subscribed') return;
        for (const watcher of [...topic.watchers])
          notify(() => watcher.onEvent?.(message));
        return;
      }
      const topic = [...topics.values()].find(
        (entry) => message.id !== undefined && entry.requestId === message.id,
      );
      if (message.type === 'subscribed') {
        if (
          !topic ||
          topic.name !== message.topic ||
          topic.state !== 'subscribing'
        )
          return;
        clearTimeout(topic.timer);
        topic.subscriptionId = message.subscriptionId;
        setTopic(topic, 'subscribed');
        for (const watcher of [...topic.watchers]) notify(watcher.onReady);
      } else if (message.type === 'unsubscribed') {
        if (!topic || topic.subscriptionId !== message.subscriptionId) return;
        failTopic(topic, {
          type: 'error',
          id: message.id,
          code: 'TOPIC_CLOSED',
          message: 'Realtime topic was closed.',
        });
      } else if (message.type === 'error') {
        if (topic) failTopic(topic, message);
        else if (!message.id) report(message);
      }
    };
    next.onerror = () => {
      /* Browsers expose the failure through close. */
    };
    next.onclose = () => {
      if (socket !== next) return;
      disposeSocket();
      if (!manuallyClosed && topics.size) scheduleReconnect();
    };
  }
  function send(message: RealtimeClientMessage): boolean {
    if (!client.connected) return false;
    try {
      socket?.send(encodeRealtimeClientMessage(message));
      return true;
    } catch {
      disposeSocket();
      if (!manuallyClosed && topics.size) scheduleReconnect();
      return false;
    }
  }
  function subscribe(topic: Topic): void {
    clearTimeout(topic.timer);
    topic.requestId = id();
    topic.subscriptionId = undefined;
    setTopic(topic, 'subscribing');
    if (!send({ type: 'subscribe', id: topic.requestId, topic: topic.name }))
      return;
    topic.timer = setTimeout(() => {
      if (topic.state !== 'subscribing') return;
      // Cancel server work before allowing another attempt with a new correlation id.
      send({ type: 'unsubscribe', id: id(), topic: topic.name });
      failTopic(topic, {
        type: 'error',
        id: topic.requestId,
        code: 'SUBSCRIPTION_TIMEOUT',
        message: 'Realtime subscription acknowledgement timed out.',
      });
    }, options.subscriptionTimeout ?? 10_000);
  }
  function failTopic(topic: Topic, error: RealtimeErrorEvent): void {
    clearTimeout(topic.timer);
    setTopic(topic, 'error', error);
    for (const watcher of [...topic.watchers])
      notify(() => watcher.onError?.(error));
    report(error);
  }
  function report(error: RealtimeErrorEvent): void {
    for (const listener of [...errorListeners]) notify(() => listener(error));
  }
  function scheduleReconnect(): void {
    if (manuallyClosed || !topics.size) return;
    clearTimeout(reconnectTimer);
    setState('reconnecting');
    const maximum = Math.max(1, options.reconnectMaxInterval ?? 30_000);
    const ceiling = Math.min(
      maximum,
      1_000 * 2 ** Math.min(reconnectCount++, 5),
    );
    reconnectTimer = setTimeout(
      connect,
      Math.max(1, Math.floor(ceiling * (0.5 + Math.random() * 0.5))),
    );
  }
  function startPing(): void {
    clearTimeout(pingTimer);
    if (options.pingInterval === 0) return;
    pingTimer = setTimeout(() => {
      // Native server ping/pong keeps background tabs alive; browser timers are only an extra check while visible.
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        startPing();
        return;
      }
      pingId = id();
      if (!send({ type: 'ping', id: pingId })) return;
      pongTimer = setTimeout(() => {
        if (
          typeof document !== 'undefined' &&
          document.visibilityState === 'hidden'
        ) {
          pingId = undefined;
          startPing();
          return;
        }
        disposeSocket();
        scheduleReconnect();
      }, options.pongTimeout ?? 10_000);
    }, options.pingInterval ?? 30_000);
  }
  return client;
}
function addListener<T>(listeners: Set<T>, listener: T): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function notify(listener?: () => void): void {
  try {
    listener?.();
  } catch (error) {
    console.error('Realtime listener failed.', error);
  }
}
function toWebSocketUrl(value: string): string {
  const base = typeof window === 'undefined' ? undefined : window.location.href;
  const url = new URL(value, base);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:')
    throw new Error('Unsupported realtime URL protocol.');
  return url.toString();
}
