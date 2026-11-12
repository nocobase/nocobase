/**
 * The cells of the runner list, mirroring NocoProject's runtimes page (`nocoproject/client/pages/np/runtimes/
 * runtime-cli.tsx`): its state with the slots it uses, its coding tools with whether each is turned on, installed and
 * signed in, and its version with the command that upgrades it.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  listedTools,
  runnerActivity,
  toolLimit,
  toolState,
  type Runner,
  type RunnerActivity,
  type RunnerListItem,
  type ToolState,
} from '../../../shared/runners.js';
import { AgTag } from '../../components/ag-tag.js';
import { TONE_CLASS, type Tone } from '../../components/ag-tag-tones.js';
import { Badge } from '../../components/ui/badge.js';
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
import { useQuotaClock } from '../../hooks/use-quota-expiry.js';
import type { QuotaSource } from './quota-view.js';
import { ToolQuota } from './tool-quota.js';

const ACTIVITY_TONE: Readonly<Record<RunnerActivity, Tone>> = {
  online: 'green',
  busy: 'blue',
  low_disk: 'amber',
  offline: 'grey',
  revoked: 'red',
  upgrade_required: 'amber',
  updatePending: 'amber',
  pruning: 'amber',
};

/**
 * Its state at a glance, with its runs against its concurrency limit. A tool's own limit sits beside the tool
 * (`RunnerToolsCell`).
 */
export function RunnerStatusCell({
  runner,
  badgeOnly = false,
}: {
  readonly badgeOnly?: boolean;
  readonly runner: Pick<
    RunnerListItem,
    | 'status'
    | 'slots'
    | 'activeRuns'
    | 'activeJobs'
    | 'lastSeenAt'
    | 'workspaceUsage'
    | 'draining'
  >;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const state = runnerActivity(runner);
  const activity = state === 'busy' ? 'online' : state;
  const values = {
    active: runner.activeRuns + runner.activeJobs,
    slots: runner.slots,
    time: format.relative(runner.lastSeenAt),
  };
  let label: string;
  if (activity === 'online' || activity === 'low_disk')
    label = t(`runtimes.activity.${activity}`, values);
  else if (activity === 'offline')
    label = runner.lastSeenAt
      ? t('runtimes.activity.offline', values)
      : t('runtimes.activity.offlineNever');
  else label = t(`runtimes.status.${activity}`);
  return badgeOnly ? (
    <Badge
      variant='secondary'
      data-size='sm'
      className={`tabular-nums ${TONE_CLASS[ACTIVITY_TONE[activity]]}`}
      title={format.dateTime(runner.lastSeenAt)}
    >
      <span aria-hidden='true' className='size-1.5 rounded-full bg-current' />
      {label}
    </Badge>
  ) : (
    <AgTag
      tone={ACTIVITY_TONE[activity]}
      dot
      className='tabular-nums'
      title={format.dateTime(runner.lastSeenAt)}
    >
      {label}
    </AgTag>
  );
}

const TOOL_STATE_TONE: Readonly<Record<ToolState, Tone>> = {
  off: 'grey',
  checking: 'grey',
  failed: 'red',
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
      className='max-w-full whitespace-normal'
      title={state === 'off' ? t('runtimes.tool.offHint') : undefined}
    >
      {t(`runtimes.tool.${state}`)}
    </AgTag>
  );
}

/**
 * Each coding tool the runner lists, by whether it can take work: green when it is signed in, amber when it needs
 * installing or a login on its host, grey when it is turned off for this runtime. An enabled tool shows beside its tag
 * its runs against its own concurrency limit (`ToolConcurrency`), when it has one, and its quota (`ToolQuota`).
 */
