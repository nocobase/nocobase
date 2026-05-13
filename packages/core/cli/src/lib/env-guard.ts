/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Command } from '@oclif/core';
import { stdin as input, stdout as output } from 'node:process';
import { getCurrentEnvName } from './auth-store.js';
import { confirm } from './inquirer.ts';

function normalizeEnvName(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

export function hasExplicitEnvSelection(argv: string[]): boolean {
  return argv.some((token, index) => (
    token === '--env'
    || token === '-e'
    || token.startsWith('--env=')
    || (token.startsWith('-e') && token.length > 2 && index >= 0)
  ));
}

function isInteractiveTerminal(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

function formatCrossEnvPromptMessage(currentEnv: string, requestedEnv: string): string {
  return `Current env is "${currentEnv}", but this command targets "${requestedEnv}" via --env. Continue without switching the current env?`;
}

export function formatCrossEnvRefusalMessage(currentEnv: string, requestedEnv: string): string {
  return [
    `Refusing to run against env "${requestedEnv}" because the current env is "${currentEnv}" and interactive confirmation is unavailable in the current agent session.`,
    '',
    'For safety, the agent will not switch envs automatically and will not add --yes on your behalf.',
    '',
    'To continue:',
    `- run \`nb env use ${requestedEnv}\` yourself and then re-run the command, or`,
    `- re-run the same command with \`--env ${requestedEnv} --yes\` to confirm this one-off cross-env operation.`,
  ].join('\n');
}

export async function ensureCrossEnvConfirmed(options: {
  command: Command;
  requestedEnv?: string;
  yes?: boolean;
}): Promise<boolean> {
  const requestedEnv = normalizeEnvName(options.requestedEnv);
  if (!requestedEnv) {
    return true;
  }

  const currentEnv = normalizeEnvName(await getCurrentEnvName());
  const interactiveTerminal = isInteractiveTerminal();
  const bypassInteractivePrompt = interactiveTerminal && Boolean(options.yes);

  if (!currentEnv || currentEnv === requestedEnv || bypassInteractivePrompt) {
    return true;
  }

  if (!interactiveTerminal) {
    options.command.error(formatCrossEnvRefusalMessage(currentEnv, requestedEnv));
  }

  try {
    return Boolean(await confirm({
      message: formatCrossEnvPromptMessage(currentEnv, requestedEnv),
      default: false,
    }));
  } catch {
    return false;
  }
}
