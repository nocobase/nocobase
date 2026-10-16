/**
 * A task's detail beside a list: the split view's right side, "My Agent"'s side panel and the phone's task screen. It
 * shows what the issue page shows, in a narrower frame:
 *
 * - a top row: previous and next with the position in the list (J and K), then the key (copies the link) and the
 *   project (opens it), all on the left; on the right what is done to the task: the status menu, the follow star and
 *   "More" (copy link, ask the agent, notifications, delete);
 * - the summary of the issue page (`../live/issue-summary.tsx`): the title renamed in place, the pull request and its
 *   checks, "Now", and "Needs you" with its actions; then Studio's marks and "Waiting for you", the decisions the
 *   summary does not already hold;
 * - the properties as one row of chips, each changed in place, and "More properties" for the rest: the start date,
 *   the stage, previews, who is notified (with the viewer's own subscribe button) and the dates;
 * - tabs: activity, description (with the add bar, files, dependencies, plans and project setup), sub-tasks, code and
 *   deployments (unfolded, since the tab was opened to see them), runs; the tab stays when the task changes, back to
 *   activity where the task has no such tab. Files dropped anywhere on the detail are attached;
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
  Loader2Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  SlidersHorizontalIcon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueFileDrop } from '@/extensions/nocobase-issue-detail/issue-detail';
import {
  dateTime,
  relativeTime,
} from '@/extensions/nocobase-issue-detail/labels';
import { IssueSectionInTabContext } from '@/extensions/nocobase-issue-detail/section-context';
import { cn } from 'cn';

import { EmbeddedRuns } from '../../agents/embedded-runs.js';
import { IssueRunPanel, IssueRunRow } from '../../agents/issue-runs.js';
import { chatItemOf } from '../../agents/chat-items.js';
import { useIssuePullRequests } from '../../git/api.js';
import { useMarkSeen } from '../../follow-ups/api.js';
import { useLiveIssue } from '../../pages/issues/detail/use-live-issue.js';
import {
  IssueCodeAddButton,
  IssueCodeSection,
} from '../detail/code-section.js';
import { PeopleAvatars, PropertyRow } from '@/components/property-fields';
import { IssueWaitingSection } from '../../inbox/issue-waiting.js';
import { IssueInitSection } from '../../projects/init-card.js';
import { IssueMarks } from '../issue-marks.js';
import { useSummaryCovered } from '../detail/use-summary-covered.js';

import { PreviewPreferenceField } from '../../previews/preference-field.js';
import {
  useIssuePropertyFields,
  type IssuePropertyField,
} from '../detail/issue-property-fields.js';
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
  /** What the viewer follows, as the list beside the pane read it; the follow star reads it itself without. */
  readonly following?: readonly string[] | undefined;
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
  const prs = useIssuePullRequests(detail.id).data;
  const covered = useSummaryCovered(detail);
  const markSeen = useMarkSeen();
  // "Pull request" in the description's add bar opens the link input under the Code tab.
  const [linking, setLinking] = useState(false);
  const linkFromAddBar = (next: boolean): void => {
    setLinking(next);
    if (next) onTabChange('code');
  };
  // Design proposals earlier versions posted stay tagged, as on the issue page.
  const kindLabels = useMemo(() => ({ proposal: t('design.tag') }), [t]);
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
            <IssueFileDrop
              {...(main.canUpload ? { onFiles: main.upload } : {})}
              className='@container/detail min-h-0 flex-1 overflow-y-auto overscroll-y-contain'
            >
              <div
                data-testid='task-detail-scroll'
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
                <IssueMarks issue={detail} placement='detail' />
                <IssueWaitingSection issue={detail} covered={covered} />
                <PropertyChips
                  detail={detail}
                  update={update}
                  pageActions={pageActions}
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
                      kindLabels={kindLabels}
                      runs={runs}
                      renderRun={(runId) => (
                        <IssueRunRow issue={detail} runId={runId} />
                      )}
                    />
                  </TabsContent>
                  <TabsContent value='desc' className='flex flex-col gap-6'>
                    <IssueDescriptionSection detail={detail} update={update} />
                    <IssueAddSection detail={detail} state={main}>
                      <IssueCodeAddButton
                        issue={detail}
                        linking={linking}
                        setLinking={linkFromAddBar}
                      />
                    </IssueAddSection>
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
                    <IssueInitSection issue={detail} />
                  </TabsContent>
                  {/* A section under the tab of its name does not repeat its heading or frame. */}
                  <IssueSectionInTabContext.Provider value>
                    <TabsContent value='subs'>
                      <IssueSubtasksSection detail={detail} />
                    </TabsContent>
                    <TabsContent value='code'>
                      <IssueCodeSection
                        issue={detail}
                        linking={linking}
                        setLinking={setLinking}
                      />
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
            </IssueFileDrop>
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
            variant='outline'
            size='sm'
            disabled={!canEdit || update.isPending}
            aria-label={`${t('taskGroups.detail.status')}: ${name}`}
            data-testid='task-status-menu'
            className='h-7 gap-1.5 rounded-full px-2.5 font-normal'
          />
        }
      >
        <StatusIcon statusKey={detail.statusKey} className='size-3.5' />
        {name}
        <ChevronDownIcon className='size-3 text-muted-foreground/70' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto min-w-40'>
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