export function RunnerToolsCell({
  runner,
}: {
  readonly runner: Pick<Runner, 'enabledTools' | 'tools'> &
    Partial<Pick<RunnerListItem, 'slots' | 'toolSlots' | 'activeByTool'>> &
    Partial<QuotaSource>;
}): ReactElement {
  const { t } = useTranslation();
  const now = useQuotaClock([
    ...(runner.unavailableModels ?? []).map((m) => m.resetsAt),
    ...(runner.quotaUsage ?? []).map((u) => u.resetsAt),
  ]);
  const tools = listedTools(runner);
  if (tools.length === 0)
    return (
      <span className='text-sm text-muted-foreground'>
        {t('runtimes.noTools')}
      </span>
    );
  return (
    <ul
      className='flex flex-wrap gap-x-2 gap-y-1'
      aria-label={t('runtimes.columns.tools')}
    >
      {tools.map((tool) => {
        const state = toolState(runner, tool);
        return (
          <li key={tool} className='inline-flex items-center gap-1'>
            <AgTag
              tone={TOOL_STATE_TONE[state]}
              dot
              data-state={state}
              title={t(`runtimes.tool.${state}`)}
            >
              {t(`tools.${tool}`)}
              <span className='sr-only'>{t(`runtimes.tool.${state}`)}</span>
            </AgTag>
            {state === 'off' ? null : (
              <>
                <ToolConcurrency runner={runner} tool={tool} />
                <ToolQuota runner={runner} tool={tool} now={now} />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A tool's runs against its own concurrency limit ("Runs 1/2"), never above the runtime's total; nothing for a tool
 * bounded only by the total, or for a runner whose total is unknown.
 */
function ToolConcurrency({
  runner,
  tool,
}: {
  readonly runner: Partial<
    Pick<RunnerListItem, 'slots' | 'toolSlots' | 'activeByTool'>
  >;
  readonly tool: AgentTool;
}): ReactElement | null {
  const { t } = useTranslation();
  if (runner.slots === undefined || runner.toolSlots?.[tool] === undefined)
    return null;
  const values = {
    tool: t(`tools.${tool}`),
    used: runner.activeByTool?.[tool] ?? 0,
    limit: toolLimit({ slots: runner.slots, toolSlots: runner.toolSlots }, tool),
  };
  const hint = t('runtimes.toolUsage.hint', values);
  return (
    <span
      data-testid={`tool-concurrency-${tool}`}
      data-full={values.used >= values.limit ? true : undefined}
      className='text-xs whitespace-nowrap text-muted-foreground tabular-nums data-full:font-medium data-full:text-foreground'
      title={hint}
      aria-label={hint}
    >
      {t('runtimes.toolUsage.short', values)}
    </span>
  );
}

/**
 * The runner's version. In the list it reads only "Latest" or "Upgradable", with the full version on hover; `plain`
 * words it among other details ("Runner 0.1.0"), as the runtime's sheet shows it. "Upgradable" marks a newer version
 * the application serves (the runner installs it on its own between runs); clicking it shows the command that updates
 * it now.
 */
export function RunnerVersionCell({
  runner,
  plain = false,
}: {
  readonly runner: Pick<Runner, 'name' | 'version' | 'product'> & {
    readonly updateVersion?: string | null;
  };
  readonly plain?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  if (!runner.version) return <span className='text-muted-foreground'>—</span>;
  const command = upgradeCommand(runner.product);
  const installed = t('runtimes.upgrade.installed', {
    version: runner.version,
  });
  const upgrade = runner.updateVersion ? (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type='button'
            className='cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
            aria-label={t('runtimes.upgrade.show', {
              version: runner.version,
            })}
            title={
              plain
                ? t('runtimes.upgrade.available')
                : t('runtimes.upgrade.description', {
                    version: runner.version,
                    latest: runner.updateVersion,
                  })
            }
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
  ) : null;
  if (!plain)
    return (
      upgrade ?? (
        <AgTag tone='grey' title={installed} aria-label={installed}>
          {t('runtimes.upgrade.latest')}
        </AgTag>
      )
    );
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span>{t('runtimes.detail.version', { version: runner.version })}</span>
      {upgrade}
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
  readonly runner: Pick<Runner, 'version' | 'product' | 'protocolVersion'> & {
    readonly requiredProtocol: { readonly min: number; readonly max: number };
    readonly updateVersion: string | null;
  };
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
