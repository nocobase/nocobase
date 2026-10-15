/**
 * The issue lists on a phone, in place of the split view and the table: the same groups as cards (`task-list.tsx`),
 * rows at least 56 pixels tall with two lines of title, and a row sliding left to reveal Follow (a right swipe does
 * nothing). A task opens full screen over the list, which keeps its place; the task is in the URL (`?issue=`, pushed),
 * so the system's Back gesture returns to the list. Its top row has Back, the position with previous and next, the
 * follow star and "More"; its bottom is an action bar within the thumb's reach: what the step waiting for the viewer
 * needs (accept or send back, reply, the plan, the run record, taking it over), labelled with what waits, else the
 * comment box. Once handled, the toast offers the next task waiting.
 */
import type { IssueFilters } from '@nocobase/app-plugin-projects/client/issues';
import {
  canEditIssues,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckIcon,
  ChevronLeftIcon,
  ListChecksIcon,
  ListTodoIcon,
  ScrollTextIcon,
  UndoIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';

import type { TaskGroupItem, WaitReason } from '../../../shared/task-groups.js';
import { useIssuePullRequests } from '../../git/api.js';
import { MergeButtons } from '../../git/pull-requests.js';
import { OwnerHandoffActions } from '../detail/owner-handoff.js';
import { IssueComposer } from '../live/issue-composer.js';
import { isRecoverable } from './api.js';
import type { DetailTab } from './detail-model.js';
import { TaskDetailPane } from './detail-pane.js';
import { taskDraft } from './drafts.js';
import { TaskListBody } from './split-view.js';
import { WaitChip } from './task-list.js';
import { useTaskList } from './use-task-list.js';

export function PhoneTaskList({
  filters,
  filtered,
  follow,
  pageKey,
  issueHref,
  onClearFilters,
  empty,
}: {
  readonly filters: IssueFilters;
  readonly filtered: boolean;
  readonly follow: 'all' | 'scope';
  readonly pageKey: string;
  readonly issueHref: (id: string) => string;
  readonly onClearFilters: () => void;
  readonly empty: { title: string; description: string; action?: ReactNode };
}): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selectedParam = params.get('issue');
  const [tab, setTab] = useState<DetailTab>('feed');
  const list = useTaskList({
    filters,
    follow,
    pageKey,
    selectedParam,
    autoSelect: false,
    onSelect: (id) => {
      const next = new URLSearchParams(params);
      if (id) next.set('issue', id);
      else next.delete('issue');
      // Opening a task from the list is a step of its own, so Back returns to the list; moving between tasks is not.
      setParams(next, { replace: Boolean(selectedParam && id) });
    },
  });

  if (!list.data) {
    if (list.query.isError)
      return (
        <PmLoadError
          title={t('taskGroups.loadFailed')}
          error={list.query.error}
          {...(isRecoverable(list.query.error)
            ? { onRetry: () => void list.query.refetch() }
            : {})}
        />
      );
    return <PmListSkeleton />;
  }
  if (list.empty && !filtered && list.groups.every((g) => g.group === 'follow'))
    return (
      <PmEmpty
        icon={<ListTodoIcon />}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );

  const selected = list.selected;
  const index = selected ? list.order.indexOf(selected.issue.id) : -1;
  return (
    <div
      className='-mx-4 flex h-full min-h-0 flex-col bg-muted/40'
      data-testid='phone-task-list'
    >
      <TaskListBody
        list={list}
        locale={i18n.language}
        filtered={filtered}
        onClearFilters={onClearFilters}
        phone
      />
      {selected
        ? createPortal(
            <div
              className='fixed inset-0 z-50 flex flex-col bg-card pt-[env(safe-area-inset-top)]'
              data-testid='phone-task'
            >
              <TaskDetailPane
                key={selected.issue.id}
                issueId={selected.issue.id}
                variant='phone'
                issuePath={issueHref(selected.issue.identifier).split('?')[0]}
                issueSearch={`?${params.toString()}`}
                tab={tab}
                onTabChange={setTab}
                leading={
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={t('taskGroups.phone.back')}
                    onClick={() => void navigate(-1)}
                  >
                    <ChevronLeftIcon />
                  </Button>
                }
                nav={{
                  index: index + 1,
                  total: list.order.length,
                  onPrevious: index > 0 ? () => list.step(-1) : undefined,
                  onNext:
                    index >= 0 && index < list.order.length - 1
                      ? () => list.step(1)
                      : undefined,
                }}
                footer={(detail, update) => (
                  <ActionBar
                    item={selected}
                    detail={detail}
                    update={update}
                    onTab={setTab}
                  />
                )}
                className='min-h-0 flex-1'
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * The bottom of a task on a phone: what the step waiting for the viewer needs, under a label saying what waits, or the
 * comment box.
 */
export function ActionBar({
  item,
  detail,
  update,
  onTab,
}: {
  readonly item: Pick<TaskGroupItem, 'waits'> | null;
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly onTab: (tab: DetailTab) => void;
}): ReactElement {
  const wait: WaitReason | undefined = item?.waits[0];
  return (
    <div
      className='shrink-0 border-t bg-card/95 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md'
      data-testid='task-action-bar'
    >
      {wait ? (
        <div className='mb-2'>
          <WaitChip reason={wait} />
        </div>
      ) : null}
      <WaitActions wait={wait} detail={detail} update={update} onTab={onTab} />
    </div>
  );
}

function WaitActions({
  wait,
  detail,
  update,
  onTab,
}: {
  readonly wait: WaitReason | undefined;
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly onTab: (tab: DetailTab) => void;
}): ReactElement {
  const { t } = useTranslation();
  const viewer = useViewer();
  const prs = useIssuePullRequests(detail.id, detail.revision).data;
  const canEdit = canEditIssues(viewer);
  const row = 'flex items-center gap-2 [&>*]:h-11 [&>*]:flex-1';
  if (wait === 'accept') {
    const open = prs?.data.find((pr) => pr.state === 'open') ?? null;
    return (
      <div className={row}>
        {canEdit ? (
          <Button
            variant='outline'
            disabled={update.isPending}
            onClick={() => update.mutate({ statusKey: 'in_progress' })}
          >
            <UndoIcon data-icon='inline-start' />
            {t('issueLive.summary.sendBack')}
          </Button>
        ) : null}
        {open && prs?.canMerge ? (
          <MergeButtons
            issue={detail}
            pullRequest={open}
            size='default'
            mergeOnly
          />
        ) : canEdit ? (
          <Button
            disabled={update.isPending}
            onClick={() => update.mutate({ statusKey: 'done' })}
          >
            <CheckIcon data-icon='inline-start' />
            {t('taskGroups.phone.accept')}
          </Button>
        ) : null}
      </div>
    );
  }
  if (wait === 'takeOver') return <OwnerHandoffActions issueId={detail.id} />;
  if (wait === 'plan')
    return (
      <div className={row}>
        <Button onClick={() => onTab('desc')}>
          <ListChecksIcon data-icon='inline-start' />
          {t('taskGroups.waits.plan')}
        </Button>
      </div>
    );
  if (wait === 'failed')
    return (
      <div className={row}>
        <Button variant='outline' onClick={() => onTab('runs')}>
          <ScrollTextIcon data-icon='inline-start' />
          {t('taskGroups.detail.tabs.runs')}
        </Button>
      </div>
    );
  // Answering, and the comment box otherwise.
  return (
    <IssueComposer
      foldable={wait !== 'answer'}
      session={taskDraft(detail.id)}
    />
  );
}
