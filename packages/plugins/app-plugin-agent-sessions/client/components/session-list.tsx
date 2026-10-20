/**
 * The viewer's sessions, newest activity first, grouped by day. A row says what a person needs to know at a glance:
 * the session's title, the work it produced and how that stands, and whether it waits for them. Hovering a row (or
 * pressing E on it) archives it, with a toast to undo. In a panel it fills the panel, and a row shows its session there.
 */
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  LaptopIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import {
  useContext,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router';

import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { Input } from './ui/input.js';
import { Skeleton } from './ui/skeleton.js';

import type { Session } from '../../shared/api.js';
import { useSessions } from '../api.js';
import { AgentSessionsConfigContext, useSessionSurface } from '../config.js';
import { dayGroup, shortTime, type DayGroup } from '../lib/format.js';
import { sessionFacts, type SessionFacts } from '../lib/facts.js';
import { ComputersDialog } from './computers-dialog.js';
import { LinkBar } from './link-bar.js';
import { WaitingCount } from './waiting-count.js';

type Filter = 'all' | 'waiting' | 'active';

const GROUPS: readonly DayGroup[] = ['today', 'yesterday', 'week', 'earlier'];

export function SessionList({
  activeId,
  className,
  rail = false,
  onExpand,
}: {
  readonly activeId: string | undefined;
  readonly className?: string | undefined;
  /** Folded to a narrow rail, to make room for an open record's panel; `onExpand` unfolds it. */
  readonly rail?: boolean;
  readonly onExpand?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  if (rail)
    return (
      <section
        className={cn(
          'hidden h-full w-12 shrink-0 flex-col items-center gap-2 border-r py-3 md:flex',
          className,
        )}
        aria-label={t('list.label')}
        data-testid='session-list-rail'
      >
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('list.expand')}
          title={t('list.expand')}
          onClick={onExpand}
        >
          <PanelLeftOpenIcon />
        </Button>
        <Button
          size='icon-sm'
          aria-label={t('list.new')}
          title={t('list.new')}
          nativeButton={false}
          render={<Link to='/agent-sessions?new' />}
        >
          <PlusIcon />
        </Button>
      </section>
    );
  return <FullSessionList activeId={activeId} className={className} />;
}

function FullSessionList({
  activeId,
  className,
}: {
  readonly activeId: string | undefined;
  readonly className?: string | undefined;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const [archived, setArchived] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [project, setProject] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [computersOpen, setComputersOpen] = useState(false);
  const surface = useSessionSurface();
  const query = useSessions(archived);
  const archive = useArchive();

  const sessions = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );
  const facts = useMemo(
    () =>
      new Map(sessions.map((session) => [session.id, sessionFacts(session)])),
    [sessions],
  );
  const counts = { waiting: 0, active: 0 };
  for (const fact of facts.values()) {
    if (fact.needsMe) counts.waiting += 1;
    if (fact.active) counts.active += 1;
  }
  const needle = search.trim().toLocaleLowerCase();
  const shown = sessions.filter((session) => {
    const fact = facts.get(session.id)!;
    if (filter === 'waiting' && !fact.needsMe) return false;
    if (filter === 'active' && !fact.active) return false;
    if (project !== null && fact.group !== project) return false;
    return !needle || session.title.toLocaleLowerCase().includes(needle);
  });

  return (
    <section
      className={cn(
        '@container/session-list flex h-full min-h-0 w-full shrink-0 flex-col',
        !surface.panel && 'md:w-[264px] md:border-r',
        className,
      )}
      aria-label={t('list.label')}
    >
      <div className='flex flex-col gap-2.5 px-3.5 pt-3.5 pb-2'>
        <div className='flex items-center gap-2'>
          {archived && (
            <Button
              variant='ghost'
              size='icon-sm'
              className='shrink-0'
              aria-label={t('list.back')}
              title={t('list.back')}
              onClick={() => setArchived(false)}
            >
              <ArrowLeftIcon />
            </Button>
          )}
          <h1
            className='min-w-0 flex-1 truncate text-base font-semibold'
            title={archived ? t('list.archived') : t('list.title')}
          >
            {archived ? t('list.archived') : t('list.title')}
          </h1>
          {/* The application's primary button, as "New issue" is: its default size and text. A panel has its own. */}
          {surface.panel ? (
            surface.actions
          ) : (
            <Button
              className='min-w-0 shrink'
              title={t('list.new')}
              nativeButton={false}
              render={<Link to='/agent-sessions?new' />}
            >
              <PlusIcon data-icon='inline-start' />
              <span className='truncate'>{t('list.new')}</span>
            </Button>
          )}
        </div>
        <div className='relative'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
          <Input
            className='bg-card h-8 pl-8 text-base md:text-sm'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('list.search')}
            aria-label={t('list.search')}
          />
        </div>
        {!archived && (
          <div
            className='flex flex-wrap gap-1'
            role='group'
            aria-label={t('list.filter')}
          >
            {(['all', 'waiting', 'active'] as const).map((value) => (
              <button
                key={value}
                type='button'
                aria-pressed={filter === value}
                title={
                  value === 'all'
                    ? t('list.filters.all')
                    : t(`list.filters.${value}`, { count: counts[value] })
                }
                onClick={() => setFilter(value)}
                className={cn(
                  'h-7.5 max-w-full truncate rounded-full border px-2.5 text-xs whitespace-nowrap',
                  filter === value
                    ? 'bg-accent text-accent-foreground border-transparent font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {value === 'all'
                  ? t('list.filters.all')
                  : t(`list.filters.${value}`, { count: counts[value] })}
              </button>
            ))}
            <ProjectFilter
              projects={[
                ...new Set(
                  [...facts.values()].flatMap((fact) =>
                    fact.group ? [fact.group] : [],
                  ),
                ),
              ].sort((a, b) => a.localeCompare(b))}
              value={project}
              onChange={setProject}
            />
          </div>
        )}
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-2 pb-2'>
        {query.isPending ? (
          <div className='flex flex-col gap-2 p-2'>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className='h-12' />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className='text-muted-foreground p-3 text-sm'>
            {sessions.length === 0
              ? archived
                ? t('list.noArchived')
                : t('list.empty')
              : t('list.noMatch')}
          </p>
        ) : (
          GROUPS.map((group) => {
            const rows = shown.filter(
              (session) => dayGroup(session.lastActivityAt) === group,
            );
            if (rows.length === 0) return null;
            return (
              <div key={group}>
                <h2 className='text-muted-foreground px-2.5 pt-3 pb-1 text-xs'>
                  {t(`list.groups.${group}`)}
                </h2>
                {rows.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    facts={facts.get(session.id)!}
                    active={session.id === activeId}
                    locale={i18n.language}
                    onArchive={() => archive(session, !archived)}
                  />
                ))}
              </div>
            );
          })
        )}
        {query.hasNextPage && (
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => void query.fetchNextPage()}
          >
            {t('list.more')}
          </Button>
        )}
      </div>

      <div className='flex items-center gap-1 border-t px-2 py-2'>
        <FooterButton
          title={t('computers.title')}
          onClick={() => setComputersOpen(true)}
        >
          <LaptopIcon className='size-4 shrink-0' />
          <span className='truncate'>{t('computers.title')}</span>
        </FooterButton>
        <FooterButton
          title={t('list.archived')}
          onClick={() => setArchived(true)}
          pressed={archived}
        >
          <ArchiveIcon className='size-4 shrink-0' />
          <span className='truncate'>{t('list.archived')}</span>
        </FooterButton>
        {!archived && (
          <span className='text-muted-foreground ml-auto hidden shrink-0 items-center gap-1 text-xs whitespace-nowrap @min-[360px]/session-list:inline-flex'>
            <kbd className='bg-card rounded-[3px] border px-1 font-sans text-[10.5px]'>
              E
            </kbd>
            {t('list.archive')}
          </span>
        )}
      </div>
      <ComputersDialog open={computersOpen} onOpenChange={setComputersOpen} />
    </section>
  );
}

