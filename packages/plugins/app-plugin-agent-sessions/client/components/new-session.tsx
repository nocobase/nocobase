/**
 * A new session: which of the viewer's computers, which agent there, which folder and, when the application has
 * projects, which project it works for; the agent's choices; then the first message. The choices start from what the
 * agent offered in its latest session on that computer, with the mode the bridge opens sessions in. Folders are chosen
 * by browsing the computer, never typed. The computer, agent, folder and project last used are remembered in this
 * browser. Without a connected computer it says how to connect one.
 */
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderKanbanIcon,
  FolderSearchIcon,
  LaptopIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
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
import { offeredChoices } from '../lib/choices.js';
import { errorText } from '../lib/errors.js';
import { shortTime, systemName } from '../lib/format.js';
import { displayPath, isWithin, wholeHome } from '../lib/paths.js';
import { AgentBadge } from './agent-badge.js';
import { BackLink } from './back-link.js';
import { ChoiceMenus } from './choice-menus.js';
import { Composer } from './composer.js';
import { ComputersDialog } from './computers-dialog.js';
import { FolderBrowser } from './folder-browser.js';

const REMEMBERED = 'nocobase.agentSessions.lastChoice';

interface Choice {
  readonly computerId?: string | undefined;
  readonly agentId?: string | undefined;
  readonly cwd?: string | undefined;
  /** An empty string for no project. */
  readonly projectId?: string | undefined;
}

