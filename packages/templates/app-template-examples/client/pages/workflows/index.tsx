import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';

export default function WorkflowsPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const tab = location.pathname.includes('/executions')
    ? 'executions'
    : 'definitions';
  if (/\/workflows\/?$/.test(location.pathname))
    return (
      <Navigate
        to={{ pathname: 'definitions', search: location.search }}
        replace
      />
    );
  return (
    <PageContainer>
      <PageHeader
        title={t('workflows.title')}
        description={t('workflows.description')}
      />
      <Tabs
        value={tab}
        onValueChange={(value) => void navigate(`/workflows/${String(value)}`)}
      >
        <TabsList>
          <TabsTrigger value='definitions'>
            {t('workflows.definitions')}
          </TabsTrigger>
          <TabsTrigger value='executions'>
            {t('workflows.executions')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </PageContainer>
  );
}
