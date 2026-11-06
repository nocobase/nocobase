import { lazy } from 'react';
import type { IndexingFormDefinition, IndexingFormRegistry } from './types.js';

/** The Provider alone owns disposal; consumers cannot unload a sealed registry. */
export function createIndexingFormRegistryOwner(): {
  registry: IndexingFormRegistry;
  dispose: () => void;
} {
  const entries = new Map<string, IndexingFormDefinition>();
  let sealed = false;
  const writable = () => {
    if (sealed)
      throw new Error('The Knowledge indexing form registry is sealed.');
  };
  const registry: IndexingFormRegistry = {
    register(definition) {
      writable();
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(definition.type))
        throw new Error('Invalid Knowledge indexing form type.');
      if (entries.has(definition.type))
        throw new Error('Duplicate Knowledge indexing form type.');
      if (entries.size >= 100)
        throw new Error('Too many Knowledge indexing form types.');
      if (
        (definition.component === undefined) ===
          (definition.load === undefined) ||
        (definition.load !== undefined && typeof definition.load !== 'function')
      )
        throw new Error(
          'An indexing form must declare exactly one component or loader.',
        );
      // Allocate once per registration, not during React render. lazy does not call the loader yet.
      const snapshot = Object.freeze({
        type: definition.type,
        requiresEmbedding: definition.requiresEmbedding ?? false,
        component: definition.component ?? lazy(definition.load),
      });
      entries.set(snapshot.type, snapshot);
      return () => {
        writable();
        if (entries.get(snapshot.type) === snapshot)
          entries.delete(snapshot.type);
      };
    },
    get: (type) => entries.get(type),
    list: () => [...entries.values()],
    seal: () => {
      sealed = true;
    },
  };
  return {
    registry,
    dispose: () => {
      sealed = true;
      entries.clear();
    },
  };
}
export function createIndexingFormRegistry(): IndexingFormRegistry {
  return createIndexingFormRegistryOwner().registry;
}
