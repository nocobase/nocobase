import { invalid } from '../../../kernel/errors.js';
import type { OnlineAgentJson } from '../types.js';

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

/** Validate without coercion, invoking accessors or toJSON, and detach every JSON node. */
export function strictJson(value: unknown): OnlineAgentJson {
  const ancestors = new Set<object>();
  const fail = (): never => {
    throw invalid('A strict JSON value is required.');
  };
  const visit = (item: unknown): OnlineAgentJson => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return item;
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (typeof item !== 'object' || ancestors.has(item)) return fail();
    const array = Array.isArray(item);
    const prototype: unknown = Object.getPrototypeOf(item);
    if (
      array
        ? prototype !== Array.prototype
        : prototype !== Object.prototype && prototype !== null
    )
      return fail();
    ancestors.add(item);
    try {
      const entries: [string, OnlineAgentJson][] = [];
      const keys = Reflect.ownKeys(item);
      const length = array
        ? (Object.getOwnPropertyDescriptor(item, 'length')!.value as number)
        : 0;
      for (const key of keys) {
        if (typeof key !== 'string') return fail();
        const descriptor = Object.getOwnPropertyDescriptor(item, key)!;
        if (!('value' in descriptor)) return fail();
        if (array && key === 'length') continue;
        if (!descriptor.enumerable) return fail();
        if (array) {
          const index = Number(key);
          if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= length ||
            String(index) !== key
          )
            return fail();
        }
        entries.push([key, visit(descriptor.value)]);
      }
      if (array) {
        // Array holes and extra properties must not silently become null or disappear.
        if (entries.length !== length) return fail();
        return entries.map(([, entry]) => entry);
      }
      // Define keys as data, including a possible own "__proto__" key.
      return Object.fromEntries(entries);
    } finally {
      ancestors.delete(item);
    }
  };
  return visit(value);
}
