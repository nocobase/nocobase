import { copyText } from '@nocobase/app-client';
/**
 * The viewer's computers: which are online and what each can run, removing one, and the steps that connect another
 * (`ConnectSteps`, also what a person with no computer sees first). These computers run only their owner's sessions;
 * machines that run the team's background work are managed elsewhere in the application.
 */
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  CheckIcon,
  CopyIcon,
  FolderIcon,
  LaptopIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { createElement, useState, type ReactElement } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';

import type { Computer } from '../../shared/api.js';
import { useComputers, useRemoveComputer, useUpdateFolders } from '../api.js';
import { useAgentSessionsConfig, useServerUrl } from '../config.js';
import { installedAgents, otherAgentNames } from '../lib/agents.js';
import { shortTime, systemName } from '../lib/format.js';
import { displayPath, wholeHome } from '../lib/paths.js';
import { errorText } from '../lib/errors.js';
import { AgentBadge } from './agent-badge.js';
import { FolderBrowser } from './folder-browser.js';

export function ComputersDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const computers = useComputers();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] gap-4 overflow-y-auto sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle className='text-base'>
            {t('computers.title')}
          </DialogTitle>
          <DialogDescription className='text-[13px]'>
            {t('computers.description')}
          </DialogDescription>
        </DialogHeader>
        <div className='flex min-w-0 flex-col gap-2.5'>
          {computers.data?.map((computer) => (
            <ComputerCard key={computer.id} computer={computer} />
          ))}
          {computers.data?.length === 0 && (
            <p className='text-muted-foreground text-[13px]'>
              {t('computers.none')}
            </p>
          )}
        </div>
        <h3 className='mt-1 text-[13px] font-semibold'>{t('computers.add')}</h3>
        <ConnectSteps />
      </DialogContent>
    </Dialog>
  );
}

/** What connects a computer: an agent signed in there, the command line signed in, and the bridge kept running. */
export function ConnectSteps(): ReactElement {
  const { connectPrompt } = useAgentSessionsConfig();
  return connectPrompt ? createElement(connectPrompt) : <DefaultConnectSteps />;
}

function DefaultConnectSteps(): ReactElement {
  const { t } = useTranslation();
  const { cli } = useAgentSessionsConfig();
  const server = useServerUrl();
  return (
    <ol className='flex list-decimal flex-col gap-3 pl-5 text-[13px]'>
      <li>
        {t('computers.steps.agent')}
        <p className='text-muted-foreground mt-1 text-xs'>
          {t('computers.steps.agentHint')}
        </p>
      </li>
      <li>
        {t('computers.steps.login')}
        <Command text={`${cli} login --server ${server}`} />
      </li>
      <li>
        {t('computers.steps.start')}
        <KeepConnected />
        <p className='text-muted-foreground mt-1.5 text-xs'>
          {t('computers.steps.foldersHint')}
        </p>
      </li>
    </ol>
  );
}

/** The command that keeps a computer connected from every login, and the one that connects it for a while. */
export function KeepConnected({
  temporary = true,
}: { readonly temporary?: boolean } = {}): ReactElement {
  const { t } = useTranslation();
  const { cli } = useAgentSessionsConfig();
  return (
    <>
      <Command text={`${cli} acp service install`} />
      <p className='text-muted-foreground mt-1.5 text-xs'>
        {t('computers.steps.startHint')}
      </p>
      {temporary ? (
        <>
          <p className='text-muted-foreground mt-2 text-xs'>
            {t('computers.steps.foreground')}
          </p>
          <Command text={`${cli} acp start`} />
        </>
      ) : null}
    </>
  );
}

/**
 * What a computer whose bridge the application refused as too old needs: its command line updated, and the background
 * connection started again on the new version.
 */
