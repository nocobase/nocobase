/** The detail parts of the knowledge base's inbox entries (`knowledge.ts`): the proposal's change, and its decision. */
import { useTranslation } from '@nocobase/i18n/client';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import {
  ProposalActions,
  ProposalBody,
} from '@nocobase/app-plugin-knowledge/client/pages';
import type { KnowledgeProposal } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { field } from './releases.locales.js';

export type KnowledgeModel = UseQueryResult<KnowledgeProposal>;

export function KnowledgeActions({
  model,
  onDecided,
}: InboxPartProps<KnowledgeModel>): ReactElement | null {
  return model.data ? (
    <ProposalActions proposal={model.data} onDecided={onDecided} />
  ) : null;
}

export function KnowledgeBody({
  entry,
  model,
}: InboxPartProps<KnowledgeModel>): ReactElement {
  const { t } = useTranslation();
  if (model.data) return <ProposalBody proposal={model.data} />;
  if (model.isPending) return <Skeleton className='h-32 w-full' />;
  return (
    <p className='text-sm text-muted-foreground'>
      {field(entry, 'reason') ?? t('knowledge.doc.notFound')}
    </p>
  );
}
