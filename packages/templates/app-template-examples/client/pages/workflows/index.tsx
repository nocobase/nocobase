import type { ReactElement } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { WorkflowManagementLayout } from '#extensions/nocobase-workflow-management/layout';

export default function WorkflowsPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const definitionDetail = useMatch({
    path: '/workflows/definitions/:workflowId',
    end: false,
  });
  const executionDetail = useMatch({
    path: '/workflows/executions/:workflowId/:recordId',
    end: false,
  });
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
    <WorkflowManagementLayout
      title={t('workflows.title')}
      description={t('workflows.description')}
      labels={{
        definitions: t('workflows.definitions'),
        executions: t('workflows.executions'),
      }}
      tab={tab}
      onTabChange={(value) => void navigate(`/workflows/${value}`)}
      detail={Boolean(definitionDetail || executionDetail)}
    >
      <Outlet />
    </WorkflowManagementLayout>
  );
}
