import type { IndexingFormRegistry } from './types.js';

export function registerBuiltinIndexingForms(
  registry: IndexingFormRegistry,
): void {
  registry.register({
    type: 'sqlite-vec',
    requiresEmbedding: true,
    load: () => import('../extension/sqlite-vec/indexing-form.js'),
  });
  registry.register({
    type: 'pgvector',
    requiresEmbedding: true,
    load: () => import('../extension/pgvector/indexing-form.js'),
  });
}
