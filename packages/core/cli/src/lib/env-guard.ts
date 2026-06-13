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
import { translateCli } from './cli-locale.js';
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
  return translateCli('commands.shared.crossEnv.prompt', {
    currentEnv,
    requestedEnv,
  });
}

export function formatCrossEnvRefusalMessage(currentEnv: string, requestedEnv: string): string {
  return translateCli('commands.shared.crossEnv.refusal', {
    currentEnv,
    requestedEnv,
  });
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
  const bypassInteractivePrompt = Boolean(options.yes);

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
