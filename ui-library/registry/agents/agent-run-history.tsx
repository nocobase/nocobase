/**
 * The runs an agent made on one subject (an issue, say), presented: a side-column panel that never grows the page (the
 * open runs pinned with a live timer and Stop, at most `recent` finished runs one per line, and "View all" opening a
 * dialog of every run filtered by agent and status), the pill that says who is working now, a run's row on an activity
 * line, a run's transcript, and the brief it was given. Purely presentational: the consumer gives the runs, events and
 * brief, and hears about opening, stopping and retrying a run. Every word comes from `labels`, English by default;
 * `{name}`-style placeholders are filled in here.
 */
import {
  BotIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  SquareIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from 'cn';

export type AgentRunHistoryStatus =
  'queued' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentRunHistoryRun {
  readonly id: string;
  readonly agentId: string;
  readonly agentName: string;
  readonly status: AgentRunHistoryStatus;
  /** A stop was asked for and the run has not ended yet. */
  readonly stopping?: boolean;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  /** Why it failed, in the reader's language. */
  readonly failure?: string | null;
}

export interface AgentRunHistoryLabels {
  readonly title: string;
  readonly empty: string;
  readonly status: Readonly<Record<AgentRunHistoryStatus | 'stopping', string>>;
  /** What a run did, on an activity line: `{name}` is the agent. */
  readonly activity: Readonly<Record<AgentRunHistoryStatus, string>>;
  readonly live: { working: string; workingFor: string; queued: string };
  readonly viewTranscript: string;
  readonly stop: string;
  readonly retry: string;
  /** `{count}` is the number of runs. */
  readonly viewAll: string;
  readonly allTitle: string;
  readonly filterAgent: string;
  readonly filterStatus: string;
  readonly allAgents: string;
  readonly allStatuses: string;
  readonly noMatch: string;
}

const defaultAgentRunHistoryLabels: AgentRunHistoryLabels = {
  title: 'Execution log',
  empty: 'No runs yet.',
  status: {
    queued: 'Queued',
    dispatched: 'Dispatched',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    stopping: 'Stopping',
  },
  activity: {
    queued: '{name} was queued',
    dispatched: '{name} is starting',
    running: '{name} started working',
    completed: '{name} completed',
    failed: '{name} failed',
    cancelled: '{name} was stopped',
  },
  live: {
    working: '{name} is working',
    workingFor: '{name} is working · {minutes} min',
    queued: '{name} is queued',
  },
  viewTranscript: 'View transcript',
  stop: 'Stop',
  retry: 'Retry',
  viewAll: 'View all {count}',
  allTitle: 'All runs ({count})',
  filterAgent: 'Agent',
  filterStatus: 'Status',
  allAgents: 'All agents',
  allStatuses: 'All statuses',
  noMatch: 'No runs match these filters.',
};

/** Puts `values` into a label's `{name}` placeholders. */
function fillLabel(
  text: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return text.replace(/\{(\w+)\}/gu, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

const STATUS_TONE: Readonly<Record<AgentRunHistoryStatus, string>> = {
  queued: 'bg-muted text-muted-foreground',
  dispatched: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  running: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-300',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-300',
  cancelled: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

/** Still waiting or working. */
function isRunOpen(run: Pick<AgentRunHistoryRun, 'status'>): boolean {
  return (
    run.status === 'queued' ||
    run.status === 'dispatched' ||
    run.status === 'running'
  );
}

function isRunActive(run: Pick<AgentRunHistoryRun, 'status'>): boolean {
  return run.status === 'dispatched' || run.status === 'running';
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** "3 minutes ago" in `locale`, or "—". */
function relativeTime(iso: string | null | undefined, locale?: string): string {
  const date = parse(iso);
  if (!date) return '—';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size || unit === 'second')
      return format.format(Math.round(seconds / size), unit);
  return '—';
}

/** Date and time in `locale`, or "—". */
function dateTimeText(iso: string | null | undefined, locale?: string): string {
  const date = parse(iso);
  return date
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : '—';
}

/** "1m 05s" between two instants, or null when either is missing. */
function durationText(
  from: string | null | undefined,
  to: string | null | undefined,
): string | null {
  const start = parse(from);
  const end = parse(to);
  if (!start || !end) return null;
  const total = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 1000),
  );
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

/** Seconds since `iso`, refreshed every `everyMs` while mounted. */
function useSecondsSince(iso: string | null, everyMs: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(timer);
  }, [iso, everyMs]);
  const start = parse(iso);
  if (!start) return null;
  return Math.max(0, Math.floor((now - start.getTime()) / 1000));
}

function clock(total: number): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

function plainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** How a run is opened: a link to `runHref(run)`, and `onOpenRun` on a plain click. */
export interface RunOpener {
  readonly runHref?: (run: AgentRunHistoryRun) => string;
  readonly onOpenRun?: (run: AgentRunHistoryRun) => void;
}

function RunLink({
  run,
  opener,
  className,
  label,
  children,
}: {
  readonly run: AgentRunHistoryRun;
  readonly opener: RunOpener;
  readonly className?: string;
  readonly label?: string;
  readonly children: ReactNode;
}): ReactElement {
  const href = opener.runHref?.(run);
  if (href !== undefined)
    return (
      <a
        href={href}
        className={className}
        aria-label={label}
        onClick={(event) => {
          if (!opener.onOpenRun || !plainClick(event)) return;
          event.preventDefault();
          opener.onOpenRun(run);
        }}
      >
        {children}
      </a>
    );
  if (opener.onOpenRun)
    return (
      <button
        type='button'
        className={cn('text-left', className)}
        aria-label={label}
        onClick={() => opener.onOpenRun?.(run)}
      >
        {children}
      </button>
    );
  return <span className={className}>{children}</span>;
}

export function RunStatusBadge({
  run,
  labels = defaultAgentRunHistoryLabels,
}: {
  readonly run: Pick<AgentRunHistoryRun, 'status' | 'stopping'>;
  readonly labels?: AgentRunHistoryLabels;
}): ReactElement {
  const stopping = Boolean(run.stopping) && isRunOpen(run);
  return (
    <Badge
      variant='secondary'
      className={cn(
        'shrink-0 gap-1.5 font-normal',
        stopping
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
          : STATUS_TONE[run.status],
      )}
    >
      <span aria-hidden className='size-1.5 rounded-full bg-current' />
      {stopping ? labels.status.stopping : labels.status[run.status]}
    </Badge>
  );
}

export interface AgentRunHistoryProps extends RunOpener {
  /** Newest first; `undefined` while loading. */
  readonly runs: readonly AgentRunHistoryRun[] | undefined;
  /** Shown in place of the runs when they could not be loaded. */
  readonly error?: ReactNode;
  /** Asks to stop an open run; the consumer confirms it. Without it, no Stop. */
  readonly onStop?: (run: AgentRunHistoryRun) => void;
  /** Beside the title, such as "Clean working directory". */
  readonly actions?: ReactNode;
  /** How many finished runs show before "View all". */
  readonly recent?: number;
  readonly locale?: string;
  readonly labels?: AgentRunHistoryLabels;
  readonly className?: string;
}

export function AgentRunHistory({
  runs,
  error,
  onStop,
  actions,
  recent = 3,
  locale,
  labels = defaultAgentRunHistoryLabels,
  className,
  ...opener
}: AgentRunHistoryProps): ReactElement {
  const [all, setAll] = useState(false);
  const list = runs ?? [];
  const open = list.filter(isRunOpen);
  const finished = list.filter((run) => !isRunOpen(run)).slice(0, recent);
  const openRun: RunOpener = {
    ...(opener.runHref ? { runHref: opener.runHref } : {}),
    onOpenRun: (run) => {
      setAll(false);
      opener.onOpenRun?.(run);
    },
  };

  let content: ReactNode;
  if (error && !runs) content = error;
  else if (!runs) content = <Skeleton className='h-16 w-full' />;
  else if (list.length === 0)
    content = <p className='text-sm text-muted-foreground'>{labels.empty}</p>;
  else
    content = (
      <div className='space-y-2'>
        {open.map((run) => (
          <PinnedRun
            key={run.id}
            run={run}
            opener={openRun}
            locale={locale}
            labels={labels}
            {...(onStop ? { onStop } : {})}
          />
        ))}
        {finished.length > 0 ? (
          <ul>
            {finished.map((run) => (
              <RunLine
                key={run.id}
                run={run}
                opener={openRun}
                locale={locale}
                labels={labels}
              />
            ))}
          </ul>
        ) : null}
        {list.length > open.length + finished.length ? (
          <Button
            variant='link'
            size='xs'
            className='px-0'
            onClick={() => setAll(true)}
          >
            {fillLabel(labels.viewAll, { count: list.length })}
          </Button>
        ) : null}
      </div>
    );

  return (
    <section
      className={cn('space-y-3', className)}
      aria-label={labels.title}
      data-slot='agent-run-history'
    >
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold'>{labels.title}</h2>
        {list.length > 0 ? actions : null}
      </div>
      {content}
      <AllRunsDialog
        open={all}
        onOpenChange={setAll}
        runs={list}
        opener={openRun}
        locale={locale}
        labels={labels}
      />
    </section>
  );
}

function PinnedRun({
  run,
  opener,
  onStop,
  locale,
  labels,
}: {
  readonly run: AgentRunHistoryRun;
  readonly opener: RunOpener;
  readonly locale: string | undefined;
  readonly onStop?: (run: AgentRunHistoryRun) => void;
  readonly labels: AgentRunHistoryLabels;
}): ReactElement {
  const active = isRunActive(run);
  // Only a run that works counts its time; a queued one says when it was queued.
  const seconds = useSecondsSince(
    active ? (run.startedAt ?? run.createdAt) : null,
    1000,
  );
  return (
    <div
      className='flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-1.5'
      data-testid={`run-${run.id}`}
    >
      <RunLink
        run={run}
        opener={opener}
        label={labels.viewTranscript}
        className='flex min-w-0 flex-1 items-center gap-2 rounded p-0.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring'
      >
        <RunStatusBadge run={run} labels={labels} />
        <span className='min-w-0 truncate text-sm font-medium'>
          {run.agentName}
        </span>
        <span
          className='ml-auto shrink-0 font-mono text-xs text-muted-foreground tabular-nums'
          data-testid='run-timer'
        >
          {active ? (
            clock(seconds ?? 0)
          ) : (
            <time
              dateTime={run.createdAt}
              title={dateTimeText(run.createdAt, locale)}
              className='font-sans'
            >
              {relativeTime(run.createdAt, locale)}
            </time>
          )}
        </span>
      </RunLink>
      {onStop ? (
        <Button
          variant='outline'
          size='xs'
          disabled={run.stopping}
          onClick={() => onStop(run)}
        >
          <SquareIcon data-icon='inline-start' />
          {labels.stop}
        </Button>
      ) : null}
    </div>
  );
}

function RunLine({
  run,
  opener,
  locale,
  labels,
}: {
  readonly run: AgentRunHistoryRun;
  readonly opener: RunOpener;
  readonly locale: string | undefined;
  readonly labels: AgentRunHistoryLabels;
}): ReactElement {
  const at = run.finishedAt ?? run.startedAt ?? run.createdAt;
  const duration = durationText(run.startedAt, run.finishedAt);
  return (
    <li data-testid={`run-${run.id}`} title={run.failure ?? undefined}>
      <RunLink
        run={run}
        opener={opener}
        label={labels.viewTranscript}
        className='flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring'
      >
        <span className='min-w-0 flex-1 space-y-0.5'>
          <span className='flex min-w-0 items-center gap-2'>
            <span className='min-w-0 flex-1 truncate text-sm'>
              {run.agentName}
            </span>
            <RunStatusBadge run={run} labels={labels} />
          </span>
          <span className='flex items-center gap-1.5 whitespace-nowrap text-muted-foreground tabular-nums'>
            {duration ? (
              <>
                <span>{duration}</span>
                <span aria-hidden='true'>·</span>
              </>
            ) : null}
            <time dateTime={at} title={dateTimeText(at, locale)}>
              {relativeTime(at, locale)}
            </time>
          </span>
        </span>
      </RunLink>
    </li>
  );
}

const ALL = '__all__';

function AllRunsDialog({
  open,
  onOpenChange,
  runs,
  opener,
  locale,
  labels,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly runs: readonly AgentRunHistoryRun[];
  readonly opener: RunOpener;
  readonly locale: string | undefined;
  readonly labels: AgentRunHistoryLabels;
}): ReactElement {
  const [agentId, setAgentId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const agentItems = [
    { value: ALL, label: labels.allAgents },
    ...[...new Map(runs.map((run) => [run.agentId, run.agentName]))].map(
      ([value, label]) => ({ value, label }),
    ),
  ];
  const statusItems = [
    { value: ALL, label: labels.allStatuses },
    ...[...new Set(runs.map((run) => run.status))].map((value) => ({
      value,
      label: labels.status[value],
    })),
  ];
  const shown = runs.filter(
    (run) =>
      (agentId === ALL || run.agentId === agentId) &&
      (status === ALL || run.status === status),
  );
  const filter = (
    items: readonly { value: string; label: string }[],
    value: string,
    onChange: (value: string) => void,
    label: string,
  ): ReactElement => (
    <Select
      items={items}
      value={value}
      onValueChange={(next: string | null) => onChange(next ?? ALL)}
    >
      <SelectTrigger size='sm' className='min-w-0 flex-1' aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {fillLabel(labels.allTitle, { count: runs.length })}
          </DialogTitle>
        </DialogHeader>
        <div className='flex gap-2'>
          {filter(agentItems, agentId, setAgentId, labels.filterAgent)}
          {filter(statusItems, status, setStatus, labels.filterStatus)}
        </div>
        {shown.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            {labels.noMatch}
          </p>
        ) : (
          <ul
            className='-mx-1 min-h-0 overflow-y-auto'
            aria-label={labels.title}
            data-testid='all-runs'
          >
            {shown.map((run) => (
              <RunLine
                key={run.id}
                run={run}
                opener={opener}
                locale={locale}
                labels={labels}
              />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Who is working on the subject now: the newest open run, with a pulse while it works. Nothing without one. */
export function RunLivePill({
  runs,
  labels = defaultAgentRunHistoryLabels,
  className,
  ...opener
}: RunOpener & {
  readonly runs: readonly AgentRunHistoryRun[] | undefined;
  readonly labels?: AgentRunHistoryLabels;
  readonly className?: string;
}): ReactElement | null {
  const live = runs?.find(isRunOpen);
  const seconds = useSecondsSince(live?.startedAt ?? null, 30_000);
  if (!live) return null;
  const working = isRunActive(live);
  const name = live.agentName;
  const text = !working
    ? fillLabel(labels.live.queued, { name })
    : seconds === null
      ? fillLabel(labels.live.working, { name })
      : fillLabel(labels.live.workingFor, {
          name,
          minutes: Math.floor(seconds / 60),
        });
  return (
    <RunLink
      run={live}
      opener={opener}
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border bg-card py-0.5 pr-2.5 pl-1 text-xs',
        working ? 'border-primary/30 text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'relative inline-flex size-5 shrink-0 items-center justify-center rounded-full',
          working ? 'bg-primary/10' : 'bg-muted',
        )}
        aria-hidden='true'
      >
        {working ? (
          <span className='absolute inset-0 animate-ping rounded-full bg-primary/20 motion-reduce:animate-none' />
        ) : null}
        <BotIcon className='relative size-3' />
      </span>
      <span className='truncate' data-testid='run-live'>
        {text}
      </span>
    </RunLink>
  );
}

/** One run on an activity line: what it did, why it failed, its transcript, and when. */
export function RunActivityRow({
  run,
  locale,
  labels = defaultAgentRunHistoryLabels,
  ...opener
}: RunOpener & {
  readonly run: AgentRunHistoryRun;
  readonly locale?: string;
  readonly labels?: AgentRunHistoryLabels;
}): ReactElement {
  const at = run.finishedAt ?? run.startedAt ?? run.createdAt;
  return (
    <div
      className='flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-1 text-sm text-muted-foreground'
      data-testid={`run-row-${run.id}`}
    >
      {isRunOpen(run) ? (
        <span className='relative flex size-2 shrink-0' aria-hidden='true'>
          <span className='absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none' />
          <span className='relative inline-flex size-2 rounded-full bg-primary' />
        </span>
      ) : (
        <BotIcon className='size-3.5 shrink-0' aria-hidden='true' />
      )}
      <span className='text-foreground'>
        {fillLabel(labels.activity[run.status], { name: run.agentName })}
      </span>
      {run.status === 'failed' && run.failure ? (
        <span className='text-xs text-destructive'>· {run.failure}</span>
      ) : null}
      {opener.runHref || opener.onOpenRun ? (
        <RunLink
          run={run}
          opener={opener}
          className='text-xs underline-offset-4 hover:text-foreground hover:underline'
        >
          {labels.viewTranscript}
        </RunLink>
      ) : null}
      <time
        dateTime={at}
        title={dateTimeText(at, locale)}
        className='ml-auto text-xs'
      >
        {relativeTime(at, locale)}
      </time>
    </div>
  );
}

/** An event of a run's transcript, as an agent runner reports it. */
export interface RunTranscriptEvent {
  readonly seq: number;
  readonly at: string;
  readonly type: string;
  readonly content?: string | undefined;
  readonly tool?: string | undefined;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly meta?: Readonly<Record<string, unknown>> | undefined;
  readonly truncated?: boolean | undefined;
}

export interface RunTranscriptLabels {
  readonly waiting: string;
  readonly empty: string;
  readonly fetchFailed: string;
  readonly expand: string;
  readonly truncated: string;
  readonly events: string;
  /** `{count}` inputs. */
  readonly inputDelivered: string;
  /** `{input}` and `{output}` tokens. */
  readonly tokens: string;
  readonly kinds: Readonly<
    Record<
      | 'text'
      | 'thinking'
      | 'toolUse'
      | 'toolResult'
      | 'allowed'
      | 'denied'
      | 'input'
      | 'checkout'
      | 'status'
      | 'error'
      | 'usage',
      string
    >
  >;
}

const defaultRunTranscriptLabels: RunTranscriptLabels = {
  waiting: 'Waiting for the agent to start…',
  empty: 'This run recorded no events.',
  fetchFailed: 'Unable to fetch new events. Retrying…',
  expand: 'Show all',
  truncated: 'Cut short: the full text was too long to keep.',
  events: 'Run transcript',
  inputDelivered: '{count} input(s) delivered to the agent',
  tokens: '{input} tokens in, {output} out',
  kinds: {
    text: 'Agent',
    thinking: 'Thinking',
    toolUse: 'Tool',
    toolResult: 'Result',
    allowed: 'Allowed',
    denied: 'Denied',
    input: 'Input',
    checkout: 'Checkout',
    status: 'Status',
    error: 'Error',
    usage: 'Usage',
  },
};

function plainText(text: string): ReactNode {
  return <p className='text-sm whitespace-pre-wrap wrap-anywhere'>{text}</p>;
}

export interface RunTranscriptProps {
  /** The heading: the run's state, agent, what started it, its actions. */
  readonly header?: ReactNode;
  /** Lines under the heading: when it was created, how long it took, why it failed, its summary. */
  readonly summary?: ReactNode;
  /** `undefined` while the first page loads. */
  readonly events: readonly RunTranscriptEvent[] | undefined;
  /** The run may still record events. */
  readonly open?: boolean;
  /** The last fetch failed. */
  readonly failed?: boolean;
  /** How an agent's text is drawn; plain text by default. */
  readonly renderMarkdown?: (text: string) => ReactNode;
  readonly locale?: string;
  readonly labels?: RunTranscriptLabels;
}

/**
 * A run's transcript: its heading and summary as the consumer gives them, then every event with a kind label, the
 * content in the form that suits it, and its number and time. It follows the newest event while the reader is at the
 * bottom.
 */
export function RunTranscript({
  header,
  summary,
  events,
  open = false,
  failed = false,
  renderMarkdown,
  locale,
  labels = defaultRunTranscriptLabels,
}: RunTranscriptProps): ReactElement {
  const listRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const count = events?.length ?? 0;
  useEffect(() => {
    const element = listRef.current;
    if (element && pinnedRef.current) element.scrollTop = element.scrollHeight;
  }, [count]);
  const markdown = renderMarkdown ?? plainText;
  return (
    <div className='flex min-h-0 flex-col gap-3' data-testid='run-transcript'>
      {header || summary ? (
        <div className='space-y-1'>
          {header}
          {summary}
        </div>
      ) : null}
      <div
        ref={listRef}
        className='max-h-[60svh] min-h-40 overflow-y-auto rounded-lg border'
        onScroll={(event) => {
          const element = event.currentTarget;
          pinnedRef.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            48;
        }}
      >
        {!events ? (
          <div role='status' className='space-y-2 p-4'>
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-5/6' />
            <Skeleton className='h-5 w-2/3' />
          </div>
        ) : count === 0 ? (
          <p className='p-6 text-center text-sm text-muted-foreground'>
            {open ? labels.waiting : labels.empty}
          </p>
        ) : (
          <ol aria-label={labels.events}>
            {events.map((event) => (
              <RunTranscriptRow
                key={event.seq}
                event={event}
                renderMarkdown={markdown}
                locale={locale}
                labels={labels}
              />
            ))}
          </ol>
        )}
      </div>
      {failed && events ? (
        <p className='text-xs text-destructive'>{labels.fetchFailed}</p>
      ) : null}
    </div>
  );
}

/**
 * A transcript's heading: the run's state and agent, what started it, which attempt it is (`attempt`, shown when the
 * run may be tried more than once), and `actions` at the end.
 */
export function RunHeader({
  run,
  trigger,
  attempt,
  actions,
  labels = defaultAgentRunHistoryLabels,
}: {
  readonly run: AgentRunHistoryRun;
  /** What started the run, in the reader's words. */
  readonly trigger?: string | null;
  /** Such as "attempt 2 of 3". */
  readonly attempt?: string | null;
  readonly actions?: ReactNode;
  readonly labels?: AgentRunHistoryLabels;
}): ReactElement {
  return (
    <div className='flex flex-wrap items-center gap-2' data-testid='run-header'>
      <RunStatusBadge run={run} labels={labels} />
      <span className='inline-flex items-center gap-1.5 font-medium'>
        <BotIcon className='size-4 text-muted-foreground' aria-hidden='true' />
        {run.agentName}
      </span>
      {trigger ? (
        <span className='text-sm text-muted-foreground'>· {trigger}</span>
      ) : null}
      {attempt ? (
        <span className='text-xs text-muted-foreground'>{attempt}</span>
      ) : null}
      {actions ? (
        <span className='ml-auto flex flex-wrap gap-1.5'>{actions}</span>
      ) : null}
    </div>
  );
}

/** Retry for a run that did not complete, Stop for one still open, as the transcript's header offers them. */
export function RunActions({
  run,
  onStop,
  onRetry,
  busy = false,
  labels = defaultAgentRunHistoryLabels,
}: {
  readonly run: Pick<AgentRunHistoryRun, 'status' | 'stopping'>;
  readonly onStop?: () => void;
  readonly onRetry?: () => void;
  readonly busy?: boolean;
  readonly labels?: AgentRunHistoryLabels;
}): ReactElement | null {
  const open = isRunOpen(run);
  const retry = run.status === 'failed' || run.status === 'cancelled';
  if (!(open && onStop) && !(retry && onRetry)) return null;
  return (
    <span className='inline-flex flex-wrap gap-1.5'>
      {open && onStop ? (
        <Button
          variant='outline'
          size='sm'
          disabled={busy || run.stopping}
          onClick={onStop}
        >
          <SquareIcon data-icon='inline-start' />
          {run.stopping ? labels.status.stopping : labels.stop}
        </Button>
      ) : null}
      {retry && onRetry ? (
        <Button variant='outline' size='sm' disabled={busy} onClick={onRetry}>
          <RotateCcwIcon data-icon='inline-start' />
          {labels.retry}
        </Button>
      ) : null}
    </span>
  );
}

const PREVIEW_LIMIT = 280;

function stringify(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) ?? '';
  } catch {
    return '';
  }
}

function metaText(event: RunTranscriptEvent, key: string): string | null {
  const value = event.meta?.[key];
  return typeof value === 'string' && value ? value : null;
}

function metaNumber(event: RunTranscriptEvent, key: string): number | null {
  const value = event.meta?.[key];
  return typeof value === 'number' ? value : null;
}

function firstLine(text: string): string {
  const line = text.trim().split('\n', 1)[0] ?? '';
  return line.length > 200 ? `${line.slice(0, 199)}…` : line;
}

/** The one line that says what a tool call did: the shell command, or the file, pattern, URL or query it was about. */
function toolSummary(input: unknown): string | null {
  if (typeof input === 'string') return firstLine(input) || null;
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const command = record.command ?? record.cmd;
  if (typeof command === 'string' && command.trim())
    return `$ ${firstLine(command)}`;
  if (
    Array.isArray(command) &&
    command.every((part) => typeof part === 'string')
  ) {
    const parts: readonly string[] = command;
    const script =
      parts.length === 3 &&
      /^(ba|z)?sh$/u.test(parts[0] ?? '') &&
      (parts[1] ?? '').startsWith('-')
        ? (parts[2] ?? '')
        : parts.join(' ');
    return script.trim() ? `$ ${firstLine(script)}` : null;
  }
  for (const key of [
    'file_path',
    'filePath',
    'path',
    'pattern',
    'url',
    'query',
    'description',
  ]) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return firstLine(value);
  }
  return null;
}

function CodeBlock({
  text,
  expand,
  preview: showPreview = true,
}: {
  readonly text: string;
  readonly expand: string;
  /** Show the text's start beside the toggle; off when a summary line above already says it. */
  readonly preview?: boolean;
}): ReactElement | null {
  if (!text) return null;
  if (text.length <= PREVIEW_LIMIT && !text.includes('\n'))
    return (
      <pre className='font-mono text-xs leading-5 whitespace-pre-wrap wrap-anywhere text-muted-foreground'>
        {text}
      </pre>
    );
  // The whole text on one line, so a preview never stops at a lone "{" or a blank first line.
  const preview = text.replace(/\s+/gu, ' ').trim().slice(0, PREVIEW_LIMIT);
  return (
    <Collapsible>
      <CollapsibleTrigger className='group flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-sm text-left text-xs leading-5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'>
        <ChevronRightIcon
          className='size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90'
          aria-hidden='true'
        />
        {showPreview ? (
          <span className='min-w-0 flex-1 truncate font-mono group-data-panel-open:hidden'>
            {preview}
          </span>
        ) : null}
        <span className='shrink-0 font-medium group-data-panel-open:hidden'>
          {expand}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className='mt-1 max-h-96 overflow-auto rounded-md bg-muted p-2 font-mono text-xs whitespace-pre-wrap wrap-anywhere'>
          {text}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

const KIND_TONE: Readonly<Record<string, string>> = {
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  grey: 'bg-muted text-muted-foreground',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  red: 'bg-red-500/10 text-red-700 dark:text-red-300',
  green: 'bg-green-500/10 text-green-700 dark:text-green-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

function Kind({
  tone,
  children,
}: {
  readonly tone: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Badge variant='secondary' className={cn('font-normal', KIND_TONE[tone])}>
      {children}
    </Badge>
  );
}

export interface RunTranscriptRowProps {
  readonly event: RunTranscriptEvent;
  /** How an agent's text is drawn; plain text by default. */
  readonly renderMarkdown?: (text: string) => ReactNode;
  readonly locale?: string | undefined;
  readonly labels?: RunTranscriptLabels;
}

/**
 * One event of a transcript as a list item (`<li>`), for a list of one's own, such as the steps of a run in progress:
 * a kind label, the content in the form that suits it, then its number and time.
 */
export function RunTranscriptRow({
  event,
  renderMarkdown,
  locale,
  labels = defaultRunTranscriptLabels,
}: RunTranscriptRowProps): ReactElement {
  const markdown = renderMarkdown ?? plainText;
  let label: ReactElement;
  let body: ReactNode;
  switch (event.type) {
    case 'text':
      label = <Kind tone='blue'>{labels.kinds.text}</Kind>;
      body = markdown(event.content ?? '');
      break;
    case 'thinking':
      label = <Kind tone='grey'>{labels.kinds.thinking}</Kind>;
      body = (
        <p className='text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground italic'>
          {event.content}
        </p>
      );
      break;
    case 'toolUse': {
      label = <Kind tone='violet'>{event.tool ?? labels.kinds.toolUse}</Kind>;
      const summary = toolSummary(event.input ?? event.content);
      body = (
        <>
          {summary ? (
            <p className='font-mono text-xs leading-5 whitespace-pre-wrap wrap-anywhere'>
              {summary}
            </p>
          ) : null}
          <CodeBlock
            text={stringify(event.input ?? event.content)}
            expand={labels.expand}
            preview={!summary}
          />
        </>
      );
      break;
    }
    case 'toolResult':
      label = <Kind tone='grey'>{event.tool ?? labels.kinds.toolResult}</Kind>;
      body = (
        <CodeBlock
          text={stringify(event.output ?? event.content)}
          expand={labels.expand}
        />
      );
      break;
    case 'permission': {
      const denied = metaText(event, 'decision') === 'deny';
      label = (
        <Kind tone={denied ? 'red' : 'green'}>
          {denied ? labels.kinds.denied : labels.kinds.allowed}
        </Kind>
      );
      const reason = metaText(event, 'reason');
      const summary = toolSummary(event.input);
      body = (
        <p className='text-sm wrap-anywhere'>
          <span className='font-medium'>{event.tool ?? '—'}</span>
          {summary ? (
            <span className='ml-2 font-mono text-xs'>{summary}</span>
          ) : null}
          {reason ? (
            <span className='block text-xs text-muted-foreground'>
              {reason}
            </span>
          ) : null}
        </p>
      );
      break;
    }
    case 'input': {
      label = <Kind tone='amber'>{labels.kinds.input}</Kind>;
      const ids = event.meta?.inputIds;
      body = (
        <div className='space-y-1'>
          {event.content ? markdown(event.content) : null}
          <p className='text-xs text-muted-foreground'>
            {fillLabel(labels.inputDelivered, {
              count: Array.isArray(ids) ? ids.length : 1,
            })}
          </p>
        </div>
      );
      break;
    }
    case 'usage': {
      label = <Kind tone='slate'>{labels.kinds.usage}</Kind>;
      const input = metaNumber(event, 'inputTokens');
      const output = metaNumber(event, 'outputTokens');
      body = (
        <p className='text-xs leading-5 text-muted-foreground'>
          {input !== null || output !== null
            ? fillLabel(labels.tokens, {
                input: input ?? 0,
                output: output ?? 0,
              })
            : event.content}
        </p>
      );
      break;
    }
    case 'checkout':
      label = <Kind tone='slate'>{labels.kinds.checkout}</Kind>;
      body = (
        <p className='font-mono text-xs leading-5 wrap-anywhere text-muted-foreground'>
          {event.content}
        </p>
      );
      break;
    case 'error':
      label = <Kind tone='red'>{labels.kinds.error}</Kind>;
      body = (
        <p className='text-sm whitespace-pre-wrap wrap-anywhere text-destructive'>
          {event.content ?? stringify(event.output)}
        </p>
      );
      break;
    default:
      label = <Kind tone='grey'>{labels.kinds.status}</Kind>;
      body = (
        <p className='text-xs leading-5 text-muted-foreground'>
          {event.content}
        </p>
      );
  }
  const at = parse(event.at);
  return (
    <li
      data-type={event.type}
      className={cn(
        'grid grid-cols-[5rem_minmax(0,1fr)_auto] items-start gap-x-3 border-b px-4 py-2 last:border-b-0',
        event.type === 'status' && 'py-1.5',
      )}
    >
      {/* The pill, the content's first line and the meta share one 20px line box. */}
      <div className='flex h-5 min-w-0 items-center [&>*]:max-w-full [&>*]:truncate'>
        {label}
      </div>
      <div className='min-w-0 space-y-1'>
        {body}
        {event.truncated ? (
          <p className='text-xs text-muted-foreground'>{labels.truncated}</p>
        ) : null}
      </div>
      <div className='flex h-5 shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums'>
        <span className='text-muted-foreground/70'>#{event.seq}</span>
        <span aria-hidden='true'>·</span>
        <time dateTime={event.at}>
          {at
            ? new Intl.DateTimeFormat(locale, { timeStyle: 'medium' }).format(
                at,
              )
            : '—'}
        </time>
      </div>
    </li>
  );
}

/** A brief as people read it: titled blocks of text, then a note. */
export function RunBrief({
  sections,
  emptyText = 'Empty',
  note,
}: {
  readonly sections: readonly { key: string; title: string; text: string }[];
  readonly emptyText?: string;
  readonly note?: ReactNode;
}): ReactElement {
  return (
    <div className='space-y-4'>
      {sections.map((section) => (
        <section key={section.key} className='space-y-1.5'>
          <h3 className='text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
            {section.title}
          </h3>
          {section.text.trim() ? (
            <pre className='max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-5 whitespace-pre-wrap'>
              {section.text}
            </pre>
          ) : (
            <p className='text-sm text-muted-foreground'>{emptyText}</p>
          )}
        </section>
      ))}
      {note ? <p className='text-xs text-muted-foreground'>{note}</p> : null}
    </div>
  );
}