/** The properties the row shows as chips; the rest are under "More properties". */
const CHIP_FIELDS: ReadonlySet<string> = new Set([
  'priority',
  'owner',
  'assignToMe',
  'executor',
  'project',
  'labels',
  'due',
]);

/**
 * A chip around one of the issue page's property controls: its label, then the control drawn flat inside it, so the
 * field keeps its own menu, calendar or search and only its frame changes.
 */
const CHIP = cn(
  'inline-flex h-7 max-w-full min-w-0 items-center rounded-md bg-muted/60 pl-2 text-sm transition-colors hover:bg-muted',
  '[&_[data-slot=select-trigger]]:h-7 [&_[data-slot=select-trigger]]:w-auto [&_[data-slot=select-trigger]]:max-w-56 [&_[data-slot=select-trigger]]:gap-1 [&_[data-slot=select-trigger]]:border-0 [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:pl-1.5 [&_[data-slot=select-trigger]]:shadow-none dark:[&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]>svg:last-child]:size-3 [&_[data-slot=select-trigger]>svg:last-child]:opacity-60',
  '[&_[data-slot=combobox-chips]]:min-h-7 [&_[data-slot=combobox-chips]]:w-auto [&_[data-slot=combobox-chips]]:max-w-80 [&_[data-slot=combobox-chip-input]]:w-20 [&_[data-slot=combobox-chip-input]]:flex-none [&_[data-slot=combobox-chips]]:border-0 [&_[data-slot=combobox-chips]]:bg-transparent [&_[data-slot=combobox-chips]]:py-0 [&_[data-slot=combobox-chips]]:pl-1.5 [&_[data-slot=combobox-chips]]:shadow-none dark:[&_[data-slot=combobox-chips]]:bg-transparent',
  '[&_[data-slot=popover-trigger]]:h-7 [&_[data-slot=popover-trigger]]:border-0 [&_[data-slot=popover-trigger]]:bg-transparent [&_[data-slot=popover-trigger]]:pl-1.5 [&_[data-slot=popover-trigger]]:shadow-none dark:[&_[data-slot=popover-trigger]]:bg-transparent',
);

/**
 * The properties as one row of chips, each changed in place, in the issue page's side-column order; "More properties"
 * opens the ones changed now and then and what is only read: the start date, the stage, previews, who is notified and
 * the dates.
 */
function PropertyChips({
  detail,
  update,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly pageActions: IssuePageActions;
}): ReactElement {
  const { t } = useTranslation();
  const { busy, fields } = useIssuePropertyFields({
    detail,
    update,
    pageActions,
    idPrefix: 'task-prop',
  });
  const chips = fields.filter((field) => CHIP_FIELDS.has(field.key));
  const rest = fields.filter(
    (field) => field.key !== 'status' && !CHIP_FIELDS.has(field.key),
  );
  return (
    <div
      role='group'
      aria-label={t('taskGroups.detail.props.label')}
      className='flex flex-wrap items-center gap-1.5'
      data-testid='task-properties'
    >
      {chips.map((field) =>
        field.key === 'assignToMe' ? (
          <span key={field.key} className='-ml-1'>
            {field.control}
          </span>
        ) : (
          <div key={field.key} className={CHIP} data-property={field.key}>
            {field.htmlFor ? (
              <label
                htmlFor={field.htmlFor}
                className='shrink-0 text-xs text-muted-foreground'
              >
                {field.label}
              </label>
            ) : (
              <span className='shrink-0 text-xs text-muted-foreground'>
                {field.label}
              </span>
            )}
            <div className='flex min-w-0 items-center [&>*]:w-auto'>
              {field.control}
            </div>
          </div>
        ),
      )}
      <MoreProperties detail={detail} pageActions={pageActions} fields={rest} />
      {busy ? (
        <Loader2Icon
          className='size-3.5 animate-spin text-muted-foreground'
          aria-label={t('taskGroups.detail.props.saving')}
        />
      ) : null}
    </div>
  );
}

