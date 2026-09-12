/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { confirm } from './inquirer.ts';
import {
  DEFAULT_UPDATE_POLICY,
  getExplicitCliConfigValue,
  loadCliConfig,
} from './cli-config.js';
import {
  inspectSelfInstall,
  inspectSelfStatus,
  type SelfInstallMethod,
  type SelfStatus,
} from './self-manager.js';
import { inspectSkillsStatus } from './skills-manager.js';
import { resolveCliHomeDir } from './cli-home.js';
import { isInteractiveTerminal, printWarning } from './ui.js';
import { run } from './run-npm.js';
import type { CliUpdatePolicy } from './cli-config.js';

const STARTUP_UPDATE_STATE_FILE = 'startup-update.json';
const NB_SKIP_STARTUP_UPDATE_ENV = 'NB_SKIP_STARTUP_UPDATE';
type LegacyStartupUpdatePolicy = 'disabled' | 'daily';
type StartupUpdateStateEntry = {
  policy?: LegacyStartupUpdatePolicy;
  lastCheckedDate?: string;
};

type StartupUpdateState = {
  lastCheckedDate?: string;
  entries?: Record<string, StartupUpdateStateEntry>;
};

type StartupUpdatePromptResult =
  | { kind: 'skipped' }
  | { kind: 'no-update' }
  | { kind: 'warned' }
  | { kind: 'declined' }
  | { kind: 'updated' };

function getStateFile() {
  return path.join(resolveCliHomeDir('global'), STARTUP_UPDATE_STATE_FILE);
}

function getCurrentInstallBinPath() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'bin', 'run.js');
}

function getCurrentInstallEntry(state: StartupUpdateState) {
  return state.entries?.[getCurrentInstallBinPath()];
}

function todayStamp(now = new Date()) {
  const timeZone = String(process.env.TZ ?? '').trim();
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const year = parts.find((part) => part.type === 'year')?.value;
      const month = parts.find((part) => part.type === 'month')?.value;
      const day = parts.find((part) => part.type === 'day')?.value;
      if (year && month && day) {
        return `${year}-${month}-${day}`;
      }
    } catch {
      // Fall back to the host local timezone.
    }
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shouldSkipByArgv(argv: string[]) {
  const tokens = argv.filter((token) => token && !token.startsWith('-'));
  if (tokens.length === 0) {
    return false;
  }

  if (tokens[0] === 'self' || tokens[0] === 'skills') {
    return true;
  }

  return false;
}

async function readState(): Promise<StartupUpdateState> {
  try {
    const raw = await fs.readFile(getStateFile(), 'utf8');
    return JSON.parse(raw) as StartupUpdateState;
  } catch {
    return {};
  }
}

async function writeState(state: StartupUpdateState) {
  const filePath = getStateFile();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2));
}

function readCurrentInstallLastCheckedDate(state: StartupUpdateState): string | undefined {
  return getCurrentInstallEntry(state)?.lastCheckedDate ?? state.lastCheckedDate;
}

async function writeCurrentInstallEntry(
  updater: (
    current: StartupUpdateStateEntry | undefined,
    state: StartupUpdateState,
  ) => StartupUpdateStateEntry | undefined,
) {
  const state = await readState();
  const installBinPath = getCurrentInstallBinPath();
  const nextEntry = updater(getCurrentInstallEntry(state), state);
  const entries = {
    ...(state.entries ?? {}),
  };

  if (nextEntry?.policy || nextEntry?.lastCheckedDate) {
    entries[installBinPath] = nextEntry;
  } else {
    delete entries[installBinPath];
  }

  await writeState({
    ...state,
    entries: Object.keys(entries).length ? entries : undefined,
  });
}

async function markChecked(now = new Date()) {
  await writeCurrentInstallEntry((current) => {
    return {
      ...current,
      lastCheckedDate: todayStamp(now),
    };
  });
}

