import { KnowledgeView } from '@nocobase/app-plugin-knowledge/client/pages';
import { KNOWLEDGE_SPACES } from '../../../shared/knowledge-spaces.js';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { KnowledgeChatAction } from './knowledge-chat-action.js';

/** The reusable view defaults to a single space when no directory is supplied. */
export default function KnowledgePage(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className='h-[calc(100svh-4rem)] min-h-96 p-4 md:p-6'>
      <KnowledgeView
        space={KNOWLEDGE_SPACES[0]}
        titleActions={<KnowledgeChatAction />}
        className='h-full'
        title={
          <h1 className='truncate font-heading text-lg font-semibold'>
            {t('knowledge.title')}
          </h1>
        }
      />
    </section>
  );
}
