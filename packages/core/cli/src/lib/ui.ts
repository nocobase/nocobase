/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stdin as input, stdout as output } from 'node:process';
import ora, { type Ora } from 'ora';
import pc from 'picocolors';
import { translateCli } from './cli-locale.js';

let activeSpinner: Ora | undefined;
let verboseMode = false;
let lastStaticTaskMessage: string | undefined;
let lastStaticTaskAt = 0;
const STATIC_TASK_UPDATE_THROTTLE_MS = 3_000;

function stringWidth(value: string) {
  return Array.from(value).length;
}

function pad(value: string, width: number) {
  const padding = Math.max(0, width - stringWidth(value));
  return `${value}${' '.repeat(padding)}`;
}

export function isInteractiveTerminal() {
  return Boolean(input.isTTY && output.isTTY);
}

function supportsDynamicTaskUpdates() {
  return isInteractiveTerminal() && process.env.TERM !== 'dumb';
}

export function setVerboseMode(value: boolean) {
  verboseMode = value;
}

export function isVerboseMode() {
  return verboseMode;
}

export function printSection(title: string) {
  console.log(title);
}

export function printStage(title: string) {
  clearActiveSpinner();
  console.log(title);
}

export function printInfo(message: string) {
  if (activeSpinner) {
    if (!isInteractiveTerminal()) {
      activeSpinner = undefined;
      console.log(pc.cyan(message));
      return;
    }

    activeSpinner.info(pc.cyan(message));
    activeSpinner = undefined;
    return;
  }

  console.log(pc.cyan(message));
}

export function announceTargetEnv(envName: string) {
  if (process.env.NB_SKIP_TARGET_ENV_LOG === '1') {
    return;
  }
  printInfo(translateCli('commands.shared.targetEnv', { envName }));
}

export function printVerbose(message: string) {
  if (!verboseMode) {
    return;
  }

  printInfo(message);
}

export function printSuccess(message: string) {
  if (activeSpinner) {
    if (!isInteractiveTerminal()) {
      activeSpinner = undefined;
      console.log(pc.green(message));
      return;
    }

    activeSpinner.succeed(pc.green(message));
    activeSpinner = undefined;
    return;
  }

  console.log(pc.green(message));
}

function clearActiveSpinner() {
  if (activeSpinner) {
    activeSpinner.stop();
    activeSpinner = undefined;
  }
}

export function printWarning(message: string) {
  clearActiveSpinner();
  console.log(pc.yellow(`⚠ Warning: ${message}`));
}

export function printWarningBlock(message: string) {
  clearActiveSpinner();
  console.log(pc.yellow(`⚠ Warning\n${message}\n`));
}

export function printVerboseWarning(message: string) {
  if (!verboseMode) {
    return;
  }

  printWarning(message);
}

export function startTask(message: string) {
  if (activeSpinner) {
    activeSpinner.stop();
  }

  lastStaticTaskMessage = message;
  lastStaticTaskAt = Date.now();

  if (!supportsDynamicTaskUpdates()) {
    activeSpinner = undefined;
    console.log(pc.cyan(message));
    return;
  }

  activeSpinner = ora({
    text: pc.cyan(message),
    isSilent: false,
  }).start();
}

export function updateTask(message: string) {
  if (!activeSpinner) {
    const now = Date.now();
    if (
      message !== lastStaticTaskMessage
      && now - lastStaticTaskAt >= STATIC_TASK_UPDATE_THROTTLE_MS
    ) {
      console.log(pc.cyan(message));
      lastStaticTaskMessage = message;
      lastStaticTaskAt = now;
    }
    return;
  }

  activeSpinner.text = pc.cyan(message);
}

export function succeedTask(message: string) {
  if (activeSpinner) {
    activeSpinner.succeed(pc.green(message));
    activeSpinner = undefined;
    return;
  }

  console.log(pc.green(message));
}

export function failTask(message: string) {
  if (activeSpinner) {
    activeSpinner.fail(pc.red(message));
    activeSpinner = undefined;
    return;
  }

  console.error(pc.red(message));
}

export function stopTask() {
  lastStaticTaskMessage = undefined;
  lastStaticTaskAt = 0;
  clearActiveSpinner();
}

export function renderTable(headers: string[], rows: string[][]) {
  const widths = headers.map((header, index) => {
    return rows.reduce((max, row) => Math.max(max, stringWidth(row[index] ?? '')), stringWidth(header));
  });

  const renderRow = (row: string[]) => row.map((cell, index) => pad(cell ?? '', widths[index])).join('  ').trimEnd();

  const divider = widths.map((width) => '-'.repeat(width)).join('  ');
  return [renderRow(headers), divider, ...rows.map(renderRow)].join('\n');
}
