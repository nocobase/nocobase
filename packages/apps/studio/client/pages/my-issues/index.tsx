import { canCreateIssues } from '@nocobase/app-plugin-projects/client/issues';
import {
  NewIssueButton,
  PmShortcuts,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { MyIssuesList } from './list.js';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import {
  TableCreateStateContext,
  useTableCreateState,
} from '../../issues/table-create-state.js';

export default function MyIssuesPage(): ReactElement {
  const { t } = useTranslation();
  const canCreate = canCreateIssues(useViewer());
  const createState = useTableCreateState();
  return (
    <TableCreateStateContext.Provider value={createState.report}>
      <PageContainer className='flex h-full min-h-0 flex-col gap-4 space-y-0'>
        <PageHeader
          title={t('issuesPage.myTitle')}
          description={t('issuesPage.myDescription')}
          actions={
            <>
              {/* ⌘K still opens the search; the toolbar's box searches the list. */}
              <PmShortcuts canCreate={canCreate} />
              {createState.visible ? (
                <NewIssueButton absolute canCreate={canCreate} />
              ) : null}
            </>
          }
        />
        <div className='min-h-0 flex-1'>
          <MyIssuesList />
        </div>
      </PageContainer>
    </TableCreateStateContext.Provider>
  );
}
