/**
 * A task's detail beside a list: the split view's right side, "My Agent"'s side panel and the phone's task screen. It
 * shows what the issue page shows, in a narrower frame:
 *
 * - a top row: previous and next with the position in the list (J and K), the project and key, the follow star, the
 *   full page and "More" (copy link, ask the agent, notifications, delete);
 * - the summary of the issue page (`../live/issue-summary.tsx`): the title renamed in place, a status menu, the pull
 *   request and its checks, "Now", and "Needs you" with its actions;
 * - the properties as one row of compact fields;
 * - tabs: activity, description (with files, dependencies and plans), sub-tasks, code and deployments, runs; the tab
 *   stays when the task changes, back to activity where the task has no such tab;
 * - the comment box at the bottom, its draft kept per task; "My Agent" folds it to one line, since its page already
 *   has the box for talking to the agent.
 *
 * The issue is read with the issue page's own queries and polling (`useLiveIssue`), so what changes there changes here.
 * Its links to the pages under the issue (a run, a new sub-issue) lead from the issue's own address (`issue-base.ts`).
 */
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import {
  canCloseIssue,
  canDeleteIssues,
  canEditIssues,
  isClosing,
  useIssueDetail,
  useIssuePageActions,
  useIssueUpdate,
  useStatusName,
  type IssuePageActions,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmLoadError,
  pmKeys,
  usePageContextSource,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
  BellIcon,
  BellOffIcon,
  BotMessageSquareIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CornerLeftUpIcon,
  ExternalLinkIcon,
  LinkIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, useHref } from 'react-router';
import { useToaster } from '@nocobase/app-client';

import { StatusIcon } from '@/components/status-icon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueSectionInTabContext } from '@/extensions/nocobase-issue-detail/section-context';
import { cn } from 'cn';

import { EmbeddedRuns } from '../../agents/embedded-runs.js';
import { IssueRunPanel, IssueRunRow } from '../../agents/issue-runs.js';
import { chatItemOf } from '../../agents/chat-items.js';
import { useIssuePullRequests } from '../../git/api.js';
import { useMarkSeen } from '../../follow-ups/api.js';
import { useLiveIssue } from '../../pages/issues/detail/use-live-issue.js';
import { IssueCodeSection } from '../detail/code-section.js';
import { PropertyRow } from '@/components/property-fields';

import { PreviewPreferenceField } from '../../previews/preference-field.js';
import { useIssuePropertyFields } from '../detail/issue-property-fields.js';
import { IssueBaseContext } from '../detail/issue-base.js';
import {
  IssueAddSection,
  IssueDependenciesSection,
  IssueDescriptionSection,
  IssueFilesSection,
  IssueSubtasksSection,
} from '../detail/issue-main.js';
import { IssuePlansSection } from '../detail/issue-plans.js';
import { useIssuePageWording } from '../detail/labels.js';
import { useIssueMainState } from '../detail/main-state.js';
import { IssueConversation } from '../live/conversation.js';
import { useIssueConversation } from '../live/conversation-state.js';
import { FollowToggle } from '../live/follow-toggle.js';
import { IssueComposer } from '../live/issue-composer.js';
import { IssueFeed } from '../live/issue-feed.js';
import { IssueSummary } from '../live/issue-summary.js';
import { taskDraft } from './drafts.js';
import type { DetailTab, TaskNav } from './detail-model.js';

export type DetailVariant = 'split' | 'agent' | 'phone';

export interface TaskDetailPaneProps {
  readonly issueId: string;
  readonly nav?: TaskNav;
  /** The issue's own page: "Full page" and the base of the pages under it. */
  readonly issuePath: string;
  /** The query string the full page keeps, so its way back returns to the list as it was. */
  readonly issueSearch?: string;
  readonly variant: DetailVariant;
  readonly tab: DetailTab;
  readonly onTabChange: (tab: DetailTab) => void;
  /** Closes the pane ("My Agent", the phone). */
  readonly onClose?: () => void;
  /** Before the arrows in the top row, such as "← Session info" or the phone's Back. */
  readonly leading?: ReactNode;
  /** Selects another task in the list, such as the parent named at the top. */
  readonly onGoto?: (issueId: string) => void;
  /** At the bottom instead of the comment box, such as the phone's action bar. */
  readonly footer?: (detail: IssueDetail, update: IssueUpdate) => ReactNode;
  readonly className?: string;
}