export function OutdatedBridgeNotice({
  computer,
}: {
  readonly computer: Computer;
}): ReactElement | null {
  const { t } = useTranslation();
  const { cli } = useAgentSessionsConfig();
  const outdated = computer.outdatedBridge;
  if (!outdated) return null;
  return (
    <div
      role='alert'
      className='border-destructive/30 bg-destructive/5 flex flex-col gap-1 rounded-md border p-2.5 text-xs'
    >
      <span className='font-medium'>
        {t('computers.outdated.title', { host: outdated.host })}
      </span>
      <span className='text-muted-foreground'>
        {t('computers.outdated.body', {
          bridgeProtocol: outdated.bridgeProtocol,
          protocol: outdated.protocol,
        })}
      </span>
      <Command text={`${cli} update`} />
      <span className='text-muted-foreground mt-1'>
        {t('computers.outdated.restart')}
      </span>
      <Command text={`${cli} acp service install`} />
    </div>
  );
}

function ComputerCard({
  computer,
}: {
  readonly computer: Computer;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const others = otherAgentNames(computer, i18n.language);
  const remove = useRemoveComputer();
  const [confirming, setConfirming] = useState(false);
  return (
    <div className='flex min-w-0 flex-col gap-2.5 rounded-[10px] border p-3.5'>
      <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
        <LaptopIcon className='text-muted-foreground size-5 shrink-0' />
        <div className='min-w-0 flex-1'>
          <div
            className='truncate text-[13px] font-semibold'
            title={computer.name}
          >
            {computer.name}
          </div>
          <div
            className='text-muted-foreground truncate text-xs'
            title={`${systemName(computer)} · ${computer.host}`}
          >
            {systemName(computer)} · {computer.host}
          </div>
        </div>
        <span className='text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-[11px] whitespace-nowrap max-sm:order-last max-sm:w-full max-sm:pl-7'>
          <span
            className={cn(
              'size-2 rounded-full',
              computer.online
                ? 'bg-emerald-500'
                : 'border-[1.5px] border-current',
            )}
          />
          {computer.online
            ? t('computers.online')
            : t('computers.lastSeen', {
                time: shortTime(computer.lastSeenAt, i18n.language),
              })}
        </span>
        <button
          type='button'
          disabled={remove.isPending}
          onClick={() =>
            confirming ? remove.mutate(computer.id) : setConfirming(true)
          }
          onBlur={() => setConfirming(false)}
          className={cn(
            'text-destructive inline-flex h-8 shrink-0 items-center rounded-md px-2 text-xs whitespace-nowrap transition-colors disabled:opacity-50',
            confirming ? 'bg-destructive/10' : 'hover:bg-destructive/10',
          )}
        >
          {confirming ? t('computers.confirmRemove') : t('computers.remove')}
        </button>
      </div>
      <OutdatedBridgeNotice computer={computer} />
      <div className='flex flex-wrap gap-1.5'>
        {installedAgents(computer).map((agent) => (
          <span
            key={agent.id}
            title={
              agent.detail ??
              `${agent.name} · ${agent.problem ? t(`computers.problems.${agent.problem}`) : (agent.version ?? '')}`
            }
            className='bg-card inline-flex h-7.5 max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap'
          >
            <AgentBadge agentId={agent.id} name={agent.name} />
            <span className='truncate'>{agent.name}</span>
            <span className='text-muted-foreground max-w-40 truncate'>
              {agent.problem
                ? t(`computers.problems.${agent.problem}`)
                : (agent.version ?? '')}
            </span>
          </span>
        ))}
      </div>
      {installedAgents(computer)
        .filter((agent) => agent.problem)
        .map((agent) => (
          <div
            key={agent.id}
            className='bg-muted flex min-w-0 flex-col gap-1 rounded-md p-2.5 text-xs'
          >
            <p className='font-medium'>
              {agent.name} · {t(`computers.problems.${agent.problem}`)}
            </p>
            {agent.detail && (
              <p className='text-muted-foreground whitespace-pre-wrap [overflow-wrap:anywhere]'>
                {agent.detail}
              </p>
            )}
          </div>
        ))}
      <p className='text-muted-foreground text-xs'>
        {t('computers.recheckHint')}
      </p>
      {others && (
        <p className='text-muted-foreground text-xs'>
          {t('newSession.alsoSupported', { names: others })}
        </p>
      )}
      <AllowedFolders computer={computer} />
    </div>
  );
}

/**
 * Where sessions on the computer may work: all of its owner's home directory by default, or the folders they add by
 * browsing it, never typing a path.
 */
function AllowedFolders({
  computer,
}: {
  readonly computer: Computer;
}): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const update = useUpdateFolders(computer.id);
  const [browsing, setBrowsing] = useState(false);
  const save = (folders: string[] | null): void =>
    update.mutate(folders, {
      onError: (error) =>
        toaster.show({
          type: 'error',
          title: errorText(error, t('errors.generic')),
        }),
    });
  return (
    <div className='flex flex-col gap-1.5 border-t pt-2.5'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs font-medium whitespace-nowrap'>
          {t('computers.allowedFolders')}
        </span>
        {computer.defaultFolders && (
          <span className='text-muted-foreground text-[11px] max-sm:order-last max-sm:w-full'>
            {wholeHome(computer)
              ? t('computers.defaultFolders')
              : t('computers.defaultRoots')}
          </span>
        )}
        <button
          type='button'
          disabled={!computer.online || update.isPending}
          title={computer.online ? undefined : t('computers.browseOffline')}
          onClick={() => setBrowsing(true)}
          className='text-primary hover:bg-accent ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs whitespace-nowrap disabled:opacity-50'
        >
          <PlusIcon className='size-3.5' />
          {t('computers.addFolder')}
        </button>
      </div>
      <ul className='flex flex-col gap-1'>
        {computer.folders.map((folder) => (
          <li
            key={folder}
            className='bg-muted flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5'
          >
            <FolderIcon className='text-muted-foreground size-4 shrink-0' />
            <code className='min-w-0 flex-1 truncate text-xs' title={folder}>
              {displayPath(folder, computer.home)}
            </code>
            {!computer.defaultFolders && (
              <button
                type='button'
                aria-label={t('computers.removeFolder')}
                disabled={update.isPending}
                onClick={() => {
                  const rest = computer.folders.filter(
                    (other) => other !== folder,
                  );
                  save(rest.length > 0 ? rest : null);
                }}
                className='text-muted-foreground hover:text-foreground shrink-0'
              >
                <XIcon className='size-3.5' />
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className='text-muted-foreground text-[11px]'>
        {computer.defaultFolders
          ? t('computers.foldersHint')
          : t('computers.foldersChosenHint')}
        {!computer.defaultFolders && (
          <button
            type='button'
            disabled={update.isPending}
            onClick={() => save(null)}
            className='text-primary ml-1 hover:underline'
          >
            {t('computers.resetFolders')}
          </button>
        )}
      </p>
      {browsing && (
        <FolderBrowser
          computer={computer}
          start={computer.home ?? undefined}
          within={computer.roots}
          title={t('computers.addFolder')}
          onClose={() => setBrowsing(false)}
          onPick={(folder) => {
            setBrowsing(false);
            save(
              computer.defaultFolders
                ? [folder]
                : [...new Set([...computer.folders, folder])],
            );
          }}
        />
      )}
    </div>
  );
}

function Command({ text }: { readonly text: string }): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [copied, setCopied] = useState(false);
  return (
    <div className='mt-1.5 flex items-start justify-between gap-2 rounded-md bg-[oklch(0.23_0.02_264)] px-3 py-2 font-mono text-xs text-[oklch(0.9_0.01_264)]'>
      <code className='min-w-0 flex-1 break-all'>{text}</code>
      <button
        type='button'
        aria-label={t('actions.copy')}
        className='shrink-0 text-[oklch(0.68_0.02_264)] hover:text-[oklch(0.9_0.01_264)]'
        onClick={() =>
          void copyText(text).then(
            () => setCopied(true),
            () => toaster.show({ type: 'error', title: t('errors.copy') }),
          )
        }
      >
        {copied ? (
          <CheckIcon className='size-4' />
        ) : (
          <CopyIcon className='size-4' />
        )}
      </button>
    </div>
  );
}
