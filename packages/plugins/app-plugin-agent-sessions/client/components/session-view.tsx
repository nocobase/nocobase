/**
 * One session: its header, what it waits for, the work it produced, its transcript and the composer with the agent's
 * choices, and beside it that work in detail, where the session runs and what it has used. A session whose computer is
 * offline, or that is archived, reads as before and takes no new messages.
 */
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  FolderIcon,
  FolderKanbanIcon,
  LaptopIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PanelRightIcon,
  PencilIcon,
  PlayIcon,
  SquareIcon,
  XIcon,
} from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { Input } from './ui/input.js';
import { Skeleton } from './ui/skeleton.js';

import type {
  Computer,
  PromptContent,
  Session,
  SessionLinkIcon,
} from '../../shared/api.js';
import {
  type Mention,
  useAnswer,
  useCancel,
  useChoose,
  useComputers,
  useDecideLinks,
  usePrompt,
  useSession,
  useMarkSeen,
  useTranscript,
  useUpdateSession,
} from '../api.js';
import { LinkOpenContext } from '../config.js';
import { valueName } from '../lib/choices.js';
import { errorText } from '../lib/errors.js';
import { dateTime, shortTime, tokens } from '../lib/format.js';
import { displayPath } from '../lib/paths.js';
import { byIcon, linkIcon, linkNeedsYou } from '../lib/tones.js';
import { StatusIcon } from './status-icon.js';
import { WaitingCount } from './waiting-count.js';
import { foldTranscript, type TranscriptItem } from '../transcript.js';
import { AgentBadge } from './agent-badge.js';
import { BackLink } from './back-link.js';
import { ChoiceMenus } from './choice-menus.js';
import { Composer } from './composer.js';
import { useLinkPanel } from './link-panel.js';
import { LinkBar } from './link-bar.js';
import { LinkName } from './link-name.js';
import { StatusPill } from './status-pill.js';
import { TranscriptView } from './transcript-view.js';

export function SessionView({
  sessionId,
}: {
  readonly sessionId: string;
}): ReactElement {
  const { t } = useTranslation();
  const session = useSession(sessionId);
  const transcript = useTranscript(sessionId);
  useMarkSeen(sessionId, transcript.data?.at(-1)?.seq);
  const computers = useComputers();
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const fit = (): void => {
      const element = viewportRef.current;
      if (!element) return;
      // Mobile keyboards often resize only the visual viewport, leaving the shell's svh unchanged.
      element.style.height =
        window.matchMedia('(max-width: 767px)').matches &&
        viewport.scale === 1 &&
        viewport.height < window.innerHeight
          ? `${Math.max(0, viewport.offsetTop + viewport.height - element.getBoundingClientRect().top)}px`
          : '';
      element.style.setProperty(
        '--agent-session-height',
        `${element.clientHeight}px`,
      );
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
    };
  }, [session.data?.id]);
  // Beside the conversation on a wide screen; on a narrower one it opens over it, when asked for.
  const [details, setDetails] = useState(
    () =>
      typeof window === 'undefined' ||
      window.matchMedia('(min-width: 80rem)').matches,
  );
  const items = useMemo(
    () => foldTranscript(transcript.data ?? []),
    [transcript.data],
  );
  const panel = useLinkPanel(session.data, () => setDetails(true));

  if (session.isError) {
    return (
      <p className='text-muted-foreground p-6 text-sm'>
        {errorText(session.error, t('errors.sessionNotFound'))}
      </p>
    );
  }
  if (!session.data) {
    return (
      <div className='flex flex-col gap-3 p-6'>
        <Skeleton className='h-6 w-64' />
        <Skeleton className='h-24' />
      </div>
    );
  }
  const computer = computers.data?.find(
    (candidate) => candidate.id === session.data.computerId,
  );
  // An open record's panel takes the details' place beside the conversation.
  const showDetails = details && !panel.opened;
  return (
    <LinkOpenContext.Provider value={panel.open}>
      <div ref={viewportRef} className='flex h-full min-h-0'>
        <Conversation
          session={session.data}
          computer={computer}
          items={transcript.data ? items : undefined}
          details={showDetails}
          onToggleDetails={() => {
            if (panel.opened) {
              panel.close();
              setDetails(true);
            } else setDetails(!details);
          }}
          onSummary={() => {
            if (!panel.openSummary()) setDetails(true);
          }}
        />
        {showDetails && (
          <div
            aria-hidden
            className='fixed inset-0 z-40 bg-black/30 xl:hidden'
            onClick={() => setDetails(false)}
          />
        )}
        {showDetails && (
          <Details
            session={session.data}
            computer={computer}
            items={items}
            onClose={() => setDetails(false)}
          />
        )}
        {panel.element}
      </div>
    </LinkOpenContext.Provider>
  );
}

