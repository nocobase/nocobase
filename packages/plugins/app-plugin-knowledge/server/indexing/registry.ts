import {
  KnowledgeIndexingValidationError,
  type KnowledgeIndexingExtension,
  type KnowledgeIndexingRegistry,
} from './types.js';

export function createKnowledgeIndexingRegistry(): KnowledgeIndexingRegistry {
  const entries = new Map<string, KnowledgeIndexingExtension>();
  let sealed = false;
  const invalid = (message: string): never => {
    throw new KnowledgeIndexingValidationError([{ field: 'type', message }]);
  };
  return {
    register(extension) {
      if (sealed) invalid('The indexing registry is sealed.');
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(extension.type))
        invalid('Invalid indexing type.');
      if (entries.has(extension.type)) invalid('Duplicate indexing type.');
      if (entries.size >= 100) invalid('Too many indexing types.');
      if (
        extension.contractVersion !== 1 ||
        extension.channels.length !== 1 ||
        !extension.channels.every(
          (channel) =>
            /^[a-z][a-z0-9-]{0,63}$/.test(channel.name) &&
            ['lexical', 'vector'].includes(channel.kind),
        )
      ) {
        invalid(
          'An extension must declare one valid channel and contract version 1.',
        );
      }
      entries.set(extension.type, extension);
      let released = false;
      return () => {
        if (sealed) invalid('The indexing registry is sealed.');
        if (released) return;
        released = true;
        if (entries.get(extension.type) === extension)
          entries.delete(extension.type);
      };
    },
    get: (type) => entries.get(type),
    list: () => [...entries.values()],
    seal: () => {
      sealed = true;
    },
  };
}