function SessionRow({
  session,
  facts,
  active,
  locale,
  onArchive,
}: {
  readonly session: Session;
  readonly facts: SessionFacts;
  readonly active: boolean;
  readonly locale: string;
  readonly onArchive: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onOpenSession } = useSessionSurface();
  const SessionMark = useContext(AgentSessionsConfigContext)?.sessionMarks;
  const open = (): void => {
    if (onOpenSession) onOpenSession(session.id);
    else void navigate(`/agent-sessions/${session.id}`);
  };
  const restoring = session.archivedAt !== null;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') open();
    if (
      (event.key === 'e' || event.key === 'E') &&
      !event.metaKey &&
      !event.ctrlKey
    )
      onArchive();
  };
  return (
    <div
      role='link'
      tabIndex={0}
      aria-current={active ? 'page' : undefined}
      onClick={open}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-1.5 rounded-lg px-2.5 pt-2.5 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        active ? 'bg-accent' : 'hover:bg-muted',
      )}
    >
      <div className='flex items-baseline gap-2'>
        {SessionMark && <SessionMark sessionId={session.id} />}
        <span
          className='min-w-0 flex-1 truncate text-sm font-medium'
          title={session.title}
        >
          {session.title}
        </span>
        <span className='text-muted-foreground shrink-0 text-xs whitespace-nowrap tabular-nums group-hover:invisible group-focus-within:invisible'>
          {shortTime(session.lastActivityAt, locale)}
        </span>
      </div>
      {session.waiting && (
        <span className='w-fit max-w-full truncate rounded bg-amber-500/15 px-1.5 text-xs font-medium text-amber-800 dark:text-amber-300'>
          {t('status.permission')}
        </span>
      )}
      <div className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
        {facts.group && (
          <span
            className='text-foreground max-w-[30%] truncate font-medium'
            title={facts.group}
          >
            {facts.group}
          </span>
        )}
        {facts.group && <span aria-hidden>·</span>}
        <span className='truncate'>
          {session.links.length > 0
            ? t('links.count', { count: session.links.length })
            : t('links.none')}
        </span>
        {session.links.length > 0 && (
          <LinkBar links={session.links} className='min-w-4 shrink' />
        )}
        <span className='ml-auto flex shrink-0 items-center gap-1.5'>
          {facts.waitingLinks > 0 && facts.online ? (
            <WaitingCount count={facts.waitingLinks} />
          ) : session.waiting && facts.online ? null : (
            <StatusChip facts={facts} />
          )}
        </span>
      </div>
      <button
        type='button'
        onClick={(event) => {
          event.stopPropagation();
          onArchive();
        }}
        aria-label={restoring ? t('list.restore') : t('list.archive')}
        className='group/archive bg-card text-muted-foreground hover:text-foreground absolute top-2 right-2 hidden h-6 min-w-6 items-center justify-center gap-1 rounded-[5px] border px-1 text-xs group-focus-within:inline-flex group-hover:inline-flex'
      >
        {restoring ? (
          <ArchiveRestoreIcon className='size-3.5' />
        ) : (
          <ArchiveIcon className='size-3.5' />
        )}
        <span className='hidden pr-0.5 group-hover/archive:inline group-focus-visible/archive:inline'>
          {restoring ? t('list.restore') : t('list.archive')}
        </span>
      </button>
    </div>
  );
}