function Conversation({
  session,
  computer,
  items,
  details,
  onToggleDetails,
  onSummary,
}: {
  readonly session: Session;
  readonly computer: Computer | undefined;
  readonly items: readonly TranscriptItem[] | undefined;
  readonly details: boolean;
  readonly onToggleDetails: () => void;
  /** The work summary under the title: opens the record waiting for the viewer, else the details. */
  readonly onSummary: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const toaster = useToaster();
  const prompt = usePrompt(session.id);
  const cancel = useCancel(session.id);
  const answer = useAnswer(session.id);
  const decide = useDecideLinks(session.id);
  const choose = useChoose(session.id);
  const writable = session.archivedAt === null && session.computerOnline;
  const fail = (error: unknown): void =>
    void toaster.show({
      type: 'error',
      title: errorText(error, t('errors.generic')),
    });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const [collapsed, setCollapsed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerChangeRef = useRef<{ height: number; scrollTop: number } | null>(
    null,
  );
  const compensatedResizeRef = useRef<number | null>(null);
  const pendingShrinkRef = useRef<number | null>(null);
  const touchYRef = useRef<number | null>(null);
  const changeHeader = (next: boolean): void => {
    if (!next) pendingShrinkRef.current = null;
    if (next === collapsed || !window.matchMedia('(max-width: 767px)').matches)
      return;
    const header = headerRef.current;
    const scroller = scrollerRef.current;
    if (!header || !scroller) return;
    // Capture before reflow: shrinking the header can already clamp scrollTop at the bottom.
    headerChangeRef.current = {
      height: header.offsetHeight,
      scrollTop: scroller.scrollTop,
    };
    setCollapsed(next);
  };
  // Measure the actual shrink (including a two-line title and wrapping task summary) before paint.
  useLayoutEffect(() => {
    const height = headerRef.current?.offsetHeight;
    const scroller = scrollerRef.current;
    const before = headerChangeRef.current;
    if (height === undefined || !scroller || !before) return;
    const target = before.scrollTop + height - before.height;
    if (collapsed && target < 0) {
      // Restore the expanded header before paint; retry only once native scrolling can pay for the full shrink.
      pendingShrinkRef.current = before.height - height;
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- Restore an unpayable measured shrink before the browser paints.
      setCollapsed(false);
      return;
    }
    // The container resize caused by this header change already preserves the reading position.
    if (height !== before.height)
      compensatedResizeRef.current = scroller.clientHeight;
    scroller.scrollTop = target;
    headerChangeRef.current = null;
    if (collapsed) pendingShrinkRef.current = null;
  }, [collapsed]);
  useEffect(() => {
    const element = scrollerRef.current;
    if (element && pinnedRef.current) element.scrollTop = element.scrollHeight;
  }, [items]);
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const compensatedHeight = compensatedResizeRef.current;
      compensatedResizeRef.current = null;
      if (element.clientHeight === compensatedHeight) return;
      if (pinnedRef.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const send = async (
    content: PromptContent[],
    interrupt: boolean,
    mentions: Mention[],
  ): Promise<void> => {
    try {
      if (interrupt && session.running) await cancel.mutateAsync();
      await prompt.mutateAsync({ content, mentions });
      pinnedRef.current = true;
    } catch (error) {
      fail(error);
      throw error;
    }
  };
  const context = session.state?.context;

  return (
    <section
      className='flex min-w-0 flex-1 flex-col'
      aria-label={session.title}
    >
      <div ref={headerRef} className='shrink-0'>
        <Header
          session={session}
          computer={computer}
          details={details}
          onToggleDetails={onToggleDetails}
          onStop={() => cancel.mutate(undefined, { onError: fail })}
          collapsed={collapsed}
          onShowDetails={onSummary}
        />
      </div>
      {session.archivedAt !== null ? (
        <Banner
          icon={<ArchiveIcon className='size-4' />}
          title={t('session.archived')}
        />
      ) : (
        !session.computerOnline && (
          <Banner
            warning
            icon={<AlertTriangleIcon className='size-4' />}
            title={t('session.offline', {
              computer: computer?.name ?? t('session.removedComputer'),
            })}
            meta={
              computer &&
              t('computers.lastSeen', {
                time: shortTime(computer.lastSeenAt, i18n.language),
              })
            }
            body={t('session.offlineBody')}
          />
        )
      )}
      <div
        ref={scrollerRef}
        className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain'
        onWheel={(event) => {
          if (event.deltaY > 0) changeHeader(true);
          else if (event.currentTarget.scrollTop === 0) changeHeader(false);
        }}
        onTouchStart={(event) => {
          touchYRef.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchMove={(event) => {
          const y = event.touches[0]?.clientY;
          if (y === undefined || touchYRef.current === null) return;
          if (touchYRef.current - y > 8) changeHeader(true);
          else if (
            y - touchYRef.current > 8 &&
            event.currentTarget.scrollTop === 0
          )
            changeHeader(false);
        }}
        onScroll={(event) => {
          const element = event.currentTarget;
          pinnedRef.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
          if (
            pendingShrinkRef.current !== null &&
            element.scrollTop >= pendingShrinkRef.current
          )
            changeHeader(true);
        }}
      >
        <div className='mx-auto max-w-[760px] px-4 pt-5 pb-6 sm:px-6'>
          {items === undefined ? (
            <Skeleton className='h-24' />
          ) : (
            <TranscriptView
              items={items}
              session={session}
              agentName={agentName(session, computer)}
              writable={writable}
              actions={{
                answer: (requestId, optionId) =>
                  answer.mutate({ requestId, optionId }, { onError: fail }),
                decide: (kind, start, skip) =>
                  decide.mutate({ kind, start, skip }, { onError: fail }),
              }}
            />
          )}
          {session.running && !session.waiting && (
            <p className='text-muted-foreground mt-4 flex items-center gap-2 text-xs'>
              <span className='flex gap-[3px]' aria-hidden>
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className='bg-primary size-1.5 animate-pulse rounded-full'
                    style={{ animationDelay: `${dot * 0.2}s` }}
                  />
                ))}
              </span>
              {t('session.working')}
            </p>
          )}
        </div>
      </div>
      <div className='mx-auto w-full max-w-[760px] px-3 pt-2 pb-3 sm:px-6 sm:pb-4'>
        <Composer
          compact
          hints
          placeholder={
            !writable
              ? session.archivedAt
                ? t('composer.archived')
                : t('composer.offline')
              : session.waiting
                ? t('composer.waiting')
                : session.running
                  ? t('composer.busy')
                  : t('composer.placeholder')
          }
          disabled={!writable}
          busy={session.running}
          sending={prompt.isPending}
          commands={session.state?.commands}
          mentions={{ projectId: session.project?.id ?? null }}
          toolbar={
            <ChoiceMenus
              choices={session.state?.choices}
              disabled={!writable || choose.isPending}
              onChoose={(choiceId, value) =>
                choose.mutate({ choiceId, value }, { onError: fail })
              }
            />
          }
          trailing={
            context && context.size > 0 ? (
              <ContextRing used={context.used} size={context.size} />
            ) : undefined
          }
          onSend={send}
        />
      </div>
    </section>
  );
}

function Header({
  session,
  computer,
  details,
  onToggleDetails,
  onStop,
  collapsed,
  onShowDetails,
}: {
  readonly session: Session;
  readonly computer: Computer | undefined;
  readonly details: boolean;
  readonly onToggleDetails: () => void;
  readonly onStop: () => void;
  readonly collapsed: boolean;
  readonly onShowDetails: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const update = useUpdateSession(session.id);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(session.title);
  const mode = modeName(session);

  const rename = (): void => {
    setRenaming(false);
    if (title.trim() !== session.title)
      update.mutate({ title: title.trim() || null });
  };

  return (
    <header className='flex flex-col gap-2 border-b px-4 py-2 md:py-3 sm:px-5'>
      <div className='flex min-w-0 items-center gap-2.5'>
        <BackLink />
        {renaming ? (
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={rename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') rename();
              if (event.key === 'Escape') {
                setTitle(session.title);
                setRenaming(false);
              }
            }}
            className='h-9 max-w-md'
            aria-label={t('session.rename')}
          />
        ) : (
          <h2
            title={session.title}
            className={cn(
              'min-w-0 flex-1 text-[15px] font-semibold md:truncate',
              collapsed ? 'truncate' : 'line-clamp-2 break-words',
            )}
          >
            {session.title}
          </h2>
        )}
        {session.waiting ? (
          <span className='max-md:sr-only inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300'>
            <span className='size-2 rounded-full bg-amber-400' />
            {t('session.asking')}
          </span>
        ) : (
          session.running && (
            <span className='max-md:sr-only text-primary inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium'>
              <span className='bg-primary size-2 animate-pulse rounded-full' />
              {t('session.answering')}
            </span>
          )
        )}
        {session.running && session.computerOnline && (
          <Button
            variant='outline'
            size='sm'
            className='h-9 text-xs font-normal'
            aria-label={t('session.stop')}
            onClick={onStop}
          >
            <SquareIcon />
            <span className='max-md:sr-only'>{t('session.stop')}</span>
          </Button>
        )}
        <Button
          variant='ghost'
          size='icon-sm'
          className='text-muted-foreground size-9'
          aria-label={
            details ? t('session.hideDetails') : t('session.showDetails')
          }
          aria-pressed={details}
          onClick={onToggleDetails}
        >
          <PanelRightIcon />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-muted-foreground size-9'
                aria-label={t('session.more')}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => {
                setTitle(session.title);
                setRenaming(true);
              }}
            >
              <PencilIcon />
              {t('session.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                update.mutate({ archived: session.archivedAt === null })
              }
            >
              {session.archivedAt === null ? (
                <ArchiveIcon />
              ) : (
                <ArchiveRestoreIcon />
              )}
              {session.archivedAt === null
                ? t('list.archive')
                : t('list.restore')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] md:overflow-visible',
          collapsed && 'max-md:hidden',
        )}
      >
        <MetaChip>
          <AgentBadge
            agentId={session.agentId}
            name={agentName(session, computer)}
          />
          {agentName(session, computer)}
          {mode && <span className='text-muted-foreground'>{mode}</span>}
        </MetaChip>
        {session.project && (
          <MetaChip>
            <FolderKanbanIcon className='size-4' />
            {session.project.name}
          </MetaChip>
        )}
        <MetaChip>
          <LaptopIcon className='size-4' />
          {computer?.name ?? t('session.removedComputer')}
          <span
            className={cn(
              'size-2 rounded-full',
              session.computerOnline
                ? 'bg-emerald-500'
                : 'border-muted-foreground border-[1.5px]',
            )}
          />
        </MetaChip>
        <MetaChip shrink>
          <FolderIcon className='size-4 shrink-0' />
          <code className='truncate'>
            {displayPath(session.cwd, computer?.home ?? null)}
          </code>
        </MetaChip>
      </div>
      <button
        type='button'
        aria-expanded={details}
        onClick={onShowDetails}
        className='hover:bg-muted focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left text-xs focus-visible:ring-2'
      >
        <ListChecksIcon className='size-4 shrink-0' aria-hidden />
        <span className='shrink-0 font-medium'>
          {t('links.title')} {session.links.length}
        </span>
        {session.links.length === 0 ? (
          <span className='text-muted-foreground'>{t('links.none')}</span>
        ) : (
          <Legend session={session} />
        )}
      </button>
    </header>
  );
}