function resolveLegacyStartupUpdatePolicy(state: StartupUpdateState): CliUpdatePolicy | undefined {
  const policy = getCurrentInstallEntry(state)?.policy;
  if (policy === 'disabled') {
    return 'off';
  }
  if (policy === 'daily') {
    return 'prompt';
  }
  return undefined;
}

async function resolveStartupUpdatePolicy(state: StartupUpdateState): Promise<CliUpdatePolicy> {
  const config = await loadCliConfig({ scope: 'global' });
  const explicit = getExplicitCliConfigValue(config, 'update.policy');
  return (explicit as CliUpdatePolicy | undefined) ?? resolveLegacyStartupUpdatePolicy(state) ?? DEFAULT_UPDATE_POLICY;
}

export async function clearLegacyStartupUpdatePolicyForCurrentInstall(): Promise<boolean> {
  const state = await readState();
  const current = getCurrentInstallEntry(state);
  if (!current?.policy) {
    return false;
  }

  await writeCurrentInstallEntry(() => ({
    lastCheckedDate: current.lastCheckedDate,
  }));
  return true;
}

export async function shouldRunStartupUpdateCheck(argv: string[], now = new Date()) {
  if (process.env[NB_SKIP_STARTUP_UPDATE_ENV] === '1') {
    return false;
  }

  if (shouldSkipByArgv(argv)) {
    return false;
  }

  const state = await readState();
  const policy = await resolveStartupUpdatePolicy(state);
  if (policy === 'off') {
    return false;
  }

  const selfInstall = await inspectSelfInstall();
  if (!shouldEnableStartupUpdateForInstallMethod(selfInstall.installMethod)) {
    return false;
  }

  return readCurrentInstallLastCheckedDate(state) !== todayStamp(now);
}

export function shouldEnableStartupUpdateForInstallMethod(installMethod: SelfInstallMethod) {
  return installMethod === 'npm-global' || installMethod === 'pnpm-global' || installMethod === 'yarn-global';
}

function hasPendingUpdates(selfStatus: SelfStatus, skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>) {
  return Boolean(selfStatus.updateAvailable || skillsStatus.updateAvailable === true);
}

function describeCliUpdate(selfStatus: SelfStatus) {
  return selfStatus.latestVersion
    ? `NocoBase CLI: ${selfStatus.currentVersion} -> ${selfStatus.latestVersion}`
    : `NocoBase CLI: update available from ${selfStatus.currentVersion}`;
}

function describeSkillsUpdate() {
  return 'NocoBase AI skills: update available';
}

function describeSkillsUpdateWithVersion(skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>) {
  if (skillsStatus.installedVersion && skillsStatus.latestVersion) {
    return `NocoBase AI skills: ${skillsStatus.installedVersion} -> ${skillsStatus.latestVersion}`;
  }

  if (skillsStatus.latestVersion) {
    return `NocoBase AI skills: latest ${skillsStatus.latestVersion} available`;
  }

  return describeSkillsUpdate();
}

function buildPromptMessage(selfStatus: SelfStatus, skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>) {
  const lines: string[] = [];
  const hasCliUpdate = selfStatus.updateAvailable;
  const hasSkillsUpdate = skillsStatus.updateAvailable === true;

  if (hasCliUpdate && hasSkillsUpdate) {
    lines.push('Updates are available for your NocoBase CLI and AI skills.');
  } else if (hasCliUpdate) {
    lines.push('An update is available for your NocoBase CLI.');
  } else if (hasSkillsUpdate) {
    lines.push('An update is available for your NocoBase AI skills.');
  } else {
    lines.push('A NocoBase CLI or skills update is available.');
  }

  if (hasCliUpdate) {
    lines.push(`- ${describeCliUpdate(selfStatus)}`);
  }

  if (hasSkillsUpdate) {
    lines.push(`- ${describeSkillsUpdateWithVersion(skillsStatus)}`);
  }

  lines.push('Update now?');
  return lines.join('\n');
}

