import { z } from 'zod';
import type { JsonObject } from '../../shared/indexing.js';
import {
  KnowledgeIndexingValidationError,
  type KnowledgeIndexingExtension,
  type KnowledgeIndexingRegistry,
} from './types.js';

export interface IndexingInstance {
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly config: JsonObject;
  readonly extension: KnowledgeIndexingExtension;
}
export function parseIndexingInstances(
  value: unknown,
  registry: KnowledgeIndexingRegistry,
): ReadonlyMap<string, IndexingInstance> {
  const parsed = z.record(z.string(), z.json()).safeParse(value);
  const invalid = (field: string, message: string): never => {
    throw new KnowledgeIndexingValidationError([{ field, message }]);
  };
  if (!parsed.success)
    return invalid('indexing', 'Expected an indexing instance directory.');
  const instances = new Map<string, IndexingInstance>();
  if (Object.keys(parsed.data).length > 100)
    invalid('indexing', 'Too many indexing instances.');
  for (const [key, raw] of Object.entries(parsed.data)) {
    if (
      !/^[a-z][a-z0-9_-]{0,63}$/.test(key) ||
      ['constructor', 'prototype', '__proto__'].includes(key)
    )
      invalid('indexing', 'Invalid indexing instance key.');
    const common = z
      .object({
        name: z.string().trim().min(1).max(100),
        type: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
      })
      .catchall(z.json())
      .safeParse(raw);
    if (!common.success)
      return invalid('indexing.' + key, 'Invalid indexing instance.');
    const { name, type, ...options } = common.data;
    const extension = registry.get(type);
    if (!extension)
      return invalid('indexing.' + key + '.type', 'Unknown indexing type.');
    try {
      instances.set(key, {
        key,
        name,
        type,
        config: extension.parseConfig(options),
        extension,
      });
    } catch (error) {
      if (!(error instanceof KnowledgeIndexingValidationError)) throw error;
      throw new KnowledgeIndexingValidationError(
        error.issues.map((issue) => ({
          field: 'indexing.' + key + (issue.field ? '.' + issue.field : ''),
          message: issue.message,
        })),
      );
    }
  }
  return instances;
}
