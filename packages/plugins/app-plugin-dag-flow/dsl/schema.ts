import type { TSchema } from '@sinclair/typebox';

import type { NodeResultSchema } from '../server/instructions/types.js';

/** TypeBox adds symbol metadata; workflow definitions contain plain JSON only. */
export function toJsonSchema<T>(schema: T): T {
  const ancestors = new Set<object>();
  const visit = (value: unknown): unknown => {
    if (value !== null && typeof value === 'object') {
      if (ancestors.has(value))
        throw new TypeError('Workflow schema contains a circular reference');
      ancestors.add(value);
      try {
        if (Array.isArray(value)) return value.map(visit);
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, visit(item)]),
        );
      } finally {
        ancestors.delete(value);
      }
    }
    return value;
  };
  return visit(schema) as T;
}

export function nodeResultJsonSchema(
  schema: TSchema | NodeResultSchema,
): NodeResultSchema {
  return toJsonSchema(schema) as NodeResultSchema;
}