export function NewSession(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toaster = useToaster();
  const computers = useComputers();
  const projects = useProjects();
  const recent = useSessions(false);
  const create = useCreateSession();
  const [computersOpen, setComputersOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>(remembered);
  const [picked, setPicked] = useState<Readonly<Record<string, string>>>({});

  const all = computers.data ?? [];
  const online = all.filter((computer) => computer.online);
  const computer =
    online.find((candidate) => candidate.id === choice.computerId) ?? online[0];
  const agents = computer?.agents.filter((agent) => !agent.problem) ?? [];
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
  const offered = computer && agent ? computer.choices[agent.id] : undefined;
  const values = { ...initialValues(offered, agent), ...picked };

  const pick = (next: Choice): void => {
    const merged = { ...choice, ...next };
    setChoice(merged);
    if (next.computerId !== undefined || next.agentId !== undefined)
      setPicked({});
    try {
      localStorage.setItem(REMEMBERED, JSON.stringify(merged));
    } catch {
      // Remembering is a convenience; a browser that refuses storage still starts sessions.
    }
  };

  if (computers.data && online.length === 0) {
    return (
      <div className='mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-3 px-6 pb-20 text-center'>
        <LaptopIcon className='text-muted-foreground size-8' />
        <h2 className='text-[17px] font-semibold'>
          {all.length === 0
            ? t('newSession.noComputer')
            : t('newSession.allOffline')}
        </h2>
        <p className='text-muted-foreground text-sm'>
          {t('newSession.connectHint')}
        </p>
        <Button className='mt-2' onClick={() => setComputersOpen(true)}>
          {t('newSession.connect')}
        </Button>
        <ComputersDialog open={computersOpen} onOpenChange={setComputersOpen} />
      </div>
    );
  }

  return (
    <div className='flex h-full min-h-0'>
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
          <Composer
            large
            autoFocus
            placeholder={t('newSession.placeholder')}
            disabled={!computer || !agent || !cwd}
            sending={create.isPending}
            commands={computer && agent ? computer.commands[agent.id] : []}
            mentions={{ projectId: project?.id ?? null }}
            header={
              <>
                <Picker
                  label={
                    <>
                      <LaptopIcon className='size-4' />
                      {computer?.name ?? t('newSession.pickComputer')}
                      {computer && (
                        <span className='size-2 rounded-full bg-emerald-500' />
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
                  label={
                    agent ? (
                      <>
                        <AgentBadge agentId={agent.id} name={agent.name} />
                        {agent.name}
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
                    {computer?.agents.map((candidate) => (
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
              </>
            }
            toolbar={
              <ChoiceMenus
                choices={offered}
                values={values}
                onChoose={(choiceId, value) =>
                  setPicked((current) => ({ ...current, [choiceId]: value }))
                }
              />
            }
            onSend={async (content, _interrupt, mentions) => {
              if (!computer || !agent) return;
              try {
                const session = await create.mutateAsync({
                  computerId: computer.id,
                  agentId: agent.id,
                  cwd,
                  content,
                  settings: Object.fromEntries(
                    offeredChoices(offered).map((offer) => [
                      offer.id,
                      values[offer.id] ?? offer.currentValue,
                    ]),
                  ),
                  projectId: project?.id ?? null,
                  mentions,
                });
                void navigate(`/agent-sessions/${session.id}`);
              } catch (error) {
                toaster.show({
                  type: 'error',
                  title: errorText(error, t('errors.generic')),
                });
                throw error;
              }
            }}
          />
          <p className='text-muted-foreground text-center text-xs'>
            {t('newSession.accessHint')}
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

/** The values a new session opens with: what the agent last offered here, in the mode the bridge opens sessions in. */
function initialValues(
  offered: Computer['choices'][string] | undefined,
  agent: AgentInfo | undefined,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const choice of offeredChoices(offered)) {
    const opening =
      choice.category === 'mode' &&
      choice.options.some((option) => option.value === agent?.mode)
        ? agent?.mode
        : undefined;
    values[choice.id] = opening ?? choice.currentValue;
  }
  return values;
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
                  <code className='text-xs'>
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
      label={
        <>
          <FolderKanbanIcon className='size-4' />
          <span className={cn(!value && 'text-muted-foreground')}>
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
  label,
  shrink,
  children,
}: {
  readonly label: ReactNode;
  /** Takes the room the row has left, its label cut short; on a row of its own when that is too little. */
  readonly shrink?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'bg-muted hover:border-foreground/20 aria-expanded:border-foreground/20 inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          shrink ? 'max-w-full min-w-40 flex-1' : 'shrink-0',
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
    >
      <CheckIcon
        className={cn(
          'text-primary mt-0.5 size-3.5 shrink-0',
          !checked && 'invisible',
        )}
      />
      <span className='flex min-w-0 flex-col'>
        <span className='truncate'>{title}</span>
        {detail && (
          <span className='text-muted-foreground text-xs'>{detail}</span>
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
  const { t } = useTranslation();
  return (
    <aside
      className='hidden w-[296px] shrink-0 overflow-y-auto border-l xl:block'
      aria-label={t('newSession.thisComputer')}
    >
      <section className='flex flex-col gap-3 border-b px-5 py-4'>
        <h3 className='flex items-center gap-2 text-xs font-semibold'>
          <LaptopIcon className='size-4' />
          {t('newSession.thisComputer')}
          <span className='text-muted-foreground ml-auto inline-flex items-center gap-1.5 font-normal'>
            <span className='size-2 rounded-full bg-emerald-500' />
            {t('computers.online')}
          </span>
        </h3>
        <dl className='grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
          <dt className='text-muted-foreground'>{t('computers.name')}</dt>
          <dd className='break-words'>{computer.name}</dd>
          <dt className='text-muted-foreground'>{t('computers.system')}</dt>
          <dd>{systemName(computer)}</dd>
          <dt className='text-muted-foreground'>{t('computers.cli')}</dt>
          <dd>
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
          {computer.agents.map((agent) => (
            <li
              key={agent.id}
              className='flex items-center gap-2.5 py-2 text-xs'
            >
              <AgentBadge agentId={agent.id} name={agent.name} large />
              <span className='min-w-0 flex-1'>
                <span className='block'>{agent.name}</span>
                <span className='text-muted-foreground block text-[11px]'>
                  {agent.version ?? '—'}
                </span>
              </span>
              {agent.problem ? (
                <span className='text-muted-foreground text-[11px]'>
                  {t(`computers.problems.${agent.problem}`)}
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400'>
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
      </section>
      <section className='px-5 py-4'>
        <Button
          variant='outline'
          size='sm'
          className='font-normal'
          onClick={onManage}
        >
          <LaptopIcon />
          {t('newSession.manageComputers')}
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
