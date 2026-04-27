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
import * as p from '@clack/prompts';
import {
  inspectSelfStatus,
  type SelfInstallMethod,
  type SelfStatus,
} from './self-manager.js';
import { inspectSkillsStatus } from './skills-manager.js';
import { resolveCliHomeDir } from './cli-home.js';
import { isInteractiveTerminal, printWarning } from './ui.js';
import { run } from './run-npm.js';

const STARTUP_UPDATE_STATE_FILE = 'startup-update.json';
const NB_SKIP_STARTUP_UPDATE_ENV = 'NB_SKIP_STARTUP_UPDATE';

type StartupUpdateState = {
  lastCheckedDate?: string;
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

function todayStamp(now = new Date()) {
  return now.toISOString().slice(0, 10);
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

async function markChecked(now = new Date()) {
  await writeState({ lastCheckedDate: todayStamp(now) });
}

export async function shouldRunStartupUpdateCheck(argv: string[], now = new Date()) {
  if (process.env[NB_SKIP_STARTUP_UPDATE_ENV] === '1') {
    return false;
  }

  if (shouldSkipByArgv(argv)) {
    return false;
  }

  const state = await readState();
  return state.lastCheckedDate !== todayStamp(now);
}

export function shouldEnableStartupUpdateForInstallMethod(installMethod: SelfInstallMethod) {
  return installMethod === 'npm-global';
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
  const commands: string[] = [];

  if (selfStatus.updateAvailable && selfStatus.updatable) {
    commands.push('nb self update --yes');
  }

  if (skillsStatus.updateAvailable === true) {
    commands.push('nb skills update --yes');
  }

  return commands;
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

async function runStartupUpdates() {
  await run('nb', ['self', 'update', '--yes'], {
    stdio: 'inherit',
    env: {
      [NB_SKIP_STARTUP_UPDATE_ENV]: '1',
    },
    errorName: 'nb self update',
  });

  await run('nb', ['skills', 'update', '--yes'], {
    stdio: 'inherit',
    env: {
      [NB_SKIP_STARTUP_UPDATE_ENV]: '1',
    },
    errorName: 'nb skills update',
  });
}

export async function maybeRunStartupUpdatePrompt(argv: string[]): Promise<StartupUpdatePromptResult> {
  if (!(await shouldRunStartupUpdateCheck(argv))) {
    return { kind: 'skipped' };
  }

  const selfStatus = await inspectSelfStatus();
  if (!shouldEnableStartupUpdateForInstallMethod(selfStatus.installMethod)) {
    return { kind: 'skipped' };
  }

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

  const answer = await p.confirm({
    message: buildPromptMessage(selfStatus, skillsStatus),
    active: 'Yes',
    inactive: 'No',
    initialValue: true,
  });

  if (p.isCancel(answer) || !answer) {
    printWarning(buildDeclinedWarning(selfStatus, skillsStatus));
    await markChecked();
    return { kind: 'declined' };
  }

  await runStartupUpdates();
  await markChecked();
  return { kind: 'updated' };
}
