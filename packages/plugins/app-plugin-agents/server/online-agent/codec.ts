import { invalid } from '../kernel/errors.js';

export type OnlineAgentJson =
  | null
  | boolean
  | number
  | string
  | OnlineAgentJson[]
  | { [key: string]: OnlineAgentJson };

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

export type OnlineAgentOutcome = 'completed' | 'cancelled' | 'failed';
