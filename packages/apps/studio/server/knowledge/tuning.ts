/**
 * Studio's knowledge search settings as the knowledge plugin reads them (`Knowledge.bindSettings`): the default chunking,
 * and recall with the keyword weight split between the plugin's word match (`contains`) and Studio's vector provider
 * (`vector`): `2 × keywordWeight` and `2 × (1 − keywordWeight)`, so 0.5 weighs both 1, plain Reciprocal Rank Fusion.
 * Whoever manages the search settings sees how hits are ranked in every space. A change of the default chunking cuts
 * the spaces that follow it again.
 */
import type {
  Knowledge,
  KnowledgeReader,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type { KnowledgeRecall } from '@nocobase/app-plugin-knowledge/shared/knowledge';

import type { KnowledgeRecallSettings } from '../../shared/knowledge.js';
import type { KnowledgeSearchSettingsStore } from './search-settings.js';

/** The plugin's recall from Studio's settings. */
export function recallOf(settings: KnowledgeRecallSettings): KnowledgeRecall {
  return {
    limit: settings.limit,
    minScore: settings.minScore,
    weights: {
      contains: 2 * settings.keywordWeight,
      vector: 2 * (1 - settings.keywordWeight),
    },
    rerankCandidates: settings.rerankCandidates,
  };
}

export function bindKnowledgeTuning(deps: {
  readonly knowledge: Knowledge;
  readonly settings: KnowledgeSearchSettingsStore;
  /** Whether the reader manages the knowledge search settings. */
  readonly managesSearch: (reader: KnowledgeReader) => Promise<boolean>;
  readonly onError: (message: string, error: unknown) => void;
}): () => void {
  const unbind = deps.knowledge.bindSettings({
    chunking: async () => (await deps.settings.get()).chunking,
    recall: async () => recallOf((await deps.settings.get()).recall),
    mayExplain: (reader) =>
      reader.actor ? Promise.resolve(false) : deps.managesSearch(reader),
  });
  const stop = deps.settings.onChange((next, previous) => {
    if (JSON.stringify(next.chunking) === JSON.stringify(previous.chunking))
      return;
    deps.knowledge.chunking
      .defaultChanged()
      .catch((error: unknown) =>
        deps.onError('Studio could not cut the knowledge spaces again.', error),
      );
  });
  return () => {
    stop();
    unbind();
  };
}
