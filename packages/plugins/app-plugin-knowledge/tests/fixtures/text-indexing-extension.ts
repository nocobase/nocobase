import { z } from 'zod';
import type {
  KnowledgeIndexingExtension,
  IndexingItem,
  IndexingTarget,
} from '../../server/indexing/index.js';
import { KnowledgeIndexingValidationError } from '../../server/indexing/index.js';
import type { JsonObject } from '../../shared/indexing.js';

function parseEmpty(value: JsonObject): JsonObject {
  const parsed = z.strictObject({}).safeParse(value);
  if (!parsed.success)
    throw new KnowledgeIndexingValidationError(
      parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: 'No options are supported by this text fixture.',
      })),
    );
  return parsed.data;
}

/** A test-only lexical extension: no model service or vector provider is involved. */
export const textIndexingExtension: KnowledgeIndexingExtension = {
  type: 'fixture-text',
  contractVersion: 1,
  channels: [{ name: 'terms', kind: 'lexical' }],
  parseConfig: parseEmpty,
  parseSettings: (value) => ({
    options: parseEmpty(value),
    input: { kind: 'text' },
  }),
  resourceIdentity: () => 'fixture-local-text',
  create() {
    const targets = new Map<
      string,
      Map<
        string,
        { revision: bigint; hash: string; items: readonly IndexingItem[] }
      >
    >();
    const closedTargets = new Set<string>();
    let closed = false;
    const key = (target: IndexingTarget) =>
      target.namespace + ':' + target.generationId;
    const check = (signal: AbortSignal) => {
      signal.throwIfAborted();
      if (closed) throw new Error('Fixture text storage is closed.');
    };
    return {
      async ensureTarget(target, signal) {
        check(signal);
        if (closedTargets.has(key(target)))
          throw new Error('Fixture text target was dropped.');
        if (!targets.has(key(target))) targets.set(key(target), new Map());
      },
      async replaceDocument(target, document, input, signal) {
        check(signal);
        const documents = targets.get(key(target));
        if (!documents) throw new Error('Fixture text target is missing.');
        const items: IndexingItem[] = [];
        for await (const item of input) {
          check(signal);
          if (item.vector)
            throw new Error('Text indexing must not receive vectors.');
          items.push(item);
        }
        const prior = documents.get(document.docId);
        const revision = BigInt(document.revision);
        if (prior && prior.revision > revision) return 'obsolete';
        if (prior && prior.revision === revision) {
          if (prior.hash !== document.snapshotHash)
            throw new Error('Fixture snapshot conflict.');
          return 'alreadyApplied';
        }
        documents.set(document.docId, {
          revision,
          hash: document.snapshotHash,
          items: document.deleted ? [] : items,
        });
        return 'applied';
      },
      async vectorsOf(_target, _docId, _chunks, signal) {
        check(signal);
        return new Map();
      },
      async search(target, request, signal) {
        check(signal);
        if (request.query.kind !== 'lexical' || request.channel !== 'terms')
          throw new Error('Invalid fixture text query.');
        const query = request.query.text
          .toLowerCase()
          .replaceAll('needle', 'canary');
        const scopes = new Map(
          request.scopes.map((scope) => [scope.spaceId, new Set(scope.gates)]),
        );
        return [...(targets.get(key(target))?.values() ?? [])]
          .flatMap((document) => document.items)
          .filter(
            (item) =>
              scopes.get(item.spaceId)?.has(item.gate) &&
              item.text.toLowerCase().includes(query),
          )
          .slice(0, request.limit)
          .map((item) => ({ chunkId: item.chunkId, score: 1 }));
      },
      async dropTarget(target, signal) {
        check(signal);
        closedTargets.add(key(target));
        targets.delete(key(target));
      },
      async close() {
        closed = true;
        targets.clear();
      },
    };
  },
};