function buildUpdateCommands(selfStatus: SelfStatus, skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>) {
  if (selfStatus.updateAvailable && selfStatus.updatable) {
    return [skillsStatus.updateAvailable === true ? 'nb self update --yes --skills' : 'nb self update --yes'];
  }

  if (skillsStatus.updateAvailable === true) {
    return ['nb skills update --yes'];
  }

  return [];
}

function buildNonInteractiveWarning(
  selfStatus: SelfStatus,
  skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>,
) {
  const commands = buildUpdateCommands(selfStatus, skillsStatus);
  const details: string[] = [];

  if (selfStatus.updateAvailable) {
    details.push(describeCliUpdate(selfStatus));
  }

  if (skillsStatus.updateAvailable === true) {
    details.push(describeSkillsUpdateWithVersion(skillsStatus));
  }

  return [
    `Updates available${details.length ? `: ${details.join(', ')}` : '.'}`,
    'Non-interactive session, skipped auto-update.',
    commands.length
      ? `Run: ${commands.join(' && ')}`
      : 'Check with: `nb self check` and `nb skills check`.',
    'You may run into compatibility issues until you update.',
  ].join(' ');
}

function buildDeclinedWarning(
  selfStatus: SelfStatus,
  skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>,
) {
  const commands = buildUpdateCommands(selfStatus, skillsStatus);
  const details: string[] = [];

  if (selfStatus.updateAvailable) {
    details.push(describeCliUpdate(selfStatus));
  }

  if (skillsStatus.updateAvailable === true) {
    details.push(describeSkillsUpdateWithVersion(skillsStatus));
  }

  return [
    `Skipped updates${details.length ? `: ${details.join(', ')}` : '.'}`,
    commands.length
      ? `Run: ${commands.join(' && ')}`
      : 'Check with: `nb self check` and `nb skills check`.',
    'You may run into compatibility issues until you update.',
  ].join(' ');
}

async function runStartupUpdates(selfStatus: SelfStatus, skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>) {
  if (selfStatus.updateAvailable && selfStatus.updatable) {
    const args = ['self', 'update', '--yes'];
    if (skillsStatus.updateAvailable === true) {
      args.push('--skills');
    }

    await run('nb', args, {
      stdio: 'inherit',
      env: {
        [NB_SKIP_STARTUP_UPDATE_ENV]: '1',
      },
      errorName: 'nb self update',
    });
    return;
  }

  if (skillsStatus.updateAvailable === true) {
    await run('nb', ['skills', 'update', '--yes'], {
      stdio: 'inherit',
      env: {
        [NB_SKIP_STARTUP_UPDATE_ENV]: '1',
      },
      errorName: 'nb skills update',
    });
  }
}

export async function maybeRunStartupUpdate(argv: string[]): Promise<StartupUpdatePromptResult> {
  if (!(await shouldRunStartupUpdateCheck(argv))) {
    return { kind: 'skipped' };
  }

  const policy = await resolveStartupUpdatePolicy(await readState());
  const selfStatus = await inspectSelfStatus();

  const skillsStatus = await inspectSkillsStatus();
  if (!hasPendingUpdates(selfStatus, skillsStatus)) {
    await markChecked();
    return { kind: 'no-update' };
  }

  if (!isInteractiveTerminal()) {
    printWarning(buildNonInteractiveWarning(selfStatus, skillsStatus));
    await markChecked();
    return { kind: 'warned' };
  }

  if (policy === 'auto') {
    await runStartupUpdates(selfStatus, skillsStatus);
    await markChecked();
    return { kind: 'updated' };
  }

  let answer = false;
  try {
    answer = await confirm({
      message: buildPromptMessage(selfStatus, skillsStatus),
      default: true,
    });
  } catch {
    answer = false;
  }

  if (!answer) {
    printWarning(buildDeclinedWarning(selfStatus, skillsStatus));
    await markChecked();
    return { kind: 'declined' };
  }

  await runStartupUpdates(selfStatus, skillsStatus);
  await markChecked();
  return { kind: 'updated' };
}
