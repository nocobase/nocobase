/**
 * A new session: which of the viewer's computers, which agent there, which folder and, when the application has
 * projects, which project it works for; the agent's choices; then the first message. Choices are discovered from the
 * installed agent in the selected directory, with the mode the bridge opens sessions in; the first message does not wait
 * for them, and a message sent before they arrive carries only the settings the person chose. The new session's id is
 * chosen with the draft and given to discovery, so the computer keeps the agent it starts for that session's first
 * message instead of starting another. Folders are chosen
 * by browsing the computer, never typed. The computer, agent, folder and project last used are remembered in this
 * browser. Without a connected computer it says how to connect one.
 */
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderKanbanIcon,
  FolderSearchIcon,
  LaptopIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';

import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

import type { AgentInfo, Computer, SessionProject } from '../../shared/api.js';
import {
  useComputers,
  useCreateSession,
  useProjects,
  useSessions,
} from '../api.js';
import { installedAgents, otherAgentNames } from '../lib/agents.js';
import { offeredChoices } from '../lib/choices.js';
import { useChoiceDiscovery } from '../use-choice-discovery.js';
import { errorText } from '../lib/errors.js';
import { shortTime, systemName } from '../lib/format.js';
import { displayPath, isWithin, wholeHome } from '../lib/paths.js';
import { AgentBadge } from './agent-badge.js';
import { BackLink } from './back-link.js';
import { ChoiceMenus } from './choice-menus.js';
import { Composer } from './composer.js';
import { sessionMemoryKey, useSessionMemory } from '../use-session-memory.js';
import { useSubmission } from '../use-submission.js';
import { SubmissionNotice } from './submission-notice.js';
import {
  ComputersDialog,
  ConnectSteps,
  KeepConnected,
  OutdatedBridgeNotice,
} from './computers-dialog.js';
import { FolderBrowser } from './folder-browser.js';

const REMEMBERED = 'nocobase.agentSessions.lastChoice';
/** Where the draft's session id is kept, in the application's memory. */
const SESSION_ID = 'new-session:id';

interface Choice {
  readonly computerId?: string | undefined;
  readonly agentId?: string | undefined;
  readonly cwd?: string | undefined;
  /** An empty string for no project. */
  readonly projectId?: string | undefined;
}

