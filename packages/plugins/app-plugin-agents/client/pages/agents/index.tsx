/**
 * Route `/agents`: the agents people give work to, added from reported models or the application’s recommendations
 * (`runner-agents.tsx`). An application that keeps agents of its own composes this section into its own page instead
 * (`RunnerAgentsSection` from `client/kit`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { RunnerAgentsSection } from './runner-agents.js';

export default function AgentsPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader
        title={t('agents.title')}
        description={t('agents.description')}
      />
      <RunnerAgentsSection />
    </PageContainer>
  );
}
