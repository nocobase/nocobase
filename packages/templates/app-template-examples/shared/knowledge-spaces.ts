import {
  DEFAULT_SPACE,
  type SpaceRef,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';

/** Application-owned catalog, including empty spaces that have not been persisted yet. */
export const KNOWLEDGE_SPACES = [
  {
    ...DEFAULT_SPACE,
    title: 'Default knowledge base',
    titleKey: 'knowledge.spaces.default',
  },
  {
    scope: 'sales',
    scopeId: '',
    title: 'Sales knowledge base',
    titleKey: 'knowledge.spaces.sales',
  },
  {
    scope: 'engineering',
    scopeId: '',
    title: 'Engineering knowledge base',
    titleKey: 'knowledge.spaces.engineering',
  },
] as const;

export function knowledgeSpace(ref: SpaceRef) {
  return KNOWLEDGE_SPACES.find(
    (space) => space.scope === ref.scope && space.scopeId === ref.scopeId,
  );
}
