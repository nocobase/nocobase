import { useApiClient } from '@nocobase/app-client';
import {
  KnowledgeView,
  KnowledgeIndexingDialog,
  type KnowledgeDirectorySource,
} from '@nocobase/app-plugin-knowledge/client/pages';
import {
  DEFAULT_SPACE,
  type KnowledgeSearchHit,
  type KnowledgeSpaceSummary,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, useState, type ReactElement } from 'react';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { SettingsIcon } from 'lucide-react';
import { Button } from '../../components/ui/button.js';
import { knowledgeSpace } from '../../../shared/knowledge-spaces.js';

/** Reuses the plugin's directory UI; catalog ownership and permissions stay with this application. */
export default function KnowledgeDirectoryPage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const [indexingOpen, setIndexingOpen] = useState(false);
  const indexingRead = useCan({
    resource: { type: 'settings', id: 'kb.indexing' },
    action: 'read',
  });
  const directory = useMemo<KnowledgeDirectorySource>(
    () => ({
      sharedScope: DEFAULT_SPACE.scope,
      sharedLabel: t('knowledge.spaces.default'),
      summaries: async (signal) => {
        const { data } = await api.request<{ data: KnowledgeSpaceSummary[] }>({
          path: 'knowledgeDirectory',
          signal,
        });
        return data.map((entry) => {
          const definition = knowledgeSpace(entry.space);
          return {
            ...entry,
            space: {
              ...entry.space,
              title: definition ? t(definition.titleKey) : entry.space.title,
            },
          };
        });
      },
      search: async (query, signal) => {
        const { data } = await api.request<{ data: KnowledgeSearchHit[] }>({
          path: 'knowledgeDirectory/search',
          query: { q: query },
          signal,
        });
        return data;
      },
    }),
    [api, t],
  );

  return (
    <section className='h-[calc(100svh-4rem)] min-h-96 p-4 md:p-6'>
      <KnowledgeView
        space={DEFAULT_SPACE}
        titleActions={
          indexingRead.can ? (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={t('knowledge.indexing')}
              title={t('knowledge.indexing')}
              onClick={() => setIndexingOpen(true)}
            >
              <SettingsIcon />
            </Button>
          ) : null
        }
        directory={directory}
        className='h-full'
        title={
          <h1 className='truncate font-heading text-lg font-semibold'>
            {t('knowledge.title')}
          </h1>
        }
      />
      {indexingOpen ? (
        <KnowledgeIndexingDialog open onOpenChange={setIndexingOpen} />
      ) : null}
    </section>
  );
}
