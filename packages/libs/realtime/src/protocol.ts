export const REALTIME_MAX_MESSAGE_BYTES: number = 64 * 1024;

export type RealtimeMessageData = string | ArrayBuffer;

export type RealtimeClientMessage =
  | {
      readonly type: 'subscribe';
      readonly id?: string;
      readonly topic: string;
    }
  | {
      readonly type: 'unsubscribe';
      readonly id?: string;
      readonly subscriptionId?: string;
      readonly topic?: string;
    }
  | {
      readonly type: 'publish';
      readonly id?: string;
      readonly topic: string;
      readonly payload: unknown;
    }
  | {
      readonly type: 'ping';
      readonly id?: string;
    };

export type RealtimeServerMessage =
  | { readonly type: 'resync' }
  | {
      readonly type: 'subscribed';
      readonly id?: string;
      readonly topic: string;
      readonly subscriptionId: string;
    }
  | {
      readonly type: 'unsubscribed';
      readonly id?: string;
      readonly subscriptionId?: string;
      readonly topic?: string;
    }
  | {
      readonly type: 'event';
      readonly eventId?: string;
      readonly topic: string;
      readonly payload: unknown;
      readonly publishedAt: string;
    }
  | {
      readonly type: 'error';
      readonly id?: string;
      readonly code: string;
      readonly message: string;
    }
  | {
      readonly type: 'pong';
      readonly id?: string;
    };

export class RealtimeProtocolError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RealtimeProtocolError';
  }
}

export function parseRealtimeClientMessage(
  data: RealtimeMessageData,
): RealtimeClientMessage {
  const value = parseWireMessage(data);
  switch (value.type) {
    case 'subscribe':
      return {
        type: 'subscribe',
        id: optionalString(value.id),
        topic: requiredTopic(value.topic),
      };
    case 'unsubscribe': {
      const subscriptionId = optionalString(value.subscriptionId);
      const topic =
        value.topic === undefined ? undefined : requiredTopic(value.topic);
      if (!subscriptionId && !topic) {
        throw new RealtimeProtocolError(
          'INVALID_UNSUBSCRIBE',
          'Unsubscribe requires a subscriptionId or topic.',
        );
      }
      return {
        type: 'unsubscribe',
        id: optionalString(value.id),
        subscriptionId,
        topic,
      };
    }
    case 'publish':
      return {
        type: 'publish',
        id: optionalString(value.id),
        topic: requiredTopic(value.topic),
        payload: value.payload,
      };
    case 'ping':
      return { type: 'ping', id: optionalString(value.id) };
    default:
      throw unknownMessageType(value.type);
  }
}

export function parseRealtimeServerMessage(
  data: RealtimeMessageData,
): RealtimeServerMessage {
  const value = parseWireMessage(data);
  switch (value.type) {
    case 'resync':
      return { type: 'resync' };
    case 'subscribed':
      return {
        type: 'subscribed',
        id: optionalString(value.id),
        topic: requiredTopic(value.topic),
        subscriptionId: requiredString(
          value.subscriptionId,
          'Realtime subscription id is required.',
        ),
      };
    case 'unsubscribed': {
      const subscriptionId = optionalString(value.subscriptionId);
      const topic =
        value.topic === undefined ? undefined : requiredTopic(value.topic);
      if (!subscriptionId && !topic) {
        throw new RealtimeProtocolError(
          'INVALID_UNSUBSCRIBE',
          'Unsubscribed message requires a subscriptionId or topic.',
        );
      }
      return {
        type: 'unsubscribed',
        id: optionalString(value.id),
        subscriptionId,
        topic,
      };
    }
    case 'event':
      return {
        type: 'event',
        eventId: optionalString(value.eventId),
        topic: requiredTopic(value.topic),
        payload: value.payload,
        publishedAt: requiredString(
          value.publishedAt,
          'Realtime event publishedAt is required.',
        ),
      };
    case 'error':
      return {
        type: 'error',
        id: optionalString(value.id),
        code: requiredString(value.code, 'Realtime error code is required.'),
        message: requiredString(
          value.message,
          'Realtime error message is required.',
        ),
      };
    case 'pong':
      return { type: 'pong', id: optionalString(value.id) };
    default:
      throw unknownMessageType(value.type);
  }
}

export function encodeRealtimeClientMessage(
  message: RealtimeClientMessage,
): string {
  return JSON.stringify(message);
}

export function encodeRealtimeServerMessage(
  message: RealtimeServerMessage,
): string {
  return JSON.stringify(message);
}

export function validateRealtimeTopic(topic: string): void {
  if (!/^[a-z][a-z0-9:-]{0,127}$/.test(topic)) {
    throw new RealtimeProtocolError(
      'INVALID_TOPIC',
      'Realtime topic is invalid.',
    );
  }
}

function parseWireMessage(data: RealtimeMessageData): Record<string, unknown> {
  const text = decodeRealtimeMessageData(data);
  if (new TextEncoder().encode(text).byteLength > REALTIME_MAX_MESSAGE_BYTES) {
    throw new RealtimeProtocolError(
      'MESSAGE_TOO_LARGE',
      'Realtime message is too large.',
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new RealtimeProtocolError(
      'INVALID_JSON',
      'Realtime message must be valid JSON.',
    );
  }
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new RealtimeProtocolError(
      'INVALID_MESSAGE',
      'Realtime message type is required.',
    );
  }
  return value;
}

function decodeRealtimeMessageData(data: RealtimeMessageData): string {
  return typeof data === 'string' ? data : new TextDecoder().decode(data);
}

function requiredTopic(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RealtimeProtocolError(
      'INVALID_TOPIC',
      'Realtime topic is required.',
    );
  }
  validateRealtimeTopic(value);
  return value;
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value) {
    throw new RealtimeProtocolError('INVALID_MESSAGE', message);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function unknownMessageType(type: unknown): RealtimeProtocolError {
  return new RealtimeProtocolError(
    'UNKNOWN_MESSAGE_TYPE',
    `Unknown realtime message type "${String(type)}".`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
