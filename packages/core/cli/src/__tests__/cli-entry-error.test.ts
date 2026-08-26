/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import { appendDiagnosticLogPath, formatCliEntryError, getCommandPathTokens } from '../lib/cli-entry-error.js';

test('getCommandPathTokens keeps the full command path before flags', () => {
  expect(getCommandPathTokens(['api', 'flow-surfaces', 'move-menus', '-h'])).toEqual([
    'api',
    'flow-surfaces',
    'move-menus',
  ]);
});

test('formatCliEntryError keeps the standard unknown command guidance for non-api commands', () => {
  expect(formatCliEntryError(new Error('Command foo not found.'), ['foo'])).toBe(
    [
      'Unknown command: `foo`.',
      'If this is a built-in command or a typo, run `nb --help` to inspect available commands.',
      'If `foo` should be a runtime command from your NocoBase app, check whether the connected app exposes it, then retry the command.',
    ].join('\n'),
  );
});

test('formatCliEntryError explains api unknown commands as generated api groups', () => {
  expect(
    formatCliEntryError(new Error('Command flow-surfaces not found.'), ['api', 'flow-surfaces', 'move-menus', '-h']),
  ).toBe(
    [
      'Unknown command: `api flow-surfaces move-menus`.',
      'If this is a built-in command or a typo, run `nb api flow-surfaces --help` to inspect the commands available under that API group.',
    ].join('\n'),
  );
});

test('appendDiagnosticLogPath adds the log file path when available', () => {
  expect(appendDiagnosticLogPath('Something failed.', '/tmp/nb-command.log')).toBe(
    ['Something failed.', 'Diagnostic log: /tmp/nb-command.log'].join('\n\n'),
  );
});

test('appendDiagnosticLogPath leaves the message unchanged when no log file is available', () => {
  expect(appendDiagnosticLogPath('Something failed.')).toBe('Something failed.');
});