export function StatusChip({
  facts,
}: {
  readonly facts: SessionFacts;
}): ReactElement | null {
  const { t } = useTranslation();
  const chip = 'inline-flex items-center gap-1.5 text-xs whitespace-nowrap';
  if (!facts.online)
    return (
      <span className={cn(chip, 'text-muted-foreground')}>
        <span className='size-2 rounded-full border-[1.5px] border-current' />
        {t('status.offline')}
      </span>
    );
  if (facts.needsMe)
    return (
      <span
        className={cn(chip, 'font-medium text-amber-800 dark:text-amber-300')}
      >
        <span className='size-2 rounded-full bg-amber-400' />
        {t('status.waiting')}
      </span>
    );
  if (facts.active)
    return (
      <span className={cn(chip, 'text-primary font-medium')}>
        <span className='bg-primary size-2 animate-pulse rounded-full' />
        {t('status.active')}
      </span>
    );
  return null;
}

/** Narrows the list to the sessions of one project, when they work for more than one. */
function ProjectFilter({
  projects,
  value,
  onChange,
}: {
  readonly projects: readonly string[];
  readonly value: string | null;
  readonly onChange: (project: string | null) => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (projects.length < 2 && value === null) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-7.5 min-w-0 items-center gap-1 rounded-full border px-2.5 text-xs',
          value === null
            ? 'text-muted-foreground hover:text-foreground'
            : 'bg-accent text-accent-foreground border-transparent font-medium',
        )}
      >
        <span className='max-w-28 truncate'>
          {value ?? t('list.allProjects')}
        </span>
        <ChevronDownIcon className='size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-56'>
        <DropdownMenuRadioGroup
          value={value ?? ''}
          onValueChange={(next: string) => onChange(next || null)}
        >
          <DropdownMenuRadioItem value=''>
            {t('list.allProjects')}
          </DropdownMenuRadioItem>
          {projects.map((name) => (
            <DropdownMenuRadioItem key={name} value={name}>
              {name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FooterButton({
  title,
  pressed,
  onClick,
  children,
}: {
  readonly title: string;
  readonly pressed?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <button
      type='button'
      title={title}
      aria-pressed={pressed}
      onClick={onClick}
      className='text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap transition-colors'
    >
      {children}
    </button>
  );
}

/** Archives or restores a session, with a toast that undoes it. */
function useArchive(): (session: Session, archived: boolean) => void {
  const { t } = useTranslation();
  const api = useApiClient();
  const client = useQueryClient();
  const toaster = useToaster();
  return (session, archived) => {
    const write = async (value: boolean): Promise<void> => {
      await api.request({
        path: `agentSessions/sessions/${encodeURIComponent(session.id)}`,
        method: 'PATCH',
        json: { archived: value },
      });
      await client.invalidateQueries({ queryKey: ['agentSessions'] });
    };
    void write(archived).then(
      () => {
        const id = toaster.show({
          type: 'success',
          title: archived
            ? t('list.archivedToast', { title: session.title })
            : t('list.restoredToast', { title: session.title }),
          action: {
            label: t('list.undo'),
            onClick: () => {
              toaster.close(id);
              void write(!archived);
            },
          },
        });
      },
      () => toaster.show({ type: 'error', title: t('errors.generic') }),
    );
  };
}
