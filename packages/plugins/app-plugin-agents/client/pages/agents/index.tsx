/**
 * Route `/agents`: the agents people give work to, one for each coding tool and model the runners report
 * (`runner-agents.tsx`). The list is the page, so its heading row is the page header, with "Show disabled" among the
 * page's actions as "Add service" is on the Models page. An application that keeps agents of its own composes this
 * section into its own page instead (`RunnerAgentsSection` from `client/kit`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { PageContainer } from '../../components/page-container.js';
import { RunnerAgentsSection } from './runner-agents.js';

export default function AgentsPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <RunnerAgentsSection
        heading='page'
        title={t('agents.title')}
        description={t('agents.description')}
      />
    </PageContainer>
  );
}
