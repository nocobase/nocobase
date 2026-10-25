import {
  DEFAULT_SPACE,
  type SpaceRef,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';

/** Only this space is recognized; removing a catalog entry never deletes stored documents. */
export const KNOWLEDGE_SPACES = [
  {
    ...DEFAULT_SPACE,
    title: 'Default knowledge base',
    titleKey: 'knowledge.spaces.default',
  },
] as const;

export function knowledgeSpace(ref: SpaceRef) {
  return KNOWLEDGE_SPACES.find(
    (space) => space.scope === ref.scope && space.scopeId === ref.scopeId,
  );
}
