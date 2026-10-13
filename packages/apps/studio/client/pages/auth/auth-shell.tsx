import { resolveAppUrl } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { PmTag } from '@nocobase/app-plugin-projects/client/kit';
import {
  ArrowRightLeft,
  Bot,
  CircleDot,
  GitMerge,
  GitPullRequest,
  Globe,
  MessageSquare,
  Rocket,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AuthSplitLayout } from '@/extensions/nocobase-auth-split-layout/auth-split-layout';
import { cn } from 'cn';

import type { GitCheck } from '../../../shared/git.js';
import {
  IssueStatusBadge,
  type IssueTableColor,
} from '../../components/issue-table.js';
import {
  CheckRow,
  ChecksBadge,
  PullRequestStateBadge,
} from '../../git/pull-requests.js';
import { relativeTime } from '@/extensions/nocobase-inbox/model';

import { useAppIdentity } from './app-identity.js';

type Person = 'alice' | 'ben' | 'chloe' | 'daniel';
type Agent = 'frontend' | 'reviewer';
type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

const STATUS_COLOR: Readonly<Record<Status, IssueTableColor>> = {
  todo: 'blue',
  in_progress: 'yellow',
  in_review: 'purple',
  done: 'green',
};

// Names stay in English in every language; only the wording and issue titles follow the UI language.
const PERSON_NAME: Readonly<Record<Person, string>> = {
  alice: 'Alice Chen',
  ben: 'Ben Carter',
  chloe: 'Chloe Davis',
  daniel: 'Daniel Kim',
};

const AGENT_NAME: Readonly<Record<Agent, string>> = {
  frontend: 'Frontend Agent',
  reviewer: 'Code Review Agent',
};

const AGENT_TOOL: Readonly<Record<Agent, string>> = {
  frontend: 'Claude Code',
  reviewer: 'Codex',
};

const REPO = 'nocobase/nocobase';
const PR = 128;
const RUNNER = 'build-01';

const CHECKS: readonly GitCheck[] = ['lint', 'test', 'build'].map((name) => ({
  kind: 'check',
  name,
  status: 'completed',
  conclusion: 'success',
  url: null,
}));

interface ActivityEvent {
  readonly id: string;
  readonly actor: { readonly person: Person } | { readonly agent: Agent };
  /** The action's locale key under `auth.activity.actions`. */
  readonly action: string;
  readonly issue: 'pm34' | 'pm35';
  /** Minutes before now. */
  readonly ago: number;
  readonly body?:
    'status' | 'pr' | 'merged' | 'comment' | 'preview' | 'release';
  readonly status?: Status;
}

// Sample content in the shape of Studio's own activity: two issues on their way from creation to release.
const EVENTS: readonly ActivityEvent[] = [
  {
    id: 'created',
    actor: { person: 'alice' },
    action: 'created',
    issue: 'pm35',
    ago: 41,
    body: 'status',
    status: 'todo',
  },
  {
    id: 'picked',
    actor: { agent: 'frontend' },
    action: 'statusChanged',
    issue: 'pm34',
    ago: 36,
    body: 'status',
    status: 'in_progress',
  },
  {
    id: 'pr',
    actor: { agent: 'frontend' },
    action: 'prOpened',
    issue: 'pm34',
    ago: 24,
    body: 'pr',
  },
  {
    id: 'review',
    actor: { agent: 'reviewer' },
    action: 'commented',
    issue: 'pm34',
    ago: 19,
    body: 'comment',
  },
  {
    id: 'preview',
    actor: { agent: 'frontend' },
    action: 'previewReady',
    issue: 'pm34',
    ago: 15,
    body: 'preview',
  },
  {
    id: 'approved',
    actor: { person: 'ben' },
    action: 'approved',
    issue: 'pm34',
    ago: 9,
    body: 'status',
    status: 'done',
  },
  {
    id: 'merged',
    actor: { person: 'chloe' },
    action: 'merged',
    issue: 'pm34',
    ago: 6,
    body: 'merged',
  },
  {
    id: 'release',
    actor: { person: 'daniel' },
    action: 'deployApproved',
    issue: 'pm34',
    ago: 2,
    body: 'release',
  },
];

const STAGGER_MS = 600;
// Times are relative to a fixed moment, so rendering stays pure.
const SAMPLE_NOW = Date.UTC(2026, 0, 1);

