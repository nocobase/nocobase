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

  if (!isInteractiveTerminal()) {
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

function buildPromptMessage(selfStatus: SelfStatus, skillsStatus: Awaited<ReturnType<typeof inspectSkillsStatus>>) {
  const parts: string[] = [];

  if (selfStatus.updateAvailable) {
    parts.push(`CLI ${selfStatus.currentVersion} -> ${selfStatus.latestVersion}`);
  }

  if (skillsStatus.updateAvailable === true) {
    parts.push('NocoBase AI skills update available');
  }

  if (parts.length === 0) {
    return 'A NocoBase update is available. Update now?';
  }

  return `A newer NocoBase setup is available (${parts.join(', ')}). Update now?`;
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

  const answer = await p.confirm({
    message: buildPromptMessage(selfStatus, skillsStatus),
    active: 'Yes',
    inactive: 'No',
    initialValue: true,
  });

  if (p.isCancel(answer) || !answer) {
    printWarning(
      'Skipped updating the global CLI and skills. You may run into compatibility issues until you update.',
    );
    await markChecked();
    return { kind: 'declined' };
  }

  await runStartupUpdates();
  await markChecked();
  return { kind: 'updated' };
}
