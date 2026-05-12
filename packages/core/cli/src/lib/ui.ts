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

let activeSpinner: Ora | undefined;
let verboseMode = false;

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

export function setVerboseMode(value: boolean) {
  verboseMode = value;
}

export function isVerboseMode() {
  return verboseMode;
}

export function printSection(title: string) {
  console.log(pc.bold(title));
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
  printInfo(`Target env: ${envName}`);
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

  activeSpinner = ora({
    text: pc.cyan(message),
    isSilent: !isInteractiveTerminal(),
  }).start();

  if (!isInteractiveTerminal()) {
    console.log(pc.cyan(message));
  }
}

export function updateTask(message: string) {
  if (!activeSpinner) {
    startTask(message);
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
