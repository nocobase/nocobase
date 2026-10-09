/**
 * What the agents are doing, as a work queue: one lane per agent, ordered by activity. A lane shows the agent (avatar,
 * name, state, how many of its slots are taken, and whether any runtime could take its work), then its issues in queue
 * order: what runs now (live elapsed time, runtime, last activity), what it takes next (numbered in claim order, each
 * with why it waits), what waits for a person (who, with an action), and a folded list of issues it is merely
 * assigned, each with why nothing goes on and, where the viewer may, a "Start" action. A thin strip on top sums it
 * up. The viewer's issues are marked and those that wait for them highlighted.
 *
 * Purely presentational: the consumer gives the data (`AgentQueueData`), the viewer, the words (`labels`) and where
 * an issue leads, and hears about navigation, "Start" and the "Only mine" switch.
 */
import {
  BotIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  PlayIcon,
  ServerIcon,
  UserRoundIcon,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '#components/ui/avatar';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import { Toggle } from '#components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';
import { cn } from 'cn';

import {
  defaultAgentQueueLabels,
  fill,
  type AgentQueueLabels,
} from './labels.js';
import {
  activityText,
  agentQueueLanes,
  agentQueueTotals,
  elapsed,
  idleText,
  laneState,
  waitingForNames,
  waitView,
  type AgentQueueFormatWait,
  type AgentQueueItem,
  type AgentQueueLane,
} from './model.js';
import type { AgentQueueData, AgentQueueIssue } from './types.js';

export interface AgentQueueProps {
  readonly data: AgentQueueData;
  /** The viewer's user id, so "waiting for you" names them first. */
  readonly viewerId: string | null;
  /** Where an issue leads. */
  readonly issueHref: (issue: AgentQueueIssue) => string;
  /** A plain click on an issue or an action; modifier clicks keep the browser's behaviour for the link. */
  readonly onNavigate: (href: string) => void;
  /** Only the viewer's issues and those that wait for them. */
  readonly onlyMine?: boolean;
  /**
   * Starts the agent's work on an idle issue; "Start" shows on the idle issues the viewer may start (`idle.mayStart`)
   * when given, and the button waits while the returned promise does.
   */
  readonly onStart?: (issue: AgentQueueIssue, agentId: string) => unknown;
  /** Unfolds every lane's idle issues, such as while the page is searched or filtered. */
  readonly expandIdle?: boolean;
  /** Shows the "Only mine" switch when given. */
  readonly onOnlyMineChange?: (onlyMine: boolean) => void;
  /** Something more on the summary strip's end, such as a spinner while it refreshes. */
  readonly extra?: ReactNode;
  readonly labels?: AgentQueueLabels;
  /**
   * Words why a queued run waits, from its reason code and `params`: such as the agents plugin's `formatRunWait` with
   * the page's `t`. The item knows no reason; without this it shows the code.
   */
  readonly formatWait?: AgentQueueFormatWait;
  /** The language durations and times are written in. */
  readonly locale?: string;
  readonly className?: string;
}

/** The current time, every `interval` milliseconds. */
function useNow(interval: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}

/** A live "for how long", ticking every second on its own so the rest of the queue does not re-render. */
function Elapsed({
  since,
  locale,
  className,
}: {
  readonly since: string;
  readonly locale: string | undefined;
  readonly className?: string;
}): ReactElement {
  const now = useNow(1000);
  return (
    <time dateTime={since} className={cn('tabular-nums', className)}>
      {elapsed(since, locale, now)}
    </time>
  );
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

interface Nav {
  readonly issueHref: (issue: AgentQueueIssue) => string;
  readonly onNavigate: (href: string) => void;
}

/** A link that navigates through the consumer on a plain click. */
function NavLink({
  href,
  nav,
  className,
  children,
  ...props
}: {
  readonly href: string;
  readonly nav: Nav;
  readonly className?: string;
  readonly children: ReactNode;
  readonly 'data-issue'?: string;
  readonly 'data-mine'?: boolean;
  readonly 'data-for-me'?: boolean;
}): ReactElement {
  return (
    <a
      href={href}
      className={cn(
        'block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={(event) => {
        if (!plainClick(event)) return;
        event.preventDefault();
        nav.onNavigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/** The viewer's issue: a small mark beside its identifier. */
function MineMark({ label }: { readonly label: string }): ReactElement {
  return (
    <span
      title={label}
      className='inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'
    >
      <UserRoundIcon className='size-2.5' aria-hidden />
      <span className='sr-only'>{label}</span>
    </span>
  );
}

function IssueLine({
  item,
  labels,
  className,
}: {
  readonly item: AgentQueueItem;
  readonly labels: AgentQueueLabels;
  readonly className?: string;
}): ReactElement {
  return (
    <div className={cn('flex min-w-0 items-center gap-1.5', className)}>
      <span className='shrink-0 font-mono text-[11px] text-muted-foreground'>
        {item.issue.identifier}
      </span>
      {item.mine ? <MineMark label={labels.mine} /> : null}
      <span className='truncate text-sm'>{item.issue.title}</span>
    </div>
  );
}

const SectionTitle = ({
  children,
  count,
  dot,
}: {
  readonly children: ReactNode;
  readonly count: number;
  readonly dot: string;
}): ReactElement => (
  <h3 className='flex items-center gap-1.5 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
    <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
    {children}
    <span className='tabular-nums opacity-70'>{count}</span>
  </h3>
);

/** What runs now: the "now" card, apart from the queue below it. */
function RunningCard({
  item,
  labels,
  nav,
  locale,
}: {
  readonly item: AgentQueueItem;
  readonly labels: AgentQueueLabels;
  readonly nav: Nav;
  readonly locale: string | undefined;
}): ReactElement {
  const run = item.entry.run;
  const starting = run !== null && run.status !== 'running';
  const activity = activityText(labels, item);
  return (
    <li>
      <NavLink
        href={nav.issueHref(item.issue)}
        nav={nav}
        data-issue={item.issue.identifier}
        data-mine={item.mine || undefined}
        className='relative overflow-hidden bg-card p-3 shadow-xs ring-1 ring-emerald-500/25 transition-shadow hover:shadow-md dark:ring-emerald-400/20'
      >
        <span
          aria-hidden
          className='absolute inset-y-0 left-0 w-0.5 bg-emerald-500 dark:bg-emerald-400'
        />
        <div className='flex items-center gap-1.5'>
          <span aria-hidden className='relative flex size-2'>
            <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60 dark:bg-emerald-400/60' />
            <span className='relative inline-flex size-2 rounded-full bg-emerald-500 dark:bg-emerald-400' />
          </span>
          <span className='font-mono text-[11px] text-muted-foreground'>
            {item.issue.identifier}
          </span>
          {item.mine ? <MineMark label={labels.mine} /> : null}
          <span className='ml-auto flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300'>
            {starting ? (
              <span className='font-normal text-muted-foreground'>
                {labels.run.starting}
              </span>
            ) : null}
            {run ? <Elapsed since={run.since} locale={locale} /> : null}
          </span>
        </div>
        <p className='mt-1.5 line-clamp-2 text-sm leading-snug font-medium'>
          {item.issue.title}
        </p>
        <div className='mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
          {run?.runnerName ? (
            <span className='inline-flex shrink-0 items-center gap-1'>
              <ServerIcon className='size-3' aria-hidden />
              {run.runnerName}
            </span>
          ) : null}
          {run && run.attempt > 1 ? (
            <span className='shrink-0'>
              {fill(labels.run.attempt, {
                attempt: run.attempt,
                max: run.maxAttempts,
              })}
            </span>
          ) : null}
          <span className='truncate opacity-80' title={activity}>
            {activity}
          </span>
        </div>
      </NavLink>
    </li>
  );
}

/** What the agent takes next: numbered in claim order, joined by a thin line. */
function QueueList({
  lane,
  labels,
  nav,
  locale,
  formatWait,
}: {
  readonly lane: AgentQueueLane;
  readonly labels: AgentQueueLabels;
  readonly nav: Nav;
  readonly locale: string | undefined;
  readonly formatWait: AgentQueueFormatWait | undefined;
}): ReactElement {
  return (
    <ol className='flex flex-col'>
      {lane.next.map((item, index) => {
        const view = waitView(labels, item, lane.agent, formatWait);
        const blocking = view?.blocking === true;
        const hover =
          typeof view?.detail === 'string'
            ? view.detail
            : typeof view?.text === 'string'
              ? view.text
              : undefined;
        const last = index === lane.next.length - 1;
        return (
          <li key={item.issue.id} className='relative'>
            {last ? null : (
              <span
                aria-hidden
                className='absolute top-7 bottom-0 left-[1.0625rem] w-px bg-border'
              />
            )}
            <NavLink
              href={nav.issueHref(item.issue)}
              nav={nav}
              data-issue={item.issue.identifier}
              data-mine={item.mine || undefined}
              className='grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 px-1 py-1.5 hover:bg-background/70 dark:hover:bg-background/40'
            >
              <span className='mt-0.5 flex size-5 items-center justify-center justify-self-center rounded-full bg-background text-[10px] font-medium text-muted-foreground tabular-nums ring-1 ring-border'>
                {index + 1}
              </span>
              <div className='flex min-w-0 flex-col gap-1'>
                <IssueLine item={item} labels={labels} />
                <div className='flex min-w-0 items-center gap-1.5'>
                  {view ? (
                    <Badge
                      variant='secondary'
                      title={hover}
                      className={cn(
                        'h-auto max-w-full min-w-0 justify-start rounded-md bg-muted px-1.5 py-0 text-[11px] font-normal text-muted-foreground',
                        blocking &&
                          'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
                      )}
                    >
                      {blocking ? <CircleAlertIcon aria-hidden /> : null}
                      <span className='truncate'>{view.text}</span>
                    </Badge>
                  ) : null}
                  {item.entry.run ? (
                    <span className='shrink-0 text-[11px] text-muted-foreground/80'>
                      <Elapsed since={item.entry.run.since} locale={locale} />
                    </span>
                  ) : null}
                </div>
              </div>
            </NavLink>
          </li>
        );
      })}
    </ol>
  );
}

/** What waits for a person: who, and an action that leads to where it is decided. */
function WaitingItem({
  item,
  labels,
  nav,
  viewerId,
}: {
  readonly item: AgentQueueItem;
  readonly labels: AgentQueueLabels;
  readonly nav: Nav;
  readonly viewerId: string | null;
}): ReactElement | null {
  const waiting = item.entry.waiting;
  if (!waiting) return null;
  const decide = waiting.path;
  return (
    <li
      data-issue={item.issue.identifier}
      data-for-me={item.forMe || undefined}
      className={cn(
        'flex flex-col gap-1.5 rounded-lg px-2 py-2',
        item.forMe
          ? 'bg-amber-500/10 ring-1 ring-amber-500/25 dark:bg-amber-400/10 dark:ring-amber-400/20'
          : 'bg-background/60 dark:bg-background/30',
      )}
    >
      <NavLink
        href={nav.issueHref(item.issue)}
        nav={nav}
        className='-m-0.5 p-0.5'
      >
        <IssueLine item={item} labels={labels} />
      </NavLink>
      <div className='flex min-w-0 items-center gap-1.5'>
        <Badge
          variant='outline'
          className='h-5 shrink-0 rounded-md px-1.5 text-[11px] font-normal'
        >
          {labels.wait.kinds[waiting.kind]}
        </Badge>
        {item.forMe ? (
          <Badge className='h-5 shrink-0 rounded-md bg-amber-500 px-1.5 text-[11px] text-white dark:bg-amber-400 dark:text-amber-950'>
            {labels.wait.forYou}
          </Badge>
        ) : (
          <span className='truncate text-xs text-muted-foreground'>
            {fill(labels.wait.waitingFor, {
              names: waitingForNames(labels, item, viewerId),
            })}
          </span>
        )}
        <Button
          size='xs'
          variant={item.forMe ? 'default' : 'ghost'}
          className='ml-auto shrink-0'
          nativeButton={false}
          render={
            <a
              href={decide}
              onClick={(event) => {
                if (!plainClick(event)) return;
                event.preventDefault();
                nav.onNavigate(decide);
              }}
            />
          }
        >
          {labels.wait.handle}
          <ChevronRightIcon data-icon='inline-end' />
        </Button>
      </div>
    </li>
  );
}

/** An issue the agent is merely assigned: why nothing goes on, and "Start" where the viewer may. */
function IdleItem({
  item,
  labels,
  nav,
  locale,
  onStart,
}: {
  readonly item: AgentQueueItem;
  readonly labels: AgentQueueLabels;
  readonly nav: Nav;
  readonly locale: string | undefined;
  readonly onStart: AgentQueueProps['onStart'];
}): ReactElement {
  const now = useNow(60_000);
  const [starting, setStarting] = useState(false);
  const idle = item.entry.idle;
  const reason = idleText(labels, item, locale, now);
  return (
    <li className='flex min-w-0 items-center gap-1.5'>
      <NavLink
        href={nav.issueHref(item.issue)}
        nav={nav}
        data-issue={item.issue.identifier}
        className='min-w-0 flex-1 px-1 py-1 hover:bg-background/70 dark:hover:bg-background/40'
      >
        <IssueLine item={item} labels={labels} />
        {reason ? (
          <p
            data-idle-reason={idle?.reason}
            className='truncate pt-0.5 text-xs text-muted-foreground'
          >
            {reason}
          </p>
        ) : null}
      </NavLink>
      {onStart && idle?.reason === 'backlog' ? (
        <span className='ml-auto max-w-24 shrink-0 text-right text-[11px] leading-tight text-muted-foreground'>
          {labels.idle.backlogHint}
        </span>
      ) : onStart && idle?.mayStart ? (
        <Button
          size='xs'
          variant='ghost'
          className='ml-auto shrink-0'
          disabled={starting}
          onClick={() => {
            setStarting(true);
            void Promise.resolve(onStart(item.issue, item.entry.agentId))
              .catch(() => undefined)
              .finally(() => setStarting(false));
          }}
        >
          <PlayIcon data-icon='inline-start' />
          {labels.idle.start}
        </Button>
      ) : null}
    </li>
  );
}

const STATE_DOT: Readonly<Record<ReturnType<typeof laneState>, string>> = {
  working: 'bg-emerald-500 dark:bg-emerald-400',
  queued: 'bg-sky-500 dark:bg-sky-400',
  waiting: 'bg-amber-500 dark:bg-amber-400',
  idle: 'bg-muted-foreground/40',
};

/** The agent's slots: one pip per run it may hold, filled for those it holds. */
function Slots({
  active,
  max,
}: {
  readonly active: number;
  readonly max: number;
}): ReactElement {
  const count = Math.max(1, Math.min(max, 8));
  return (
    <span aria-hidden className='flex gap-0.5'>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 w-2.5 rounded-full',
            index < active
              ? 'bg-emerald-500 dark:bg-emerald-400'
              : 'bg-foreground/10',
          )}
        />
      ))}
    </span>
  );
}

function Lane({
  lane,
  labels,
  nav,
  viewerId,
  locale,
  onStart,
  expandIdle,
  formatWait,
  className,
}: {
  readonly lane: AgentQueueLane;
  readonly labels: AgentQueueLabels;
  readonly formatWait: AgentQueueFormatWait | undefined;
  readonly nav: Nav;
  readonly viewerId: string | null;
  readonly locale: string | undefined;
  readonly onStart: AgentQueueProps['onStart'];
  readonly expandIdle: boolean;
  readonly className?: string;
}): ReactElement {
  const { agent } = lane;
  const state = laneState(lane);
  const [idleOpen, setIdleOpen] = useState(expandIdle);
  // Unfolded, or folded again, when the consumer's wish changes; the viewer's own toggling holds until then.
  const [expandedFor, setExpandedFor] = useState(expandIdle);
  if (expandIdle !== expandedFor) {
    setExpandedFor(expandIdle);
    setIdleOpen(expandIdle);
  }
  const empty =
    lane.running.length + lane.next.length + lane.waiting.length === 0;
  return (
    <section
      data-agent={agent.id}
      data-agent-state={state}
      aria-label={agent.name}
      className={cn(
        'flex min-h-0 w-full shrink-0 flex-col rounded-xl bg-muted/45 md:w-[19rem] dark:bg-muted/25',
        className,
      )}
    >
      <header className='flex items-center gap-2.5 px-3 pt-3 pb-2.5'>
        <Avatar className='size-8 rounded-lg after:rounded-lg'>
          {agent.avatar ? (
            <AvatarImage src={agent.avatar} alt='' className='rounded-lg' />
          ) : null}
          <AvatarFallback className='rounded-lg bg-primary/10 text-xs font-medium text-primary'>
            <BotIcon className='size-4' aria-hidden />
          </AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='flex min-w-0 items-center gap-1.5'>
            <h2 className='truncate text-sm font-semibold'>{agent.name}</h2>
            {agent.archived ? (
              <Badge variant='outline' className='h-4 px-1 text-[10px]'>
                {labels.lane.archived}
              </Badge>
            ) : null}
          </div>
          <div className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
            <span
              aria-hidden
              className={cn('size-1.5 shrink-0 rounded-full', STATE_DOT[state])}
            />
            <span className='truncate'>{labels.lane[state]}</span>
            {agent.online ? null : (
              <span className='inline-flex min-w-0 items-center gap-1 text-amber-700 dark:text-amber-300'>
                <span aria-hidden>·</span>
                <span className='truncate'>{labels.lane.offline}</span>
              </span>
            )}
          </div>
        </div>
        <div
          className='flex shrink-0 flex-col items-end gap-1'
          title={labels.lane.loadHint}
        >
          <span className='text-xs font-medium tabular-nums'>
            {fill(labels.lane.load, {
              active: agent.active,
              max: agent.maxConcurrentRuns,
            })}
          </span>
          <Slots active={agent.active} max={agent.maxConcurrentRuns} />
        </div>
      </header>
      <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-2'>
        {lane.running.length > 0 ? (
          <div data-state='working' className='flex flex-col gap-1.5'>
            <SectionTitle
              count={lane.running.length}
              dot='bg-emerald-500 dark:bg-emerald-400'
            >
              {labels.sections.now}
            </SectionTitle>
            <ul className='flex flex-col gap-2'>
              {lane.running.map((item) => (
                <RunningCard
                  key={item.issue.id}
                  item={item}
                  labels={labels}
                  nav={nav}
                  locale={locale}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {lane.next.length > 0 ? (
          <div data-state='queued' className='flex flex-col gap-1'>
            <SectionTitle
              count={lane.next.length}
              dot='bg-sky-500 dark:bg-sky-400'
            >
              {labels.sections.next}
            </SectionTitle>
            <QueueList
              lane={lane}
              labels={labels}
              nav={nav}
              locale={locale}
              formatWait={formatWait}
            />
          </div>
        ) : null}
        {lane.waiting.length > 0 ? (
          <div
            data-state='waiting'
            className='flex flex-col gap-1.5 border-t border-dashed border-foreground/10 pt-3'
          >
            <SectionTitle
              count={lane.waiting.length}
              dot='bg-amber-500 dark:bg-amber-400'
            >
              {labels.sections.waiting}
            </SectionTitle>
            <ul className='flex flex-col gap-1.5'>
              {lane.waiting.map((item) => (
                <WaitingItem
                  key={item.issue.id}
                  item={item}
                  labels={labels}
                  nav={nav}
                  viewerId={viewerId}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {empty ? (
          <p className='px-1 py-2 text-xs text-muted-foreground'>
            {labels.lane.empty}
          </p>
        ) : null}
        {lane.idle.length > 0 ? (
          <Collapsible
            open={idleOpen}
            onOpenChange={setIdleOpen}
            data-state-section='idle'
            className='mt-auto'
          >
            <CollapsibleTrigger className='flex w-full items-center gap-1 rounded-md px-1 py-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'>
              <ChevronRightIcon
                aria-hidden
                className={cn(
                  'size-3.5 transition-transform',
                  idleOpen && 'rotate-90',
                )}
              />
              {fill(labels.sections.idle, { count: lane.idle.length })}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className='flex flex-col pt-0.5'>
                {lane.idle.map((item) => (
                  <IdleItem
                    key={item.issue.id}
                    item={item}
                    labels={labels}
                    nav={nav}
                    locale={locale}
                    onStart={onStart}
                  />
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  dot,
  label,
  value,
  highlight = false,
}: {
  readonly dot?: string;
  readonly label: string;
  readonly value: ReactNode;
  readonly highlight?: boolean;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5',
        highlight && 'font-medium text-amber-700 dark:text-amber-300',
      )}
    >
      {dot ? (
        <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
      ) : null}
      {label}
      <span
        className={cn(
          'font-medium tabular-nums',
          !highlight && 'text-foreground',
        )}
      >
        {value}
      </span>
    </span>
  );
}

export function AgentQueue({
  data,
  viewerId,
  issueHref,
  onNavigate,
  onlyMine = false,
  onOnlyMineChange,
  onStart,
  expandIdle = false,
  extra,
  labels = defaultAgentQueueLabels,
  formatWait,
  locale,
  className,
}: AgentQueueProps): ReactElement {
  const nav: Nav = { issueHref, onNavigate };
  const lanes = agentQueueLanes(data, { onlyMine });
  const totals = agentQueueTotals(lanes);
  const forMe = onlyMine
    ? totals.waitingForMe
    : agentQueueTotals(agentQueueLanes(data, { onlyMine: true })).waitingForMe;
  const [selected, setSelected] = useState<string | null>(null);
  const current =
    lanes.find((lane) => lane.agent.id === selected) ?? lanes[0] ?? null;
  const { runners } = data.summary;

  return (
    <div
      data-testid='agent-queue'
      className={cn('flex h-full min-h-0 flex-col gap-3', className)}
    >
      <div className='flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground'>
        <Stat
          dot='bg-emerald-500 dark:bg-emerald-400'
          label={labels.summary.running}
          value={totals.running}
        />
        <Stat
          dot='bg-sky-500 dark:bg-sky-400'
          label={labels.summary.queued}
          value={totals.queued}
        />
        <Stat
          dot={
            forMe > 0
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-muted-foreground/40'
          }
          label={labels.summary.waitingForMe}
          value={forMe}
          highlight={forMe > 0}
        />
        <span className='inline-flex shrink-0 items-center gap-1.5'>
          <ServerIcon className='size-3' aria-hidden />
          {labels.summary.runtimes}
          <span className='font-medium text-foreground tabular-nums'>
            {runners.online === 0
              ? labels.summary.noRuntimes
              : fill(labels.summary.runtimesValue, {
                  busy: runners.busy,
                  online: runners.online,
                })}
          </span>
        </span>
        <span className='ml-auto flex items-center gap-2'>
          {extra}
          <span className='hidden text-muted-foreground/70 sm:inline'>
            {fill(labels.summary.updated, {
              time: new Intl.DateTimeFormat(locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }).format(new Date(data.generatedAt)),
            })}
          </span>
          {onOnlyMineChange ? (
            <Toggle
              variant='outline'
              size='sm'
              pressed={onlyMine}
              onPressedChange={onOnlyMineChange}
            >
              <UserRoundIcon data-icon='inline-start' />
              {labels.onlyMine}
            </Toggle>
          ) : null}
        </span>
      </div>
      {data.truncated ? (
        <p className='text-xs text-muted-foreground'>{labels.truncated}</p>
      ) : null}
      {lanes.length === 0 ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-muted/30 p-10 text-center'>
          <BotIcon className='size-6 text-muted-foreground' aria-hidden />
          <p className='text-sm font-medium'>
            {onlyMine ? labels.emptyMineTitle : labels.emptyTitle}
          </p>
          {onlyMine && onOnlyMineChange ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onOnlyMineChange(false)}
            >
              {labels.showAll}
            </Button>
          ) : (
            <p className='max-w-sm text-sm text-muted-foreground'>
              {labels.emptyDescription}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Phones: one lane at a time, picked from a segmented switcher. */}
          <ToggleGroup
            aria-label={labels.agentSwitcher}
            variant='outline'
            size='sm'
            spacing={0}
            className='max-w-full overflow-x-auto md:hidden'
            value={current ? [current.agent.id] : []}
            onValueChange={(values: string[]) => {
              const [next] = values;
              if (next) setSelected(next);
            }}
          >
            {lanes.map((lane) => (
              <ToggleGroupItem
                key={lane.agent.id}
                value={lane.agent.id}
                className='shrink-0 gap-1.5'
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full',
                    STATE_DOT[laneState(lane)],
                  )}
                />
                {lane.agent.name}
                {lane.forMe > 0 ? (
                  <span className='rounded-full bg-amber-500 px-1 text-[10px] text-white tabular-nums dark:bg-amber-400 dark:text-amber-950'>
                    {lane.forMe}
                  </span>
                ) : null}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className='min-h-0 flex-1 overflow-x-auto'>
            <div className='flex h-full min-h-0 gap-3'>
              {lanes.map((lane) => (
                <Lane
                  key={lane.agent.id}
                  lane={lane}
                  labels={labels}
                  nav={nav}
                  viewerId={viewerId}
                  locale={locale}
                  onStart={onStart}
                  expandIdle={expandIdle}
                  formatWait={formatWait}
                  className={cn(
                    lane.agent.id !== current?.agent.id && 'max-md:hidden',
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
