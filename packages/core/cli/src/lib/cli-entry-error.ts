/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function getCommandPathTokens(argv: string[]) {
  const tokens: string[] = [];

  for (const token of argv) {
    if (!token) {
      continue;
    }

    if (token.startsWith('-')) {
      break;
    }

    tokens.push(token);
  }

  return tokens;
}

export function formatCliEntryError(error: unknown, argv: string[]) {
  const message = error instanceof Error ? error.message : String(error);
  const missingCommandMatch = message.match(/^Command (.+) not found\.$/);
  if (!missingCommandMatch) {
    return message;
  }

  const commandPathTokens = getCommandPathTokens(argv);
  const attemptedCommand = commandPathTokens.join(' ') || missingCommandMatch[1];
  const isApiCommand = commandPathTokens[0] === 'api';

  if (isApiCommand) {
    const helpCommandTokens = commandPathTokens.length > 2 ? commandPathTokens.slice(0, -1) : ['api'];
    const helpCommand = `nb ${helpCommandTokens.join(' ')} --help`;

    return [
      `Unknown command: \`${attemptedCommand}\`.`,
      `If this is a built-in command or a typo, run \`${helpCommand}\` to inspect the commands available under that API group.`,
    ].join('\n');
  }

  return [
    `Unknown command: \`${attemptedCommand}\`.`,
    'If this is a built-in command or a typo, run `nb --help` to inspect available commands.',
    `If \`${attemptedCommand}\` should be a runtime command from your NocoBase app, check whether the connected app exposes it, then retry the command.`,
  ].join('\n');
}

export function appendDiagnosticLogPath(message: string, logFile?: string) {
  const normalizedMessage = String(message ?? '').trim();
  const normalizedLogFile = String(logFile ?? '').trim();

  if (!normalizedLogFile) {
    return normalizedMessage;
  }

  return [normalizedMessage, `Diagnostic log: ${normalizedLogFile}`].filter(Boolean).join('\n\n');
}
