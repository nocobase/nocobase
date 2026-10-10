/**
 * How Studio words its spaces in the knowledge plugin's view: a project's space by the project's name ("This project"
 * before it is known), the system's as "System", and what an inherited space is.
 */
import type { KnowledgeViewLabels } from '@nocobase/app-plugin-knowledge/client/pages';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import { PROJECT_SCOPE } from '../../shared/knowledge.js';

export function useKnowledgeLabels(): KnowledgeViewLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      spaceTitle: (space) =>
        space.scope === PROJECT_SCOPE
          ? (space.title ?? t('knowledge.spaces.project'))
          : t('knowledge.spaces.system'),
      inheritedHint: t('knowledge.spaces.inheritedHint'),
      inheritedHit: t('knowledge.search.inherited'),
    }),
    [t],
  );
}
