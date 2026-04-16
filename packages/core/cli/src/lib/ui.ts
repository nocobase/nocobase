import readline from 'node:readline/promises';
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

export async function promptText(message: string, options?: { defaultValue?: string; secret?: boolean }) {
  if (!isInteractiveTerminal()) {
    return options?.defaultValue ?? '';
  }

  const rl = readline.createInterface({
    input,
    output,
    terminal: true,
  });

  try {
    const suffix = options?.defaultValue ? ` (${options.defaultValue})` : '';
    const hint = options?.secret ? ' [input visible]' : '';
    const prompt = `${message}${suffix}${hint}: `;
    const answer = await rl.question(prompt);
    return answer.trim() || options?.defaultValue || '';
  } finally {
    rl.close();
  }
}

export async function confirmAction(message: string, options?: { defaultValue?: boolean }) {
  if (!isInteractiveTerminal()) {
    return Boolean(options?.defaultValue);
  }

  stopTask();

  const rl = readline.createInterface({
    input,
    output,
    terminal: true,
  });

  try {
    const suffix = options?.defaultValue ? pc.dim('[Y/n]') : pc.dim('[y/N]');
    const prompt = `${pc.yellow('?')} ${pc.bold(message)} ${suffix} `;
    const answer = await rl.question(prompt);
    const normalized = answer.trim().toLowerCase();

    if (!normalized) {
      return Boolean(options?.defaultValue);
    }

    return normalized === 'y' || normalized === 'yes';
  } finally {
    rl.close();
  }
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

export function printWarning(message: string) {
  if (activeSpinner) {
    if (!isInteractiveTerminal()) {
      activeSpinner = undefined;
      console.log(pc.yellow(message));
      return;
    }

    activeSpinner.warn(pc.yellow(message));
    activeSpinner = undefined;
    return;
  }

  console.log(pc.yellow(message));
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
  if (activeSpinner) {
    activeSpinner.stop();
    activeSpinner = undefined;
  }
}

export function renderTable(headers: string[], rows: string[][]) {
  const widths = headers.map((header, index) => {
    return rows.reduce((max, row) => Math.max(max, stringWidth(row[index] ?? '')), stringWidth(header));
  });

  const renderRow = (row: string[]) => row.map((cell, index) => pad(cell ?? '', widths[index])).join('  ').trimEnd();

  const divider = widths.map((width) => '-'.repeat(width)).join('  ');
  return [renderRow(headers), divider, ...rows.map(renderRow)].join('\n');
}