/** "More properties": the remaining fields with their own controls, who is notified, and when the task changed. */
function MoreProperties({
  detail,
  pageActions,
  fields,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
  readonly fields: readonly IssuePropertyField[];
}): ReactElement {
  const { t, i18n } = useTranslation();
  const wording = useIssuePageWording();
  const viewer = useViewer();
  const [saving, setSaving] = useState(false);
  const subscribed = detail.subscribers.some(
    (subscriber) => subscriber.userId === viewer?.userId,
  );
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className='h-7 gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground'
            data-testid='task-more-properties'
          />
        }
      >
        <SlidersHorizontalIcon data-icon='inline-start' />
        {t('taskGroups.detail.props.more')}
      </PopoverTrigger>
      <PopoverContent align='start' className='w-96 max-w-[calc(100vw-2rem)]'>
        <div className='flex flex-col gap-3'>
          {fields.map((field) => (
            <PropertyRow
              key={field.key}
              label={field.label}
              {...(field.htmlFor ? { htmlFor: field.htmlFor } : {})}
            >
              {field.control}
            </PropertyRow>
          ))}
          <PreviewPreferenceField issueId={detail.id} />
          <div className='border-t' />
          <PropertyRow label={t('issueLive.notifications.title')}>
            <div className='flex items-center justify-between gap-2'>
              {detail.subscribers.length > 0 ? (
                <PeopleAvatars
                  people={detail.subscribers.map((subscriber) => ({
                    id: subscriber.userId,
                    name: subscriber.name,
                    detail: wording.t(
                      `subscribers.reason.${subscriber.reason}`,
                      { defaultValue: subscriber.reason },
                    ),
                  }))}
                  label={t('issueLive.notifications.title')}
                />
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
              {viewer ? (
                <Button
                  variant='outline'
                  size='xs'
                  disabled={saving}
                  data-testid='task-subscribe'
                  onClick={() => {
                    setSaving(true);
                    void pageActions
                      .setFollowing(!subscribed)
                      .catch(() => undefined)
                      .finally(() => setSaving(false));
                  }}
                >
                  {subscribed ? <BellOffIcon /> : <BellIcon />}
                  {subscribed
                    ? t('issueLive.notifications.unsubscribe')
                    : t('issueLive.notifications.subscribe')}
                </Button>
              ) : null}
            </div>
          </PropertyRow>
          <PropertyRow label={wording.detail.dates.created}>
            {dateTime(detail.createdAt, i18n.language)}
          </PropertyRow>
          <PropertyRow label={wording.detail.dates.updated}>
            <span title={dateTime(detail.updatedAt, i18n.language)}>
              {relativeTime(detail.updatedAt, i18n.language)}
            </span>
          </PropertyRow>
        </div>
      </PopoverContent>
    </Popover>
  );
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

/** Copies the issue's own address, from the key in the top row and from "More". */
function useCopyIssueLink(identifier: string): () => void {
  const { t } = useTranslation();
  const toaster = useToaster();
  const href = useHref(`/issues/${encodeURIComponent(identifier)}`);
  return () => {
    const url = new URL(href, window.location.origin).href;
    void navigator.clipboard?.writeText(url).then(
      () =>
        toaster.show({
          type: 'success',
          title: t('taskGroups.detail.linkCopied'),
        }),
      () => undefined,
    );
  };
}

/** The key, in a fixed-width face: pressing it copies the issue's link. */
function CopyKeyButton({
  identifier,
}: {
  readonly identifier: string;
}): ReactElement {
  const { t } = useTranslation();
  const copy = useCopyIssueLink(identifier);
  return (
    <button
      type='button'
      onClick={copy}
      title={t('taskGroups.detail.copyLink')}
      data-testid='task-key'
      className='shrink-0 rounded-sm font-mono text-xs hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
    >
      {identifier}
    </button>
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
  following,
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
        // The key first: always as wide, so it is found at the same place; the project after it, cut when long.
        <span className='ml-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground'>
          <CopyKeyButton identifier={detail.identifier} />
          {detail.project ? (
            <>
              <span aria-hidden>·</span>
              <Link
                to={`/projects/${encodeURIComponent(detail.project.id)}`}
                className='min-w-0 truncate hover:text-foreground hover:underline'
              >
                {detail.project.name}
              </Link>
            </>
          ) : null}
        </span>
      ) : null}
      <span className='ml-auto flex shrink-0 items-center gap-1 pl-2'>
        {detail && update ? (
          <StatusMenu detail={detail} update={update} />
        ) : null}
        {detail ? (
          <FollowToggle
            issueId={detail.id}
            following={following}
            // Borderless and quiet beside the title; a narrow panel shows the star alone.
            className={cn(
              'border-transparent bg-transparent font-normal text-muted-foreground shadow-none hover:text-foreground',
              variant !== 'split' && '[&>span]:sr-only',
            )}
          />
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
  const panel = useChatPanel();
  const copyLink = useCopyIssueLink(detail.identifier);
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
            <DropdownMenuItem onClick={copyLink}>
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