export function TaskDetailPane(props: TaskDetailPaneProps): ReactElement {
  const { t } = useTranslation();
  const detail = useIssueDetail(props.issueId);
  if (detail.isError && !detail.data)
    return (
      <PaneFrame className={props.className}>
        <PaneTop {...props} detail={null} />
        <div className='p-6'>
          <PmLoadError
            title={t('taskGroups.detail.loadFailed')}
            error={detail.error}
            onRetry={() => void detail.refetch()}
          />
        </div>
      </PaneFrame>
    );
  if (!detail.data)
    return (
      <PaneFrame className={props.className}>
        <PaneTop {...props} detail={null} />
        <div className='flex flex-col gap-3 p-6' aria-busy='true'>
          <Skeleton className='h-7 w-3/4' />
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
      </PaneFrame>
    );
  return <LiveTask {...props} detail={detail.data} />;
}

function PaneFrame({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t('taskGroups.listLabel')}
      data-testid='task-detail'
      className={cn(
        'flex min-h-0 min-w-0 flex-col bg-card text-card-foreground',
        className,
      )}
    >
      {children}
    </section>
  );
}

function LiveTask({
  detail,
  ...props
}: TaskDetailPaneProps & { readonly detail: IssueDetail }): ReactElement {
  const { issueId, variant, tab, onTabChange } = props;
  const { t } = useTranslation();
  const wording = useIssuePageWording();
  const viewer = useViewer();
  const detailKey = useMemo(() => pmKeys.issue(issueId), [issueId]);
  const update = useIssueUpdate(detail, detailKey);
  const pageActions = useIssuePageActions(detail);
  const runs = useLiveIssue(detail, issueId, detailKey, 0);
  const main = useIssueMainState(pageActions);
  const prs = useIssuePullRequests(detail.id, detail.revision).data;
  const markSeen = useMarkSeen();
  const progressRefresh = [
    detail.revision,
    detail.statusKey,
    ...runs.map((run) => `${run.id}:${run.status}`),
  ].join('|');
  const entry = useMemo(
    () =>
      ({
        kind: 'issue',
        id: detail.id,
        label: `${detail.identifier} ${detail.title}`,
      }) as const,
    [detail.id, detail.identifier, detail.title],
  );
  usePageContextSource(entry);
  // Whatever arrived while the task is shown counts as seen, for the follow group's unread count.
  const latest = [
    detail.activities.at(-1)?.id ?? '',
    detail.threads.length,
    detail.threads.at(-1)?.replies.length ?? 0,
  ].join(':');
  useEffect(() => {
    if (document.visibilityState !== 'hidden') markSeen(detail.id);
  }, [detail.id, latest, markSeen]);

  const finishedSubs = detail.subtasks.filter((subtask) =>
    ['done', 'cancelled'].includes(subtask.status.key),
  ).length;
  const tabs: { readonly key: DetailTab; readonly count: string }[] = [
    {
      key: 'feed',
      count: detail.threads.length ? String(detail.threads.length) : '',
    },
    { key: 'desc', count: '' },
    ...(detail.subtasks.length > 0
      ? [
          {
            key: 'subs' as const,
            count: `${finishedSubs}/${detail.subtasks.length}`,
          },
        ]
      : []),
    { key: 'code', count: prs?.data.length ? String(prs.data.length) : '' },
    { key: 'runs', count: runs.length ? String(runs.length) : '' },
  ];
  const shown: DetailTab = tabs.some((item) => item.key === tab) ? tab : 'feed';

  const phone = variant === 'phone';
  return (
    <IssueBaseContext.Provider value={props.issuePath}>
      <EmbeddedRuns>
        <IssueConversation detail={detail} detailKey={detailKey}>
          <PaneFrame className={props.className}>
            <PaneTop
              {...props}
              detail={detail}
              pageActions={pageActions}
              update={update}
            />
            <div
              className='@container/detail min-h-0 flex-1 overflow-y-auto overscroll-y-contain'
              data-testid='task-detail-scroll'
            >
              <div
                className={cn(
                  'mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 pt-5 pb-6',
                  phone && 'px-4 pt-3',
                )}
              >
                {detail.parent ? (
                  <ParentLink detail={detail} onGoto={props.onGoto} />
                ) : null}
                <IssueSummary
                  issue={detail}
                  update={update}
                  refresh={progressRefresh}
                  runsBase={props.issuePath}
                  // The key and the status menu are in the top row.
                  meta={false}
                  headingLevel={2}
                  {...(canEditIssues(viewer)
                    ? {
                        rename: {
                          onRename: async (title: string) => {
                            await update.mutateAsync({ title });
                          },
                          editLabel: wording.detail.editTitle,
                          inputLabel: wording.detail.titleLabel,
                        },
                      }
                    : {})}
                />
                <PropertyChips
                  detail={detail}
                  update={update}
                  pageActions={pageActions}
                  phone={phone}
                />
                <Tabs
                  value={shown}
                  onValueChange={(value) => onTabChange(value as DetailTab)}
                  className='gap-4'
                >
                  <TabsList
                    variant='line'
                    aria-label={t('taskGroups.detail.tabs.label')}
                    // Only a phone's strip scrolls sideways (and never up and down); beside a list the tabs fit.
                    className={cn(
                      'w-full justify-start gap-1 border-b bg-card',
                      phone &&
                        'sticky top-0 z-10 overflow-x-auto overflow-y-hidden pb-1',
                    )}
                  >
                    {tabs.map((item) => (
                      <TabsTrigger
                        key={item.key}
                        value={item.key}
                        className='flex-none px-2'
                        data-testid={`task-tab-${item.key}`}
                      >
                        {t(`taskGroups.detail.tabs.${item.key}`)}
                        {item.count ? (
                          <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                            {item.count}
                          </span>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value='feed'>
                    <IssueFeed
                      titleHidden
                      runs={runs}
                      renderRun={(runId) => (
                        <IssueRunRow issue={detail} runId={runId} />
                      )}
                    />
                  </TabsContent>
                  <TabsContent value='desc' className='flex flex-col gap-6'>
                    <IssueDescriptionSection detail={detail} update={update} />
                    <IssueAddSection detail={detail} state={main} />
                    <IssueFilesSection
                      detail={detail}
                      pageActions={pageActions}
                      state={main}
                    />
                    <IssueDependenciesSection
                      detail={detail}
                      pageActions={pageActions}
                      state={main}
                    />
                    <IssuePlansSection issue={detail} />
                  </TabsContent>
                  {/* A section under the tab of its name does not repeat its heading or frame. */}
                  <IssueSectionInTabContext.Provider value>
                    <TabsContent value='subs'>
                      <IssueSubtasksSection detail={detail} />
                    </TabsContent>
                    <TabsContent value='code'>
                      <CodeTab detail={detail} />
                    </TabsContent>
                  </IssueSectionInTabContext.Provider>
                  <TabsContent
                    value='runs'
                    className='[&_[data-slot=agent-run-history]>div:first-child>h2]:sr-only [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:ring-0 [&_[data-slot=card-content]]:px-0'
                  >
                    <IssueRunPanel issue={detail} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            {props.footer ? (
              props.footer(detail, update)
            ) : (
              // One line naming the task until opened, the same beside a list and beside a conversation.
              <FoldedComposer
                identifier={detail.identifier}
                issueId={detail.id}
                agentHint={variant === 'agent'}
              />
            )}
          </PaneFrame>
        </IssueConversation>
      </EmbeddedRuns>
    </IssueBaseContext.Provider>
  );
}

function CodeTab({ detail }: { readonly detail: IssueDetail }): ReactElement {
  const [linking, setLinking] = useState(false);
  return (
    <IssueCodeSection
      issue={detail}
      linking={linking}
      setLinking={setLinking}
    />
  );
}

/** The parent task, above the title; it selects the parent in the list when it is there. */
function ParentLink({
  detail,
  onGoto,
}: {
  readonly detail: IssueDetail;
  readonly onGoto: ((issueId: string) => void) | undefined;
}): ReactElement | null {
  const parent = detail.parent;
  if (!parent) return null;
  const content = (
    <>
      <CornerLeftUpIcon className='size-3.5 shrink-0' aria-hidden />
      <span className='shrink-0 font-mono text-xs'>{parent.identifier}</span>
      <span className='truncate'>{parent.title}</span>
    </>
  );
  const className =
    'inline-flex max-w-full min-w-0 items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground';
  return onGoto ? (
    <button
      type='button'
      className={className}
      onClick={() => onGoto(parent.id)}
    >
      {content}
    </button>
  ) : (
    <span className={className}>{content}</span>
  );
}

/** The status as a button that opens the statuses to move the task to. */
function StatusMenu({
  detail,
  update,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
}): ReactElement {
  const { t } = useTranslation();
  const viewer = useViewer();
  const statusName = useStatusName();
  const canEdit = canEditIssues(viewer);
  const canClose = canEdit && canCloseIssue(viewer, detail);
  const name = statusName(detail.statuses, detail.statusKey);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            disabled={!canEdit || update.isPending}
            aria-label={`${t('taskGroups.detail.status')}: ${name}`}
            data-testid='task-status-menu'
            className='h-7 gap-1.5 px-2 font-normal'
          />
        }
      >
        <StatusIcon statusKey={detail.statusKey} className='size-3.5' />
        {name}
        <ChevronDownIcon className='size-3 text-muted-foreground/70' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-auto min-w-40'>
        <DropdownMenuRadioGroup
          value={detail.statusKey}
          onValueChange={(statusKey: string) => {
            if (statusKey !== detail.statusKey) update.mutate({ statusKey });
          }}
        >
          {detail.statuses.map((status) => (
            <DropdownMenuRadioItem
              key={status.key}
              value={status.key}
              closeOnClick
              disabled={
                !canClose &&
                status.key !== detail.statusKey &&
                isClosing(status.category)
              }
            >
              <StatusIcon statusKey={status.key} className='size-3.5' />
              {statusName(detail.statuses, status.key)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The properties people change most, each a compact field that edits in place. */
function PropertyChips({
  detail,
  update,
  pageActions,
  phone,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly pageActions: IssuePageActions;
  readonly phone: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { fields } = useIssuePropertyFields({
    detail,
    update,
    pageActions,
    idPrefix: 'task-prop',
  });
  const wording = useIssuePageWording();
  const [open, setOpen] = usePropertiesOpen();
  // Folded, the properties read as one quiet line; they are changed now and then, not read every time.
  const facts = [
    detail.owner
      ? [t('taskGroups.detail.props.owner'), detail.owner.name]
      : null,
    detail.executorName
      ? [t('taskGroups.detail.props.executor'), detail.executorName]
      : null,
    [
      t('taskGroups.detail.props.priority'),
      wording.t(`priority.${detail.priority}`),
    ],
    detail.project
      ? [t('taskGroups.detail.props.project'), detail.project.name]
      : null,
    detail.labels.length > 0
      ? [
          t('taskGroups.detail.props.labels'),
          detail.labels.map((label) => label.name).join(', '),
        ]
      : null,
    detail.dueDate ? [t('taskGroups.detail.props.due'), detail.dueDate] : null,
  ].filter((fact): fact is string[] => fact !== null);
  const toggle = (
    <button
      type='button'
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className='inline-flex shrink-0 items-center gap-1 rounded-md px-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
    >
      <ChevronRightIcon
        className={cn('size-3.5 transition-transform', open && 'rotate-90')}
      />
      {t('taskGroups.detail.props.label')}
    </button>
  );
  if (!open)
    return (
      <div
        className='flex min-w-0 items-center gap-2 text-xs'
        data-testid='task-properties'
      >
        {toggle}
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='min-w-0 truncate text-left text-muted-foreground hover:text-foreground'
          title={t('taskGroups.detail.props.edit')}
        >
          {facts.map(([label, value], index) => (
            <span key={label}>
              {index > 0 ? ' · ' : ''}
              {label} <span className='text-foreground'>{value}</span>
            </span>
          ))}
        </button>
      </div>
    );
  // Unfolded: the title on a line of its own, then the issue page's side-column fields with their own controls.
  return (
    <div className='flex flex-col gap-2' data-testid='task-properties'>
      <div>{toggle}</div>
      <div
        role='group'
        aria-label={t('taskGroups.detail.props.label')}
        // No frame of its own: the rows alone, as the issue page's side column lists them.
        className={cn(
          'grid gap-x-8 gap-y-2 pl-5',
          !phone && '@xl/detail:grid-cols-2',
        )}
      >
        <PreviewPreferenceField issueId={detail.id} />
        {fields
          .filter((field) => field.key !== 'status')
          .map((field) => (
            <PropertyRow
              key={field.key}
              label={field.label}
              {...(field.htmlFor ? { htmlFor: field.htmlFor } : {})}
            >
              {field.control}
            </PropertyRow>
          ))}
      </div>
    </div>
  );
}

const PROPERTIES_OPEN_KEY = 'studio:task-groups:properties-open';

/** Whether the person keeps the properties unfolded, remembered in this browser; folded by default. */
function usePropertiesOpen(): readonly [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(PROPERTIES_OPEN_KEY) === 'true';
    } catch {
      return false;
    }
  });
  return [
    open,
    (next: boolean) => {
      setOpen(next);
      try {
        window.localStorage.setItem(PROPERTIES_OPEN_KEY, String(next));
      } catch {
        // A convenience only.
      }
    },
  ] as const;
}

/**
 * The task's comment box: one line naming the task until opened, so the task keeps the height, the same beside a list
 * and beside a conversation. On "My Agent", opened, it reminds that the session's agent is talked to in the
 * conversation (`agentHint`).
 */
function FoldedComposer({
  identifier,
  issueId,
  agentHint,
}: {
  readonly identifier: string;
  readonly issueId: string;
  readonly agentHint: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const conversation = useIssueConversation();
  // The conversation's own open state, so the feed's Reply and Answer open it too.
  const open = conversation.composerOpen;
  const setOpen = conversation.setComposerOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  if (!conversation.mayComment) return null;
  if (!open)
    return (
      <div className='shrink-0 border-t bg-card px-4 py-2.5'>
        <button
          type='button'
          data-testid='task-comment-folded'
          className='flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-left text-sm text-muted-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          onClick={conversation.openComposer}
        >
          <MessageSquareIcon className='size-4 shrink-0' />
          {t('taskGroups.detail.commentOn', { identifier })}
        </button>
      </div>
    );
  const draft = taskDraft(issueId);
  return (
    <div
      ref={rootRef}
      className='flex shrink-0 flex-col gap-2 border-t bg-card px-4 py-3'
      // Left with nothing in it, it folds back to its line once the focus goes elsewhere.
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        // A mention list or a file dialog the box opened still belongs to it.
        if (
          next instanceof Element &&
          next.closest('[role=listbox],[role=menu],[role=dialog]')
        )
          return;
        const empty =
          !draft.read('content', '').trim() &&
          !conversation.replyTo &&
          !rootRef.current?.querySelector('[data-pending-attachment], li');
        if (empty) setOpen(false);
      }}
    >
      {agentHint ? (
        <p className='text-xs text-muted-foreground'>
          {t('taskGroups.detail.commentHint')}
        </p>
      ) : null}
      <IssueComposer session={draft} />
    </div>
  );
}

function PaneTop({
  detail,
  pageActions,
  nav,
  issuePath,
  issueSearch = '',
  variant,
  onClose,
  leading,
  update,
}: TaskDetailPaneProps & {
  readonly detail: IssueDetail | null;
  readonly pageActions?: IssuePageActions;
  readonly update?: IssueUpdate;
}): ReactElement {
  const { t } = useTranslation();
  const phone = variant === 'phone';
  const vertical = variant === 'split';
  const PrevIcon = vertical ? ChevronUpIcon : ChevronLeftIcon;
  const NextIcon = vertical ? ChevronDownIcon : ChevronRightIcon;
  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center gap-1 border-b px-3',
        phone && 'h-14 px-2',
      )}
      data-testid='task-detail-top'
    >
      {leading}
      {nav && nav.total > 0 ? (
        <>
          <Button
            variant='ghost'
            size={phone ? 'icon' : 'icon-sm'}
            aria-label={t('taskGroups.detail.previous')}
            title={t('taskGroups.detail.previous')}
            disabled={!nav.onPrevious}
            onClick={nav.onPrevious}
          >
            <PrevIcon />
          </Button>
          <Button
            variant='ghost'
            size={phone ? 'icon' : 'icon-sm'}
            aria-label={t('taskGroups.detail.next')}
            title={t('taskGroups.detail.next')}
            disabled={!nav.onNext}
            onClick={nav.onNext}
          >
            <NextIcon />
          </Button>
          {nav.index > 0 ? (
            <span
              className='px-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums'
              data-testid='task-position'
            >
              {t('taskGroups.detail.position', {
                index: nav.index,
                total: nav.total,
              })}
            </span>
          ) : null}
        </>
      ) : null}
      {detail && variant === 'split' ? (
        <span className='ml-2 min-w-0 truncate text-sm text-muted-foreground'>
          {detail.project ? `${detail.project.name} · ` : ''}
          <span className='font-mono text-xs'>{detail.identifier}</span>
        </span>
      ) : null}
      {detail && update ? (
        <span className='ml-2 shrink-0'>
          <StatusMenu detail={detail} update={update} />
        </span>
      ) : null}
      <span className='ml-auto flex shrink-0 items-center gap-1'>
        {detail ? (
          <FollowToggle
            issueId={detail.id}
            // Borderless and quiet beside the title; a narrow panel shows the star alone.
            className={cn(
              'border-transparent bg-transparent font-normal text-muted-foreground shadow-none hover:text-foreground',
              variant !== 'split' && '[&>span]:sr-only',
            )}
          />
        ) : null}
        {detail && !phone ? (
          <Button
            variant='ghost'
            size='sm'
            nativeButton={false}
            render={<Link to={{ pathname: issuePath, search: issueSearch }} />}
            data-testid='task-full-page'
            className='font-normal text-muted-foreground hover:text-foreground'
          >
            <ExternalLinkIcon data-icon='inline-start' />
            <span
              className={cn(variant === 'split' ? 'max-xl:sr-only' : 'sr-only')}
            >
              {t('taskGroups.detail.fullPage')}
            </span>
          </Button>
        ) : null}
        {detail && pageActions ? (
          <MoreMenu
            detail={detail}
            pageActions={pageActions}
            issuePath={issuePath}
            issueSearch={issueSearch}
            phone={phone}
            {...(onClose ? { onDeleted: onClose } : {})}
          />
        ) : null}
        {onClose && !phone ? (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('taskGroups.detail.close')}
            title={t('taskGroups.detail.close')}
            onClick={onClose}
          >
            <XIcon />
          </Button>
        ) : null}
      </span>
    </div>
  );
}

function MoreMenu({
  detail,
  pageActions,
  issuePath,
  issueSearch,
  phone,
  onDeleted,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
  readonly issuePath: string;
  readonly issueSearch: string;
  readonly phone: boolean;
  readonly onDeleted?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const viewer = useViewer();
  const toaster = useToaster();
  const panel = useChatPanel();
  const href = useHref(`/issues/${encodeURIComponent(detail.identifier)}`);
  const fullHref = useHref({ pathname: issuePath, search: issueSearch });
  const [confirming, setConfirming] = useState(false);
  const subscribed = detail.subscribers.some(
    (subscriber) => subscriber.userId === viewer?.userId,
  );
  const item = chatItemOf({
    kind: 'issue',
    id: detail.id,
    label: `${detail.identifier} ${detail.title}`,
  });
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size={phone ? 'icon' : 'icon-sm'}
              aria-label={t('taskGroups.detail.more')}
              data-testid='task-more'
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-44'>
          <DropdownMenuGroup>
            {phone ? (
              <DropdownMenuItem render={<a href={fullHref} />}>
                <ExternalLinkIcon />
                {t('taskGroups.detail.fullPage')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => {
                const url = new URL(href, window.location.origin).href;
                void navigator.clipboard?.writeText(url).then(
                  () =>
                    toaster.show({
                      type: 'success',
                      title: t('taskGroups.detail.linkCopied'),
                    }),
                  () => undefined,
                );
              }}
            >
              <LinkIcon />
              {t('taskGroups.detail.copyLink')}
            </DropdownMenuItem>
            {panel.available && item ? (
              <DropdownMenuItem
                onClick={() =>
                  panel.openChat({
                    pin: item,
                    draft: t('pmChat.askAgent.drafts.issue'),
                    view: 'chat',
                    source: 'askAgent',
                    conversationId: null,
                  })
                }
              >
                <BotMessageSquareIcon />
                {t('taskGroups.detail.askAgent')}
              </DropdownMenuItem>
            ) : null}
            {viewer ? (
              <DropdownMenuItem
                onClick={() => void pageActions.setFollowing(!subscribed)}
              >
                {subscribed ? <BellOffIcon /> : <BellIcon />}
                {subscribed
                  ? t('taskGroups.detail.unsubscribe')
                  : t('taskGroups.detail.subscribe')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          {canDeleteIssues(viewer) ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setConfirming(true)}
              >
                <Trash2Icon />
                {t('taskGroups.detail.delete')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('taskGroups.detail.deleteConfirm', {
                identifier: detail.identifier,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('taskGroups.detail.deleteBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('taskGroups.detail.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() =>
                void pageActions.deleteIssue().then(() => onDeleted?.())
              }
            >
              {t('taskGroups.detail.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
