/**
 * The knowledge page: a space's documents with the spaces it inherits (`KnowledgeView`), filling the page below the
 * application's header. The application names the space (route option `space`, or the `space` prop where it routes the
 * page itself) and may word the title and the spaces.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { SpaceRef } from '../../shared/knowledge.js';
import {
  KnowledgeView,
  type KnowledgeViewLabels,
} from '../components/knowledge-view.js';

export interface KnowledgePageProps {
  readonly space: SpaceRef;
  /** The page's heading; the plugin's "Knowledge" without it. */
  readonly title?: ReactNode;
  readonly labels?: KnowledgeViewLabels;
  readonly onProposalDecided?: () => void;
}

export function KnowledgePage({
  space,
  title,
  labels,
  onProposalDecided,
}: KnowledgePageProps): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <section className='h-[calc(100svh-4rem)] min-h-96 p-4 md:p-6'>
      <KnowledgeView
        space={space}
        className='h-full'
        title={
          <h1 className='truncate font-heading text-lg font-semibold'>
            {title ?? t('knowledge.title')}
          </h1>
        }
        {...(labels ? { labels } : {})}
        {...(onProposalDecided ? { onProposalDecided } : {})}
      />
    </section>
  );
}
