/**
 * The cells of the runner list, mirroring NocoProject's runtimes page (`nocoproject/client/pages/np/runtimes/
 * runtime-cli.tsx`): its state with the slots it uses, its coding tools with whether each is turned on, installed and
 * signed in, and its version with the command that upgrades it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  listedTools,
  runnerActivity,
  toolState,
  toolUsage,
  type Runner,
  type RunnerActivity,
  type RunnerSummary,
  type ToolState,
} from '../../../shared/runners.js';
import { AgTag, type Tone } from '../../components/ag-tag.js';
import { CommandLine } from '../../components/command-line.js';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../components/ui/popover.js';
import { useFormatters } from '../../lib/format.js';
import { upgradeCommand } from '../../lib/install.js';

const ACTIVITY_TONE: Readonly<Record<RunnerActivity, Tone>> = {
  online: 'green',
  busy: 'blue',
  offline: 'grey',
  revoked: 'red',
  upgrade_required: 'amber',
};

/**
 * Its state at a glance: online or busy with the slots it uses ("Busy 1/1"), offline since when, revoked, or waiting
 * for an upgrade; below it, the runs by coding tool against each tool's limit ("Claude Code 2/2 · Codex 0/1") when it
 * limits a tool or runs any.
 */
export function RunnerStatusCell({
  runner,
}: {
  readonly runner: Pick<
    RunnerSummary,
    | 'status'
    | 'slots'
    | 'activeRuns'
    | 'activeJobs'
    | 'lastSeenAt'
    | 'toolSlots'
    | 'activeByTool'
  >;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const activity = runnerActivity(runner);
  const values = {
    active: runner.activeRuns + runner.activeJobs,
    slots: runner.slots,
    time: format.relative(runner.lastSeenAt),
  };
  let label: string;
  if (activity === 'online' || activity === 'busy')
    label = t(`runtimes.activity.${activity}`, values);
  else if (activity === 'offline')
    label = runner.lastSeenAt
      ? t('runtimes.activity.offline', values)
      : t('runtimes.activity.offlineNever');
  else label = t(`runtimes.status.${activity}`);
  const tag = (
    <AgTag
      tone={ACTIVITY_TONE[activity]}
      dot
      className='tabular-nums'
      title={format.dateTime(runner.lastSeenAt)}
    >
      {label}
    </AgTag>
  );
  const usage = toolUsage(runner);
  if (usage.length === 0) return tag;
  return (
    <div className='flex flex-col items-start gap-1'>
      {tag}
      <ul
        className='flex flex-wrap gap-x-2 text-xs text-muted-foreground tabular-nums'
        aria-label={t('runtimes.toolUsage.label')}
      >
        {usage.map((item) => (
          <li
            key={item.tool}
            data-full={item.used >= item.limit ? true : undefined}
            className='data-full:text-foreground'
          >
            {t('runtimes.toolUsage.item', {
              tool: t(`tools.${item.tool}`),
              used: item.used,
              limit: item.limit,
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

const TOOL_STATE_TONE: Readonly<Record<ToolState, Tone>> = {
  off: 'grey',
  notInstalled: 'amber',
  signedOut: 'amber',
  signedIn: 'green',
};

export function ToolStateTag({
  state,
}: {
  readonly state: ToolState;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <AgTag
      tone={TOOL_STATE_TONE[state]}
      dot
      title={state === 'off' ? t('runtimes.tool.offHint') : undefined}
    >
      {t(`runtimes.tool.${state}`)}
    </AgTag>
  );
}

/**
 * Each coding tool the runner lists, by whether it can take work: green when it is signed in, amber when it needs
 * installing or a login on its host, grey when it is turned off for this runtime.
 */
export function RunnerToolsCell({
  runner,
}: {
  readonly runner: Pick<Runner, 'enabledTools' | 'tools'>;
}): ReactElement {
  const { t } = useTranslation();
  const tools = listedTools(runner);
  if (tools.length === 0)
    return (
      <span className='text-sm text-muted-foreground'>
        {t('runtimes.noTools')}
      </span>
    );
  return (
    <ul
      className='flex flex-wrap gap-1'
      aria-label={t('runtimes.columns.tools')}
    >
      {tools.map((tool) => {
        const state = toolState(runner, tool);
        return (
          <li key={tool}>
            <AgTag
              tone={TOOL_STATE_TONE[state]}
              dot
              data-state={state}
              title={t(`runtimes.tool.${state}`)}
            >
              {t(`tools.${tool}`)}
              <span className='sr-only'>{t(`runtimes.tool.${state}`)}</span>
            </AgTag>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The runner's version, with an "Upgradable" mark when the application serves a newer one (the runner installs it on
 * its own between runs); clicking the mark shows the command that updates it now.
 */
export function RunnerVersionCell({
  runner,
  plain = false,
}: {
  readonly runner: Pick<Runner, 'name' | 'version' | 'product'> & {
    readonly updateVersion?: string | null;
  };
  /** Words it as text among other details ("Runner 0.1.0"), rather than as a column's monospaced value. */
  readonly plain?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  if (!runner.version) return <span className='text-muted-foreground'>—</span>;
  const command = upgradeCommand(runner.product);
  return (
    <span className='inline-flex items-center gap-1.5'>
      {plain ? (
        <span>{t('runtimes.detail.version', { version: runner.version })}</span>
      ) : (
        <span className='font-mono text-xs'>{runner.version}</span>
      )}
      {runner.updateVersion ? (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type='button'
                className='cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
                aria-label={t('runtimes.upgrade.show', {
                  version: runner.version,
                })}
                title={t('runtimes.upgrade.available')}
              />
            }
          >
            <AgTag tone='amber'>{t('runtimes.upgrade.badge')}</AgTag>
          </PopoverTrigger>
          <PopoverContent className='w-96' align='start'>
            <PopoverHeader>
              <PopoverTitle>
                {t('runtimes.upgrade.title', { name: runner.name })}
              </PopoverTitle>
              <PopoverDescription>
                {t('runtimes.upgrade.description', {
                  version: runner.version,
                  latest: runner.updateVersion,
                })}
              </PopoverDescription>
            </PopoverHeader>
            <p className='text-xs text-muted-foreground'>
              {t('runtimes.upgrade.hint')}
            </p>
            {command ? <CommandLine command={command} /> : null}
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  );
}

/**
 * Why a runtime whose runner speaks a protocol this application does not serve takes no work: the runner's version and
 * protocol, the protocols this application needs, and how to update it.
 */
export function RunnerUpgradeRequired({
  runner,
}: {
  readonly runner: Pick<
    RunnerSummary,
    | 'version'
    | 'product'
    | 'protocolVersion'
    | 'requiredProtocol'
    | 'updateVersion'
  >;
}): ReactElement {
  const { t } = useTranslation();
  const { min, max } = runner.requiredProtocol;
  const required = min === max ? String(max) : `${min}–${max}`;
  const values = {
    version: runner.version || '—',
    protocol: runner.protocolVersion,
    required,
    latest: runner.updateVersion,
  };
  const command = upgradeCommand(runner.product);
  return (
    <div
      role='status'
      className='flex flex-col gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    >
      <p className='font-medium'>{t('runtimes.upgradeRequired.title')}</p>
      <p>
        {t(
          runner.protocolVersion > max
            ? 'runtimes.upgradeRequired.newer'
            : 'runtimes.upgradeRequired.older',
          values,
        )}
      </p>
      <p className='text-xs'>
        {command
          ? t(
              runner.updateVersion
                ? 'runtimes.upgradeRequired.latest'
                : 'runtimes.upgradeRequired.noLatest',
              values,
            )
          : t('runtimes.upgradeRequired.reinstall', values)}
      </p>
      {command ? <CommandLine command={command} /> : null}
    </div>
  );
}