export function NewSession({
  onStart,
  deferDiscovery = false,
}: {
  readonly onStart?: () => void;
  /** Ordinary entry may still open history; do not initialize an unused agent. */
  readonly deferDiscovery?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toaster = useToaster();
  const computers = useComputers();
  const projects = useProjects();
  const recent = useSessions(false);
  const create = useCreateSession();
  const client = useQueryClient();
  const creating =
    useIsMutating({ mutationKey: ['agentSessions', 'createSession'] }) > 0;
  const mountedRef = useRef(true);
  const submission = useSubmission<
    Omit<Parameters<typeof create.mutateAsync>[0], 'submissionId'>
  >('new-session', 'new-session', async (input) => {
    const session = await create.mutateAsync(input);
    if (mountedRef.current) void navigate(`/agent-sessions/${session.id}`);
  });
  // The id the next session is created with (its `submissionId`), replaced once a message was sent with it.
  const [freshSessionId] = useState(() => crypto.randomUUID());
  const [sessionId, setSessionId] = useSessionMemory(
    SESSION_ID,
    freshSessionId,
  );
  const createdRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Replaced only once this page is gone, so the next draft does not discover while the session opens.
      if (createdRef.current)
        client.setQueryData(sessionMemoryKey(SESSION_ID), crypto.randomUUID());
    };
  }, [client]);
  const [computersOpen, setComputersOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>(remembered);
  const sendingRef = useRef(false);

  const all = computers.data ?? [];
  const online = all.filter((computer) => computer.online);
  const computer =
    all.find((candidate) => candidate.id === choice.computerId) ??
    online[0] ??
    all[0];
  if (computer && choice.computerId !== computer.id)
    setChoice({ ...choice, computerId: computer.id });
  const installed = computer ? installedAgents(computer) : [];
  const agents = installed.filter((agent) => !agent.problem);
  const agent =
    agents.find((candidate) => candidate.id === choice.agentId) ?? agents[0];
  const allowed = computer?.folders ?? [];
  const used = (recent.data?.pages ?? [])
    .flatMap((page) => page.data)
    .filter(
      (session) =>
        session.computerId === computer?.id && isWithin(allowed, session.cwd),
    )
    .map((session) => session.cwd);
  const folders = [...new Set([...used, ...allowed])].slice(0, 8);
  const cwd =
    choice.cwd && isWithin(allowed, choice.cwd)
      ? choice.cwd
      : (folders[0] ?? '');
  const project = projects.data?.find(
    (candidate) => candidate.id === choice.projectId,
  );
  const discovery = useChoiceDiscovery(
    JSON.stringify([
      computer?.id,
      agent,
      cwd,
      computer?.folders,
      computer?.roots,
      computer?.home,
      computer?.host,
    ]),
    {
      computerId: computer?.id ?? '',
      agentId: agent?.id ?? '',
      cwd,
      enabled: Boolean(computer?.online && agent && cwd),
      deferred: deferDiscovery,
      sessionId,
    },
  );
  const offered = discovery.displayed?.choices;
  const values = Object.fromEntries(
    (offered ?? []).map((offer) => [
      offer.id,
      discovery.settings[offer.id] ?? offer.currentValue,
    ]),
  );
  const ready = Boolean(computer?.online && agent && cwd);

  const begin = (): void => {
    if (sendingRef.current || creating) return;

    // Keep the current folder when late history offers a different recent folder.
    if (
      computer &&
      agent &&
      cwd &&
      (choice.computerId !== computer.id ||
        choice.agentId !== agent.id ||
        choice.cwd !== cwd)
    )
      setChoice({
        ...choice,
        computerId: computer.id,
        agentId: agent.id,
        cwd,
      });
    onStart?.();
  };

  const pick = (next: Choice): void => {
    if (sendingRef.current || creating) return;
    onStart?.();
    const merged = {
      ...choice,
      computerId: computer?.id,
      agentId: agent?.id,
      cwd,
      ...next,
    };
    setChoice(merged);
    try {
      localStorage.setItem(REMEMBERED, JSON.stringify(merged));
    } catch {
      // Remembering is a convenience; a browser that refuses storage still starts sessions.
    }
  };

  // A remembered or fallback computer can still be selected while every bridge is offline.
  if (computers.data && (!computer || online.length === 0)) {
    return (
      <div className='h-full overflow-y-auto'>
        <div className='mx-auto flex max-w-[560px] flex-col gap-4 px-4 py-10 sm:pt-24'>
          <SubmissionNotice
            pending={submission.pending}
            sending={creating}
            retry={submission.retry}
            edit={submission.edit}
          />
          <div className='flex flex-col items-center gap-2 text-center'>
            <LaptopIcon className='text-muted-foreground size-8' />
            <h2 className='text-[17px] font-semibold'>
              {all.length === 0
                ? t('newSession.noComputer')
                : t('newSession.allOffline')}
            </h2>
            <p className='text-muted-foreground text-sm'>
              {all.length === 0
                ? t('newSession.noComputerHint')
                : t('newSession.offlineHint')}
            </p>
          </div>
          {all
            .filter((candidate) => candidate.outdatedBridge)
            .map((candidate) => (
              <OutdatedBridgeNotice key={candidate.id} computer={candidate} />
            ))}
          <div className='rounded-[10px] border p-4 text-[13px]'>
            {all.length === 0 ? (
              <ConnectSteps />
            ) : (
              <KeepConnected temporary={false} />
            )}
          </div>
          {all.length > 0 && (
            <Button
              variant='outline'
              className='self-center'
              onClick={() => setComputersOpen(true)}
            >
              {t('newSession.manageComputers')}
            </Button>
          )}
          <ComputersDialog
            open={computersOpen}
            onOpenChange={setComputersOpen}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className='flex h-full min-h-0'
      onFocusCapture={(event) => {
        if (event.target.closest('button, [role="button"], [role="combobox"]'))
          begin();
      }}
    >
      <div className='min-w-0 flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-[720px] flex-col gap-4 px-4 pt-3 pb-10 sm:px-6 sm:pt-24'>
          <BackLink />
          <div className='text-center'>
            <h2 className='text-[22px] font-semibold tracking-tight'>
              {t('newSession.title')}
            </h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              {t('newSession.subtitle')}
            </p>
          </div>
          {computer?.outdatedBridge && (
            <OutdatedBridgeNotice computer={computer} />
          )}
          <SubmissionNotice
            pending={submission.pending}
            sending={creating}
            retry={submission.retry}
            edit={submission.edit}
          />
          <Composer
            disabled={submission.pending}
            large
            draftKey='new-session'
            onEdit={begin}
            autoFocus
            placeholder={t('newSession.placeholder')}
            sendDisabled={!ready}
            sending={creating}
            commands={computer && agent ? computer.commands[agent.id] : []}
            mentions={{ projectId: project?.id ?? null }}
            header={
              <div className='contents' inert={creating}>
                <Picker
                  title={computer?.name ?? t('newSession.pickComputer')}
                  label={
                    <>
                      <LaptopIcon className='size-4' />
                      <span className='min-w-0 truncate'>
                        {computer?.name ?? t('newSession.pickComputer')}
                      </span>
                      {computer && (
                        <span
                          className={cn(
                            'size-2 shrink-0 rounded-full',
                            computer.online
                              ? 'bg-emerald-500'
                              : 'bg-muted-foreground',
                          )}
                        />
                      )}
                    </>
                  }
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t('newSession.computers')}
                    </DropdownMenuLabel>
                    {all.map((candidate) => (
                      <PickItem
                        key={candidate.id}
                        checked={candidate.id === computer?.id}
                        disabled={!candidate.online}
                        title={candidate.name}
                        detail={<ComputerStatus computer={candidate} />}
                        onPick={() =>
                          pick({
                            computerId: candidate.id,
                            agentId: undefined,
                            cwd: undefined,
                          })
                        }
                      />
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setComputersOpen(true)}>
                    {t('newSession.manageComputers')}
                  </DropdownMenuItem>
                </Picker>
                <Picker
                  title={agent?.name ?? t('newSession.noAgent')}
                  label={
                    agent ? (
                      <>
                        <AgentBadge agentId={agent.id} name={agent.name} />
                        <span className='min-w-0 truncate'>{agent.name}</span>
                      </>
                    ) : (
                      t('newSession.noAgent')
                    )
                  }
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t('newSession.agents')}
                    </DropdownMenuLabel>
                    {installed.map((candidate) => (
                      <PickItem
                        key={candidate.id}
                        checked={candidate.id === agent?.id}
                        disabled={Boolean(candidate.problem)}
                        title={candidate.name}
                        detail={<AgentStatus agent={candidate} />}
                        onPick={() => pick({ agentId: candidate.id })}
                      />
                    ))}
                  </DropdownMenuGroup>
                </Picker>
                {projects.data && projects.data.length > 0 && (
                  <ProjectPicker
                    projects={projects.data}
                    value={project}
                    onPick={(projectId) => pick({ projectId })}
                  />
                )}
                {computer && (
                  <FolderPicker
                    computer={computer}
                    folders={folders}
                    value={cwd}
                    onPick={(folder) =>
                      pick({ computerId: computer.id, cwd: folder })
                    }
                    onManage={() => setComputersOpen(true)}
                  />
                )}
              </div>
            }
            toolbar={
              <>
                <ChoiceMenus
                  choices={offered}
                  values={values}
                  disabled={creating || !computer?.online}
                  loading={discovery.loading}
                  onChoose={(id, value) => {
                    pick({});
                    discovery.choose(id, value);
                  }}
                />
                <span role='status' className='text-muted-foreground text-xs'>
                  {computer?.outdatedBridge && !computer.online
                    ? t('newSession.settingsOutdated')
                    : !computer?.online
                      ? t('newSession.settingsOffline')
                      : discovery.loading
                        ? t('newSession.settingsLoading')
                        : discovery.error
                          ? errorText(
                              discovery.error,
                              t('newSession.settingsFailed'),
                            )
                          : discovery.result?.status === 'unsupported'
                            ? t('newSession.settingsUnsupported')
                            : discovery.result &&
                                offeredChoices(offered).length === 0
                              ? t('newSession.settingsEmpty')
                              : null}
                </span>
                {discovery.error && (
                  <>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        pick({});
                        discovery.retry();
                      }}
                    >
                      {t('newSession.settingsRetry')}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        pick({});
                        discovery.reset();
                      }}
                    >
                      {t('newSession.settingsReset')}
                    </Button>
                  </>
                )}
              </>
            }
            onSend={async (content, _interrupt, mentions) => {
              onStart?.();
              if (
                !computer ||
                !agent ||
                !ready ||
                sendingRef.current ||
                client.isMutating({
                  mutationKey: ['agentSessions', 'createSession'],
                }) > 0
              )
                throw new Error(t('composer.sending'));
              // With the choices the agent offers here, send each as shown. Before they arrive, or when they are out of
              // date, send only what the person chose: the session checks those before its first prompt, and the agent
              // keeps its own defaults for the rest.
              const settings =
                discovery.result && discovery.isCurrent()
                  ? Object.fromEntries(
                      offeredChoices(offered).map((offer) => [
                        offer.id,
                        values[offer.id] ?? offer.currentValue,
                      ]),
                    )
                  : discovery.settings;
              sendingRef.current = true;
              try {
                await submission.send(
                  {
                    computerId: computer.id,
                    agentId: agent.id,
                    cwd,
                    content,
                    settings,
                    projectId: project?.id ?? null,
                    mentions,
                  },
                  sessionId,
                );
                if (mountedRef.current) createdRef.current = true;
                else setSessionId(crypto.randomUUID());
              } catch (error) {
                // The id belongs to that submission now, which Retry sends again.
                setSessionId(crypto.randomUUID());
                toaster.show({
                  type: 'error',
                  title:
                    error instanceof ApiClientError && error.status < 500
                      ? errorText(error, t('errors.generic'))
                      : t('newSession.sendUnconfirmed'),
                });
                throw error;
              } finally {
                sendingRef.current = false;
              }
            }}
          />
          {computer && agents.length === 0 && <NoAgent computer={computer} />}
          <p className='text-muted-foreground text-center text-xs'>
            {t('newSession.accessHint')}
            <br />
            {t('newSession.modelHint')}
          </p>
        </div>
      </div>
      {computer && (
        <ComputerDetails
          computer={computer}
          onManage={() => setComputersOpen(true)}
        />
      )}
      <ComputersDialog open={computersOpen} onOpenChange={setComputersOpen} />
    </div>
  );
}

