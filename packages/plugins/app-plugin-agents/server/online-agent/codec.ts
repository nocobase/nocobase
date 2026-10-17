import type { ModelMessage } from 'ai';
import { invalid } from '../kernel/errors.js';

export type OnlineAgentJson =
  | null
  | boolean
  | number
  | string
  | OnlineAgentJson[]
  | { [key: string]: OnlineAgentJson };

/** Tagged nodes avoid confusing an ordinary tool object's keys with codec markers. */
type OnlineAgentCodecNode =
  | ['json', null | boolean | number | string]
  | ['array', OnlineAgentCodecNode[]]
  | ['object', [string, OnlineAgentCodecNode][]]
  | ['bytes', string]
  | ['arrayBuffer', string]
  | ['url', string];

export function encode(
  value: unknown,
  seen: Set<object> = new Set<object>(),
): OnlineAgentCodecNode {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return ['json', value];
  if (typeof value === 'number' && Number.isFinite(value))
    return ['json', value];
  if (value instanceof ArrayBuffer)
    return ['arrayBuffer', Buffer.from(value).toString('base64')];
  if (value instanceof Uint8Array)
    return ['bytes', Buffer.from(value).toString('base64')];
  if (value instanceof URL) return ['url', value.href];
  if (typeof value !== 'object' || seen.has(value))
    throw invalid('The value is not persistable.');
  seen.add(value);
  try {
    if (Array.isArray(value))
      return ['array', value.map((item) => encode(item, seen))];
    if (
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    )
      throw invalid('The value is not a plain object.');
    return [
      'object',
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, encode(item, seen)]),
    ];
  } finally {
    seen.delete(value);
  }
}

export function decode(node: OnlineAgentCodecNode): unknown {
  switch (node[0]) {
    case 'json':
      return node[1];
    case 'bytes':
      return new Uint8Array(Buffer.from(node[1], 'base64'));
    case 'arrayBuffer':
      return Uint8Array.from(Buffer.from(node[1], 'base64')).buffer;
    case 'url':
      return new URL(node[1]);
    case 'array':
      return node[1].map(decode);
    case 'object':
      return Object.fromEntries(
        node[1].map(([key, value]) => [key, decode(value)]),
      );
  }
}

export function jsonSafe(value: unknown): OnlineAgentJson {
  const visit = (
    item: unknown,
    seen: Set<object> = new Set<object>(),
  ): OnlineAgentJson => {
    if (item === null || typeof item === 'boolean' || typeof item === 'string')
      return item;
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (typeof item !== 'object' || seen.has(item))
      throw invalid('A JSON-safe value is required.');
    seen.add(item);
    try {
      if (Array.isArray(item)) return item.map((entry) => visit(entry, seen));
      if (
        Object.getPrototypeOf(item) !== Object.prototype &&
        Object.getPrototypeOf(item) !== null
      )
        throw invalid('A JSON-safe object is required.');
      return Object.fromEntries(
        Object.entries(item)
          .filter(([, entry]) => entry !== undefined)
          .map(([key, entry]) => [key, visit(entry, seen)]),
      );
    } finally {
      seen.delete(item);
    }
  };
  return visit(value);
}

export type {
  OnlineAgentOutcome,
  OnlineAgentPublicItem,
} from '../../shared/online-agent.js';
import type {
  OnlineAgentOutcome,
  OnlineAgentPublicItem,
} from '../../shared/online-agent.js';
export type OnlineAgentOriginal = {
  version: 1;
  message: OnlineAgentCodecNode | null;
  outcome: OnlineAgentOutcome;
  excludedFromHistory?: boolean;
};
/** Only user and assistant text is public; tool payloads and provider metadata stay internal. */
export function project(
  message: ModelMessage | null,
  partial = '',
): OnlineAgentPublicItem {
  const role =
    message?.role === 'user'
      ? 'user'
      : message?.role === 'assistant' || message === null
        ? 'assistant'
        : 'notice';
  const text = !message
    ? partial
    : message.role !== 'user' && message.role !== 'assistant'
      ? ''
      : typeof message.content === 'string'
        ? message.content
        : message.content
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('');
  return { role, parts: text ? [{ type: 'text', text }] : [] };
}

export function content(
  message: ModelMessage | null,
  outcome: OnlineAgentOutcome = 'completed',
  partial: string = '',
  excludedFromHistory = false,
): { type: string; content: string; original: OnlineAgentOriginal } {
  const view = project(message, partial);
  return {
    type: 'text',
    content: view.parts.map((part) => part.text).join(''),
    original: {
      version: 1,
      message: message ? encode(message) : null,
      outcome,
      ...(excludedFromHistory ? { excludedFromHistory: true } : {}),
    } satisfies OnlineAgentOriginal,
  };
}

export function restore(value: unknown, role: string): ModelMessage | null {
  const row = value as { content?: string; original?: OnlineAgentOriginal };
  if (row.original) {
    if (row.original.version !== 1)
      throw invalid('Unsupported message format.');
    return row.original.message && !row.original.excludedFromHistory
      ? (decode(row.original.message) as ModelMessage)
      : null;
  }
  // Historical system records are notices, never model instructions.
  return (role === 'user' || role === 'assistant') &&
    typeof row.content === 'string'
    ? { role, content: row.content }
    : null;
}