function Actor({ event }: { readonly event: ActivityEvent }): ReactElement {
  const { t } = useTranslation();
  const agent = 'agent' in event.actor ? event.actor.agent : null;
  const name =
    'agent' in event.actor
      ? AGENT_NAME[event.actor.agent]
      : PERSON_NAME[event.actor.person];
  return (
    <span className='flex min-w-0 items-center gap-2'>
      <Avatar
        size='sm'
        aria-hidden
        className={cn('size-5', agent && 'rounded-md after:rounded-md')}
      >
        <AvatarFallback
          className={cn('text-[0.625rem]', agent && 'rounded-md')}
        >
          {agent ? <Bot className='size-3' /> : name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className='truncate font-medium'>{name}</span>
      {agent ? (
        <span className='shrink-0 truncate text-xs text-muted-foreground'>
          {t('auth.activity.via', { tool: AGENT_TOOL[agent], runner: RUNNER })}
        </span>
      ) : null}
    </span>
  );
}

function EventBody({
  event,
}: {
  readonly event: ActivityEvent;
}): ReactElement | null {
  const { t } = useTranslation();
  const identifier = event.issue === 'pm34' ? 'PM-34' : 'PM-35';
  const status = (value: Status) => (
    <IssueStatusBadge
      status={{
        name: t(`auth.activity.statuses.${value}`),
        color: STATUS_COLOR[value],
      }}
    />
  );
  const issue = (
    <div className='flex min-w-0 items-center gap-2'>
      <span className='shrink-0 font-mono text-xs text-muted-foreground'>
        {identifier}
      </span>
      <span className='truncate'>
        {t(`auth.activity.issues.${event.issue}`)}
      </span>
    </div>
  );
  switch (event.body) {
    case 'status':
      return (
        <div className='flex items-center justify-between gap-3'>
          {issue}
          {event.status ? status(event.status) : null}
        </div>
      );
    case 'pr':
      return (
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='shrink-0 text-xs text-muted-foreground'>{`${REPO}#${PR}`}</span>
            <span className='truncate'>{t('auth.activity.prTitle')}</span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <PullRequestStateBadge state='open' />
            <ChecksBadge ciState='success' />
          </div>
          <ul className='space-y-1'>
            {CHECKS.map((check) => (
              <CheckRow check={check} key={check.name} />
            ))}
          </ul>
        </div>
      );
    case 'merged':
      return (
        <div className='flex items-center justify-between gap-3'>
          <span className='truncate text-xs text-muted-foreground'>{`${REPO}#${PR}`}</span>
          <PullRequestStateBadge state='merged' />
        </div>
      );
    case 'comment':
      return (
        <p className='rounded-md bg-muted px-2.5 py-1.5 text-muted-foreground'>
          {t('auth.activity.comment')}
        </p>
      );
    case 'preview':
      return (
        <div className='flex items-center gap-2'>
          <PmTag tone='green' dot>
            {t('previews.statuses.ready')}
          </PmTag>
          <span className='inline-flex min-w-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-xs'>
            <Globe
              aria-hidden='true'
              className='size-3 shrink-0 text-muted-foreground'
            />
            <span className='truncate'>pm-34.preview.studio.local</span>
          </span>
        </div>
      );
    case 'release':
      return (
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='gap-1'>
            <Rocket aria-hidden='true' />
            v1.4.0
          </Badge>
          <span className='text-xs text-muted-foreground'>
            {t('auth.activity.environment')}
          </span>
        </div>
      );
    default:
      return null;
  }
}

/** The icon on the timeline beside each kind of event. */
const ACTION_ICONS: Readonly<Record<string, LucideIcon>> = {
  created: CircleDot,
  statusChanged: ArrowRightLeft,
  prOpened: GitPullRequest,
  commented: MessageSquare,
  previewReady: Globe,
  approved: ThumbsUp,
  merged: GitMerge,
  deployApproved: Rocket,
};

function ActivityItem({
  event,
  index,
}: {
  readonly event: ActivityEvent;
  readonly index: number;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const identifier = event.issue === 'pm34' ? 'PM-34' : 'PM-35';
  const at = new Date(SAMPLE_NOW - event.ago * 60_000).toISOString();
  const Icon = ACTION_ICONS[event.action] ?? CircleDot;

  return (
    <li
      className='relative grid animate-in grid-cols-[auto_minmax(0,1fr)] gap-3 pb-3 duration-700 fill-mode-both fade-in slide-in-from-bottom-2 motion-reduce:animate-none'
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
    >
      {/* The timeline: a node beside each event, joined by a line down to the next one. */}
      <span
        aria-hidden='true'
        className='absolute top-11 bottom-0 left-4 w-px -translate-x-1/2 bg-foreground/10'
      />
      <span
        aria-hidden='true'
        className='relative mt-2 grid size-8 place-items-center rounded-full border bg-card text-muted-foreground shadow-xs'
      >
        <Icon className='size-4' />
      </span>
      <Card size='sm' className='gap-2 px-3 shadow-xs'>
        <div className='flex items-center justify-between gap-3'>
          <Actor event={event} />
          <span className='shrink-0 text-xs text-muted-foreground'>
            {relativeTime(at, i18n.language, SAMPLE_NOW)}
          </span>
        </div>
        <p className='text-muted-foreground'>
          {t(`auth.activity.actions.${event.action}`, {
            identifier,
            repo: REPO,
            number: PR,
            release: 'v1.4.0',
            environment: t('auth.activity.environment'),
          })}
        </p>
        <EventBody event={event} />
      </Card>
    </li>
  );
}

/** A looping timeline of an AI development team taking one issue to release. Static under reduced motion. */
function ActivityTimeline(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex min-h-0 flex-1 flex-col gap-8 px-10 py-12'>
      <header className='space-y-3'>
        <Badge variant='outline' className='gap-1.5'>
          <span className='relative flex size-1.5'>
            <span className='absolute inset-0 animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none' />
            <span className='relative size-1.5 rounded-full bg-primary' />
          </span>
          {t('auth.activity.live')}
        </Badge>
        <h2 className='text-xl leading-[1.4] font-semibold'>
          {t('auth.activity.heading')}
        </h2>
        <p className='max-w-md text-sm text-muted-foreground'>
          {t('auth.activity.description')}
        </p>
      </header>
      <div
        aria-hidden='true'
        className='min-h-0 flex-1 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]'
      >
        {/* Two copies scroll up by one copy's height, so the loop has no seam. */}
        <div
          className='animate-[auth-activity-scroll_48s_linear_infinite] motion-reduce:animate-none'
          style={{ animationDelay: `${EVENTS.length * STAGGER_MS}ms` }}
        >
          {[0, 1].map((copy) => (
            <ol key={copy} className='max-w-md'>
              {EVENTS.map((event, index) => (
                <ActivityItem
                  event={event}
                  index={copy * EVENTS.length + index}
                  key={event.id}
                />
              ))}
            </ol>
          ))}
        </div>
      </div>
    </div>
  );
}

/** What every guest auth page hands its shell. */
export interface AuthShellProps {
  readonly title: ReactNode;
  readonly description: ReactNode;
  /** The form, or `AuthMethods` with several sign-in methods. */
  readonly children: ReactNode;
}

/**
 * Studio's guest page shell for sign-in, sign-up and password recovery: the UI Library's `auth-split-layout` with the
 * form on the left and, on wide screens, a live activity timeline on the right. The appearance button in the corner is
 * the standalone layout's (`routing/standalone-page-layout.tsx`).
 */
export function AuthShell({
  children,
  description,
  title,
}: AuthShellProps): ReactElement {
  const { t } = useTranslation();
  const { name, version } = useAppIdentity();

  return (
    <AuthSplitLayout
      aside={
        // Out of the flow, so the looping timeline never sets the page's height.
        <div className='absolute inset-0 flex'>
          <ActivityTimeline />
        </div>
      }
      asideLabel={t('auth.activity.heading')}
      className='xl:grid-cols-[3fr_2fr]'
      description={description}
      footer={`${name} · v${version}`}
      logo={
        <>
          <img
            alt=''
            className='dark:hidden'
            src={resolveAppUrl('/assets/logo-mark.png')}
          />
          <img
            alt=''
            className='hidden dark:block'
            src={resolveAppUrl('/assets/logo-mark-dark.png')}
          />
        </>
      }
      name={name}
      title={title}
    >
      <div className='**:data-[slot=button]:h-9 **:data-[slot=input]:h-9'>
        {children}
      </div>
    </AuthSplitLayout>
  );
}
