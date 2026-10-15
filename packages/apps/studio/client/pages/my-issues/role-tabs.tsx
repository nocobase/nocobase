/**
 * My tasks' two halves, "I own" and "I execute", as tabs at the start of the toolbar's row, each with its open tasks and
 * how many wait for the viewer. The selected task (`?issue=`) belongs to one half and is left behind when switching.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { RouteTabs } from '@/components/route-tabs';

import type { TaskRoleCount } from '../../../shared/task-groups.js';
import { useTaskGroupSummary } from '../../issues/groups/api.js';

export function MyIssuesRoleTabs(): ReactElement {
  const { t } = useTranslation();
  const summary = useTaskGroupSummary();
  return (
    <RouteTabs
      label={t('issuesPage.myTabsLabel')}
      dropParams={['issue']}
      tabs={(['owned', 'executing'] as const).map((role) => ({
        // Relative to the tab the toolbar is on.
        path: `../${role}`,
        label: t(`issuesPage.myTabs.${role}`),
        extra: summary.data ? <TabCount count={summary.data[role]} /> : null,
      }))}
    />
  );
}

/** A tab's open tasks, and how many of them wait for the viewer. */
function TabCount({ count }: { readonly count: TaskRoleCount }): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <span className='text-muted-foreground tabular-nums'>{count.open}</span>
      {count.waiting > 0 ? (
        // The number alone, amber, so the tab stays short in every language; its meaning is in its label.
        <span
          className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white tabular-nums dark:text-amber-950'
          title={t('taskGroups.tabs.waiting', { count: count.waiting })}
          aria-label={t('taskGroups.tabs.waiting', { count: count.waiting })}
          data-testid='tab-waiting'
        >
          {count.waiting}
        </span>
      ) : null}
    </>
  );
}