/** Where the session works: a folder used before on this computer, or another one found by browsing it. */
function FolderPicker({
  computer,
  folders,
  value,
  onPick,
  onManage,
}: {
  readonly computer: Computer;
  readonly folders: readonly string[];
  readonly value: string;
  readonly onPick: (folder: string) => void;
  /** Opens where the computer's allowed folders are chosen. */
  readonly onManage: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [browsing, setBrowsing] = useState(false);
  return (
    <>
      <Picker
        shrink
        title={value || t('newSession.folder')}
        label={
          <>
            <FolderIcon className='size-4 shrink-0' />
            <code className='min-w-0 flex-1 truncate text-left'>
              {value
                ? displayPath(value, computer.home)
                : t('newSession.folder')}
            </code>
          </>
        }
      >
        {folders.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {t('newSession.recentFolders')}
            </DropdownMenuLabel>
            {folders.map((folder) => (
              <PickItem
                key={folder}
                checked={folder === value}
                title={
                  <code className='text-xs' title={folder}>
                    {displayPath(folder, computer.home)}
                  </code>
                }
                onPick={() => onPick(folder)}
              />
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setBrowsing(true)}>
          <FolderSearchIcon />
          {t('newSession.browseFolders')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManage}>
          <span className='flex flex-col'>
            <span>{t('newSession.manageFolders')}</span>
            <span className='text-muted-foreground text-xs'>
              {computer.defaultFolders
                ? wholeHome(computer)
                  ? t('newSession.foldersDefault')
                  : t('newSession.foldersDefaultRoots')
                : t('newSession.foldersChosen', {
                    count: computer.folders.length,
                  })}
            </span>
          </span>
        </DropdownMenuItem>
      </Picker>
      {browsing && (
        <FolderBrowser
          computer={computer}
          start={value}
          within={computer.folders}
          title={t('newSession.chooseFolder')}
          onClose={() => setBrowsing(false)}
          onPick={(folder) => {
            onPick(folder);
            setBrowsing(false);
          }}
        />
      )}
    </>
  );
}

/** Which of the application's projects the session works for, if any. */
function ProjectPicker({
  projects,
  value,
  onPick,
}: {
  readonly projects: readonly SessionProject[];
  readonly value: SessionProject | undefined;
  readonly onPick: (projectId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Picker
      title={value?.name ?? t('newSession.noProject')}
      label={
        <>
          <FolderKanbanIcon className='size-4' />
          <span
            className={cn(
              'min-w-0 truncate',
              !value && 'text-muted-foreground',
            )}
          >
            {value?.name ?? t('newSession.noProject')}
          </span>
        </>
      }
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t('newSession.project')}</DropdownMenuLabel>
        <PickItem
          checked={!value}
          title={t('newSession.noProject')}
          onPick={() => onPick('')}
        />
        {projects.map((candidate) => (
          <PickItem
            key={candidate.id}
            checked={candidate.id === value?.id}
            title={candidate.name}
            onPick={() => onPick(candidate.id)}
          />
        ))}
      </DropdownMenuGroup>
    </Picker>
  );
}

function Picker({
  title,
  label,
  shrink,
  children,
}: {
  readonly title: string;
  readonly label: ReactNode;
  /** Takes the room the row has left, its label cut short; on a row of its own when that is too little. */
  readonly shrink?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={title}
        className={cn(
          'bg-muted hover:border-foreground/20 aria-expanded:border-foreground/20 inline-flex h-9 max-w-full min-w-0 items-center gap-2 rounded-full border px-3 text-xs whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:shrink-0',
          shrink && 'flex-1 basis-40',
        )}
      >
        {label}
        <ChevronDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-72'>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PickItem({
  checked,
  disabled,
  title,
  detail,
  onPick,
}: {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly title: ReactNode;
  readonly detail?: ReactNode;
  readonly onPick: () => void;
}): ReactElement {
  return (
    <DropdownMenuItem
      disabled={disabled}
      onClick={onPick}
      className='items-start'
      title={typeof title === 'string' ? title : undefined}
    >
      <CheckIcon
        className={cn(
          'text-primary mt-0.5 size-3.5 shrink-0',
          !checked && 'invisible',
        )}
      />
      <span className='flex min-w-0 flex-col'>
        <span className='break-words'>{title}</span>
        {detail && (
          <span className='text-muted-foreground text-xs break-words'>
            {detail}
          </span>
        )}
      </span>
    </DropdownMenuItem>
  );
}

function ComputerStatus({
  computer,
}: {
  readonly computer: Computer;
}): ReactElement {
  const { t, i18n } = useTranslation();
  return (
    <>
      {computer.online
        ? t('computers.online')
        : t('computers.lastSeen', {
            time: shortTime(computer.lastSeenAt, i18n.language),
          })}
    </>
  );
}

function AgentStatus({ agent }: { readonly agent: AgentInfo }): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      {[
        agent.version,
        agent.problem
          ? t(`computers.problems.${agent.problem}`)
          : t('computers.ready'),
      ]
        .filter(Boolean)
        .join(' · ')}
    </>
  );
}

/** Beside a new session: the computer it will run on and the agents there. */
function ComputerDetails({
  computer,
  onManage,
}: {
  readonly computer: Computer;
  readonly onManage: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const others = otherAgentNames(computer, i18n.language);
  return (
    <aside
      className='hidden w-[296px] shrink-0 overflow-y-auto border-l xl:block'
      aria-label={t('newSession.thisComputer')}
    >
      <section className='flex flex-col gap-3 border-b px-5 py-4'>
        <h3 className='flex items-center gap-2 text-xs font-semibold whitespace-nowrap'>
          <LaptopIcon className='size-4' />
          {t('newSession.thisComputer')}
          <span className='text-muted-foreground ml-auto inline-flex items-center gap-1.5 font-normal'>
            <span
              className={cn(
                'size-2 rounded-full',
                computer.online ? 'bg-emerald-500' : 'bg-muted-foreground',
              )}
            />
            {t(computer.online ? 'computers.online' : 'computers.offline')}
          </span>
        </h3>
        <dl className='grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs [&>dt]:whitespace-nowrap [&>dd]:min-w-0 [&>dd]:break-words'>
          <dt className='text-muted-foreground'>{t('computers.name')}</dt>
          <dd className='break-words'>{computer.name}</dd>
          <dt className='text-muted-foreground'>{t('computers.system')}</dt>
          <dd>{systemName(computer)}</dd>
          <dt className='text-muted-foreground'>{t('computers.cli')}</dt>
          <dd className='break-all'>
            <code>{computer.host}</code>
          </dd>
          <dt className='text-muted-foreground'>{t('computers.folders')}</dt>
          <dd className='flex flex-col items-start gap-0.5'>
            {computer.folders.map((folder) => (
              <code key={folder} className='break-all'>
                {displayPath(folder, computer.home)}
              </code>
            ))}
            <button
              type='button'
              onClick={onManage}
              className='text-primary text-xs hover:underline'
            >
              {t('newSession.changeFolders')}
            </button>
          </dd>
        </dl>
      </section>
      <section className='flex flex-col gap-2 border-b px-5 py-4'>
        <h3 className='text-xs font-semibold'>
          {t('newSession.availableAgents')}
        </h3>
        <ul className='divide-y'>
          {installedAgents(computer).map((agent) => (
            <li
              key={agent.id}
              className='flex items-center gap-2.5 py-2 text-xs'
            >
              <AgentBadge agentId={agent.id} name={agent.name} large />
              <span className='min-w-0 flex-1'>
                <span className='block truncate' title={agent.name}>
                  {agent.name}
                </span>
                <span className='text-muted-foreground block text-[11px] break-all'>
                  {agent.version ?? '—'}
                </span>
              </span>
              {agent.problem ? (
                <span className='text-muted-foreground shrink-0 text-[11px] whitespace-nowrap'>
                  {t(`computers.problems.${agent.problem}`)}
                </span>
              ) : (
                <span className='inline-flex shrink-0 items-center gap-1 text-[11px] whitespace-nowrap text-emerald-700 dark:text-emerald-400'>
                  <CheckIcon className='size-3.5' />
                  {t('computers.ready')}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className='text-muted-foreground text-xs'>
          {t('newSession.agentsHint')}
        </p>
        {/* With none installed, the notice beside the message box names them. */}
        {others && installedAgents(computer).length > 0 && (
          <p className='text-muted-foreground text-xs'>
            {t('newSession.alsoSupported', { names: others })}
          </p>
        )}
      </section>
      <section className='px-5 py-4'>
        <Button
          variant='outline'
          size='sm'
          className='max-w-full min-w-0 font-normal'
          title={t('newSession.manageComputers')}
          onClick={onManage}
        >
          <LaptopIcon />
          <span className='truncate'>{t('newSession.manageComputers')}</span>
        </Button>
      </section>
    </aside>
  );
}

function remembered(): Choice {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(REMEMBERED) ?? '{}');
    if (!value || typeof value !== 'object') return {};
    const field = (name: keyof Choice): Choice => {
      const saved = (value as Record<string, unknown>)[name];
      return typeof saved === 'string' ? { [name]: saved } : {};
    };
    return {
      ...field('computerId'),
      ...field('agentId'),
      ...field('cwd'),
      ...field('projectId'),
    };
  } catch {
    return {};
  }
}

/** Why no agent can start a session on the computer, and how one comes to: installed and signed in there. */
function NoAgent({ computer }: { readonly computer: Computer }): ReactElement {
  const { t, i18n } = useTranslation();
  const failed = installedAgents(computer).filter((agent) => agent.problem);
  const others = otherAgentNames(computer, i18n.language);
  return (
    <div className='flex flex-col gap-1.5 rounded-[10px] border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[13px]'>
      <p className='font-medium'>{t('newSession.noAgentTitle')}</p>
      {failed.map((agent) => (
        <p key={agent.id} className='text-muted-foreground text-xs break-words'>
          {t('newSession.failedAgent', {
            name: agent.name,
            detail: agent.detail ?? t('computers.problems.failed'),
          })}
        </p>
      ))}
      <p className='text-muted-foreground text-xs'>
        {t('newSession.noAgentHint')}
      </p>
      {others && (
        <p className='text-muted-foreground text-xs'>
          {t('newSession.supported', { names: others })}
        </p>
      )}
    </div>
  );
}
