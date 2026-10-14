import { KnowledgeView } from '@nocobase/app-plugin-knowledge/client/pages';
import type { KnowledgeDirectorySource } from '@nocobase/app-plugin-knowledge/client/pages';
import type {
  KnowledgeSpaceSummary,
  KnowledgeSearchHit,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement } from 'react';

import { SYSTEM_SPACE, PROJECT_SCOPE } from '../../../shared/knowledge.js';
import { useRefreshInbox } from '../../knowledge/inbox-refresh.js';
import { useKnowledgeAccessDetails } from '../../knowledge/access.js';
import { useKnowledgeLabels } from '../../knowledge/labels.js';

/**
 * Route `/knowledge`: authorized project and shared system sections in the plugin's directory, behind the existing
 * knowledge page grant. Project tabs keep their single-space views; document links and operations use the same pane.
 */
export default function KnowledgePage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const directory = useMemo<KnowledgeDirectorySource>(
    () => ({
      summaries: async (signal) =>
        (
          await api.request<{ data: KnowledgeSpaceSummary[] }>({
            path: 'knowledgeDirectory',
            signal,
          })
        ).data,
      search: async (q, signal) =>
        (
          await api.request<{ data: KnowledgeSearchHit[] }>({
            path: 'knowledgeDirectory/search',
            query: { q },
            signal,
          })
        ).data,
      sharedScope: SYSTEM_SPACE.scope,
      sharedLabel: t('knowledge.shared'),
    }),
    [api, t],
  );
  const labels = useKnowledgeLabels();
  const refreshInbox = useRefreshInbox();
  const systemDetails = useKnowledgeAccessDetails(SYSTEM_SPACE);
  const projectDetails = useKnowledgeAccessDetails({
    scope: PROJECT_SCOPE,
    scopeId: '',
  });
  return (
    <section className='flex h-full min-h-96 flex-col p-4 md:p-6'>
      <KnowledgeView
        space={SYSTEM_SPACE}
        directory={directory}
        labels={labels}
        title={
          <h1 className='font-heading text-lg font-semibold'>
            {t('navigation.knowledge')}
          </h1>
        }
        accessDetails={(ref) =>
          ref.scope === PROJECT_SCOPE ? projectDetails : systemDetails
        }
        className='min-h-0 flex-1'
        onProposalDecided={refreshInbox}
      />
    </section>
  );
}
