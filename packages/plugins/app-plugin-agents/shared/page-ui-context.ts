import { z } from 'zod';
import type { AppUIJson } from './ui-message.js';

/** Browser UI data, never a server resource reference or an authorization grant. */
export type PageUIItem = { kind: string; id: string } & Record<
  string,
  AppUIJson
>;
export interface PageUIContext {
  version: 1;
  items: PageUIItem[];
}

/** Rejection budgets, shared by browser snapshotting, HTTP admission and public history. */
export const PAGE_UI_CONTEXT_LIMITS: Readonly<{
  items: number;
  depth: number;
  bytes: number;
  kind: number;
  id: number;
  string: number;
  key: number;
  nodes: number;
}> = {
  items: 10,
  depth: 12,
  bytes: 64 * 1024,
  kind: 64,
  id: 200,
  string: 16 * 1024,
  key: 200,
  nodes: 4096,
} as const;

const dangerousKeys = new Set(['__proto__', 'prototype', 'constructor']);

/** Validate before serialization (no getters/toJSON), reject ambiguity, and detach the accepted snapshot. */
export function clonePageUIContext(value: unknown): PageUIContext {
  const ancestors = new Set<object>();
  let nodes = 0;
  let bytes = 0;
  const encoder = new TextEncoder();
  function charge(text: string): void {
    bytes += encoder.encode(text).byteLength;
    if (bytes > PAGE_UI_CONTEXT_LIMITS.bytes)
      throw new Error(
        `UI context exceeds ${PAGE_UI_CONTEXT_LIMITS.bytes} bytes.`,
      );
  }
  function visit(input: unknown, depth: number): AppUIJson {
    nodes += 1;
    if (nodes > PAGE_UI_CONTEXT_LIMITS.nodes)
      throw new Error(
        `UI context exceeds ${PAGE_UI_CONTEXT_LIMITS.nodes} JSON values.`,
      );
    if (depth > PAGE_UI_CONTEXT_LIMITS.depth)
      throw new Error(
        `UI context exceeds depth ${PAGE_UI_CONTEXT_LIMITS.depth}.`,
      );
    if (input === null || typeof input === 'boolean') {
      charge(String(input));
      return input;
    }
    if (typeof input === 'string') {
      if (input.length > PAGE_UI_CONTEXT_LIMITS.string)
        throw new Error('UI context string is too long.');
      charge(JSON.stringify(input));
      return input;
    }
    if (typeof input === 'number' && Number.isFinite(input)) {
      charge(JSON.stringify(input));
      return input;
    }
    if (typeof input !== 'object' || input === null || ancestors.has(input))
      throw new Error(
        'UI context must contain only finite, acyclic JSON data.',
      );
    const array = Array.isArray(input);
    const prototype: unknown = Object.getPrototypeOf(input);
    if (
      array
        ? prototype !== Array.prototype
        : prototype !== Object.prototype && prototype !== null
    )
      throw new Error(
        'UI context must contain only plain JSON objects and arrays.',
      );
    ancestors.add(input);
    const keys = Reflect.ownKeys(input);
    if (array && keys.length !== input.length + 1)
      throw new Error(
        'UI context arrays must not contain holes or extra properties.',
      );
    const result: AppUIJson[] | Record<string, AppUIJson> = array ? [] : {};
    charge(array ? '[]' : '{}');
    let first = true;
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string' || dangerousKeys.has(key))
        throw new Error(
          'UI context contains a dangerous or non-JSON property key.',
        );
      if (key.length > PAGE_UI_CONTEXT_LIMITS.key)
        throw new Error('UI context property key is too long.');
      if (
        array &&
        (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= input.length)
      )
        throw new Error('UI context arrays must not contain extra properties.');
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor))
        throw new Error(
          'UI context must not contain accessors or hidden properties.',
        );
      charge((first ? '' : ',') + (array ? '' : JSON.stringify(key) + ':'));
      first = false;
      const child = visit(descriptor.value, depth + 1);
      if (Array.isArray(result)) result.push(child);
      else result[key] = child;
    }
    ancestors.delete(input);
    return result;
  }
  const cloned = visit(value, 0);
  if (
    !cloned ||
    Array.isArray(cloned) ||
    typeof cloned !== 'object' ||
    Object.keys(cloned).some((key) => key !== 'version' && key !== 'items') ||
    cloned.version !== 1 ||
    !Array.isArray(cloned.items)
  )
    throw new Error('UI context must be { version: 1, items: [...] }.');
  if (cloned.items.length > PAGE_UI_CONTEXT_LIMITS.items)
    throw new Error(
      `UI context allows at most ${PAGE_UI_CONTEXT_LIMITS.items} items.`,
    );
  const identities = new Set<string>();
  const items: PageUIItem[] = [];
  for (const item of cloned.items) {
    if (
      !item ||
      Array.isArray(item) ||
      typeof item !== 'object' ||
      typeof item.kind !== 'string' ||
      !item.kind.trim() ||
      item.kind.length > PAGE_UI_CONTEXT_LIMITS.kind ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      item.id.length > PAGE_UI_CONTEXT_LIMITS.id
    )
      throw new Error(
        'UI items require nonempty kind and id within their length budgets.',
      );
    const identity = JSON.stringify([item.kind, item.id]);
    if (identities.has(identity))
      throw new Error('Duplicate UI context item identity.');
    identities.add(identity);
    items.push({ ...item, kind: item.kind, id: item.id });
  }
  return { version: 1, items };
}

export const pageUIContextSchema: z.ZodType<PageUIContext> = z
  .unknown()
  .transform((value, ctx) => {
    try {
      return clonePageUIContext(value);
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Invalid UI context.',
      });
      return z.NEVER;
    }
  });