function MetaChip({
  shrink,
  children,
}: {
  /** Gives way when the row is narrow, its text cut short. */
  readonly shrink?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span
      className={cn(
        'bg-card inline-flex h-7.5 max-w-full items-center gap-1.5 overflow-hidden rounded-full border px-2.5 text-xs whitespace-nowrap',
        shrink ? 'min-w-0' : 'shrink-0',
      )}
    >
      {children}
    </span>
  );
}

/**
 * Each status of the session's work with how many are in it, its shape as in the bar, then how many wait for the
 * viewer ("Needs you 1").
 */
function Legend({
  session,
  nowrap = false,
}: {
  readonly session: Session;
  /** On one line, cut short at the end rather than wrapping, with what waits for the viewer kept at the right. */
  readonly nowrap?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const groups = new Map<string, { icon: SessionLinkIcon; count: number }>();
  for (const link of byIcon(session.links)) {
    const label = link.status?.label ?? t('links.unknown');
    const group = groups.get(label);
    groups.set(label, { icon: linkIcon(link), count: (group?.count ?? 0) + 1 });
  }
  const waiting = session.links.filter(linkNeedsYou).length;
  const items = [...groups].map(([label, { icon, count }]) => (
    <span
      key={label}
      className='inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap'
    >
      <StatusIcon icon={icon} className='size-3' />
      {label} {count}
    </span>
  ));
  if (nowrap)
    return (
      <span className='text-muted-foreground flex min-w-0 items-center gap-3 text-xs'>
        <span className='flex min-w-0 flex-1 items-center gap-x-3 overflow-hidden'>
          {items}
        </span>
        {waiting > 0 && <WaitingCount count={waiting} />}
      </span>
    );
  return (
    <span className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
      {items}
      {waiting > 0 && <WaitingCount count={waiting} />}
    </span>
  );
}

function Details({
  session,
  computer,
  items,
  onClose,
}: {
  readonly session: Session;
  readonly computer: Computer | undefined;
  readonly items: readonly TranscriptItem[];
  readonly onClose: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const decide = useDecideLinks(session.id);
  const toaster = useToaster();
  const context = session.state?.context;
  const used = usage(items);
  const mode = modeName(session);
  const agentVersion = computer?.agents.find(
    (agent) => agent.id === session.agentId,
  )?.version;
  return (
    <aside
      className='bg-background fixed inset-y-0 right-0 z-50 w-[min(100%,22rem)] overflow-y-auto border-l shadow-xl xl:static xl:z-auto xl:w-[296px] xl:shrink-0 xl:shadow-none'
      aria-label={t('session.details')}
    >
      <div className='flex items-center justify-between border-b px-5 py-3 xl:hidden'>
        <h2 className='text-[15px] font-semibold'>{t('session.details')}</h2>
        <button
          type='button'
          aria-label={t('actions.close')}
          onClick={onClose}
          className='text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-md'
        >
          <XIcon className='size-5' />
        </button>
      </div>
      <DetailSection
        title={
          <>
            <ListChecksIcon className='size-4' />
            {t('links.title')}
            <span className='text-muted-foreground font-medium tabular-nums'>
              {session.links.length}
            </span>
          </>
        }
      >
        {session.links.length === 0 ? (
          <p className='text-muted-foreground text-xs'>{t('links.empty')}</p>
        ) : (
          <>
            {/* The work at a glance: its bar, then its statuses on one line. */}
            <div className='flex flex-col gap-1.5'>
              <LinkBar links={session.links} className='h-2.5 w-full' />
              <Legend session={session} nowrap />
            </div>
            <ul className='flex flex-col gap-2'>
              {session.links.map((link) => (
                <li
                  key={`${link.kind}:${link.refId}`}
                  className='bg-card flex flex-col gap-1.5 rounded-lg border px-3 py-2.5'
                >
                  {/* The title on its own line; below, the key, and the status at the right, as every card has it. */}
                  <LinkName link={link} title className='font-medium' />
                  <div className='flex min-w-0 items-center gap-2'>
                    {link.key && (
                      <span className='text-muted-foreground font-mono text-xs'>
                        {link.key}
                      </span>
                    )}
                    {link.status && (
                      <span className='ml-auto'>
                        <StatusPill status={link.status} compact />
                      </span>
                    )}
                  </div>
                  {link.startable && session.archivedAt === null && (
                    <div className='text-muted-foreground flex items-center gap-2 text-[11px]'>
                      {t('links.notStarted')}
                      <Button
                        size='xs'
                        variant='outline'
                        className='ml-auto h-7.5 font-normal'
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate(
                            {
                              kind: link.kind,
                              start: [link.refId],
                              skip: [],
                            },
                            {
                              onError: (error) =>
                                toaster.show({
                                  type: 'error',
                                  title: errorText(error, t('errors.generic')),
                                }),
                            },
                          )
                        }
                      >
                        <PlayIcon />
                        {t('links.startOne')}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </DetailSection>
      <DetailSection title={t('session.about')}>
        <dl className='grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
          <dt className='text-muted-foreground'>{t('session.computer')}</dt>
          <dd className='flex min-w-0 items-center gap-1.5'>
            <span className='truncate'>
              {computer?.name ?? t('session.removedComputer')}
            </span>
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                session.computerOnline
                  ? 'bg-emerald-500'
                  : 'border-muted-foreground border-[1.5px]',
              )}
            />
          </dd>
          <dt className='text-muted-foreground'>{t('session.agent')}</dt>
          <dd>
            {agentName(session, computer)}{' '}
            {agentVersion && (
              <span className='text-muted-foreground'>{agentVersion}</span>
            )}
          </dd>
          {mode && (
            <>
              <dt className='text-muted-foreground'>{t('session.mode')}</dt>
              <dd>{mode}</dd>
            </>
          )}
          {session.project && (
            <>
              <dt className='text-muted-foreground'>{t('session.project')}</dt>
              <dd>{session.project.name}</dd>
            </>
          )}
          <dt className='text-muted-foreground'>{t('session.directory')}</dt>
          <dd>
            <code className='break-all'>
              {displayPath(session.cwd, computer?.home ?? null)}
            </code>
          </dd>
          <dt className='text-muted-foreground'>{t('session.started')}</dt>
          <dd>{dateTime(session.createdAt, i18n.language)}</dd>
        </dl>
      </DetailSection>
      {(context || used) && (
        <DetailSection title={t('session.usage')}>
          {context && context.size > 0 && (
            <>
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>
                  {t('session.contextLabel')}
                </span>
                <span className='tabular-nums'>
                  {tokens(context.used, i18n.language)} /{' '}
                  {tokens(context.size, i18n.language)} ·{' '}
                  {percent(context.used, context.size)}%
                </span>
              </div>
              <div className='bg-muted h-2 overflow-hidden rounded-full border'>
                <div
                  className='bg-primary h-full'
                  style={{
                    width: `${Math.min(100, (context.used / context.size) * 100)}%`,
                  }}
                />
              </div>
            </>
          )}
          {used && (
            <div className='grid grid-cols-3 gap-2'>
              {(
                [
                  ['input', used.input],
                  ['cached', used.cached],
                  ['output', used.output],
                ] as const
              ).map(([name, count]) => (
                <div
                  key={name}
                  className='bg-card rounded-md border px-2.5 py-2'
                >
                  <div className='text-muted-foreground text-[11px]'>
                    {t(`session.tokens.${name}`)}
                  </div>
                  <div className='text-xs font-semibold tabular-nums'>
                    {tokens(count, i18n.language)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {context?.cost && (
            <p className='text-muted-foreground text-xs'>
              {t('session.cost', {
                cost: new Intl.NumberFormat(i18n.language, {
                  style: 'currency',
                  currency: context.cost.currency,
                }).format(context.cost.amount),
              })}
            </p>
          )}
        </DetailSection>
      )}
      <DetailSection title={t('session.record')}>
        <p className='text-muted-foreground text-xs'>
          {t('session.recordBody')}
        </p>
      </DetailSection>
    </aside>
  );
}

function DetailSection({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className='flex flex-col gap-2.5 border-b px-5 py-4'>
      <h3 className='flex items-center gap-1.5 text-sm font-semibold'>
        {title}
      </h3>
      {children}
    </section>
  );
}

function ContextRing({
  used,
  size,
}: {
  readonly used: number;
  readonly size: number;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const circumference = 2 * Math.PI * 6.5;
  const share = Math.min(1, used / size);
  return (
    <span
      className='text-muted-foreground inline-flex shrink-0 items-center gap-1 px-1 text-[11px] tabular-nums'
      title={t('session.context', {
        used: tokens(used, i18n.language),
        size: tokens(size, i18n.language),
      })}
    >
      <svg viewBox='0 0 16 16' className='size-5 -rotate-90' aria-hidden>
        <circle
          cx='8'
          cy='8'
          r='6.5'
          fill='none'
          strokeWidth='2'
          className='stroke-border'
        />
        <circle
          cx='8'
          cy='8'
          r='6.5'
          fill='none'
          strokeWidth='2'
          className='stroke-primary'
          strokeDasharray={`${(share * circumference).toFixed(2)} ${circumference.toFixed(2)}`}
        />
      </svg>
      {percent(used, size)}%
    </span>
  );
}

function Banner({
  icon,
  title,
  meta,
  body,
  warning,
}: {
  readonly icon: ReactElement;
  readonly title: string;
  readonly meta?: string | undefined;
  readonly body?: string;
  readonly warning?: boolean;
}): ReactElement {
  return (
    <div
      className={cn(
        'mx-4 mt-3 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px] sm:mx-5',
        warning
          ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
          : 'bg-card',
      )}
    >
      <span className='mt-0.5'>{icon}</span>
      <div className='min-w-0'>
        <p>
          <span className='font-semibold'>{title}</span>
          {meta && <span className='opacity-80'> · {meta}</span>}
        </p>
        {body && <p className='mt-0.5 opacity-80'>{body}</p>}
      </div>
    </div>
  );
}

/** The agent's name, as its computer knows it. */
function agentName(session: Session, computer: Computer | undefined): string {
  return (
    computer?.agents.find((agent) => agent.id === session.agentId)?.name ??
    session.agentId
  );
}

/** The name of the mode the session is in, when its agent has modes. */
function modeName(session: Session): string | undefined {
  const mode = session.state?.choices.find(
    (choice) => choice.category === 'mode',
  );
  return mode && valueName(mode, mode.currentValue);
}

/** The tokens the session's turns used, added up; undefined before any turn reported its use. */
function usage(
  items: readonly TranscriptItem[],
): { input: number; cached: number; output: number } | undefined {
  let total: { input: number; cached: number; output: number } | undefined;
  for (const item of items) {
    if (item.type !== 'turn' || !item.usage) continue;
    total ??= { input: 0, cached: 0, output: 0 };
    total.input += item.usage.inputTokens;
    total.cached += item.usage.cachedReadTokens ?? 0;
    total.output += item.usage.outputTokens;
  }
  return total;
}

function percent(used: number, size: number): string {
  const share = (used / size) * 100;
  return share < 10 ? share.toFixed(1) : String(Math.round(share));
}
