/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { detectSessionShell } from '../lib/session-integration.js';

const originalFishVersion = process.env.FISH_VERSION;
const originalZshVersion = process.env.ZSH_VERSION;
const originalBashVersion = process.env.BASH_VERSION;
const originalShell = process.env.SHELL;
const originalPsModulePath = process.env.PSModulePath;
const originalComSpec = process.env.ComSpec;
const originalPrompt = process.env.PROMPT;
const originalParentProcessOverride = process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME;

beforeEach(() => {
  delete process.env.FISH_VERSION;
  delete process.env.ZSH_VERSION;
  delete process.env.BASH_VERSION;
  delete process.env.SHELL;
});

afterEach(() => {
  vi.restoreAllMocks();

  if (originalFishVersion === undefined) {
    delete process.env.FISH_VERSION;
  } else {
    process.env.FISH_VERSION = originalFishVersion;
  }

  if (originalZshVersion === undefined) {
    delete process.env.ZSH_VERSION;
  } else {
    process.env.ZSH_VERSION = originalZshVersion;
  }

  if (originalBashVersion === undefined) {
    delete process.env.BASH_VERSION;
  } else {
    process.env.BASH_VERSION = originalBashVersion;
  }

  if (originalShell === undefined) {
    delete process.env.SHELL;
  } else {
    process.env.SHELL = originalShell;
  }

  if (originalPsModulePath === undefined) {
    delete process.env.PSModulePath;
  } else {
    process.env.PSModulePath = originalPsModulePath;
  }

  if (originalComSpec === undefined) {
    delete process.env.ComSpec;
  } else {
    process.env.ComSpec = originalComSpec;
  }

  if (originalPrompt === undefined) {
    delete process.env.PROMPT;
  } else {
    process.env.PROMPT = originalPrompt;
  }

  if (originalParentProcessOverride === undefined) {
    delete process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME;
  } else {
    process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME = originalParentProcessOverride;
  }
});

test('detectSessionShell prefers cmd when the Windows parent process is cmd', () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME = 'cmd.exe, WindowsTerminal.exe';
  process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules';
  process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe';
  process.env.PROMPT = '';

  expect(detectSessionShell()).toBe('cmd');
});

test('detectSessionShell detects PowerShell through a cmd shim parent', () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME = 'cmd.exe, pwsh.exe, WindowsTerminal.exe';
  process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules';
  process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe';
  process.env.PROMPT = '$P$G';

  expect(detectSessionShell()).toBe('powershell');
});

test('detectSessionShell falls back to cmd when parent detection does not identify a shell but cmd prompt is present', () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME = 'WindowsTerminal.exe';
  process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules';
  process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe';
  process.env.PROMPT = '$P$G';

  expect(detectSessionShell()).toBe('cmd');
});

test('detectSessionShell falls back to powershell when parent detection does not identify a shell and no cmd prompt hint exists', () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  process.env.NB_SESSION_TEST_PARENT_PROCESS_NAME = 'WindowsTerminal.exe';
  process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules';
  process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe';
  process.env.PROMPT = '';

  expect(detectSessionShell()).toBe('powershell');
});
