/**
 * Route `/agents`: Studio's Agent page. The project manager first (`agents/project-manager/section.tsx`), which arranges
 * every issue's work, then the agents discovered from runners, which it hands steps to (the agents plugin's
 * `RunnerAgentsSection`). Its child route `project-manager` opens the project manager's settings over it.
 */
import { RunnerAgentsSection } from '@nocobase/app-plugin-agents/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';

import { ProjectManagerSection } from '../../agents/project-manager/section.js';

export default function AgentsPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader
        title={t('agentsPage.title')}
        description={t('agentsPage.description')}
      />
      <ProjectManagerSection />
      <RunnerAgentsSection />
      <Outlet />
    </PageContainer>
  );
}
