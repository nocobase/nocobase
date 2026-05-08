/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  detectSessionShell: vi.fn(),
  setupSessionIntegration: vi.fn(),
  removeSessionIntegration: vi.fn(),
  resolveSessionIdentity: vi.fn(),
}));

vi.mock('../lib/session-integration.ts', () => ({
  detectSessionShell: mocks.detectSessionShell,
  setupSessionIntegration: mocks.setupSessionIntegration,
  removeSessionIntegration: mocks.removeSessionIntegration,
}));

vi.mock('../lib/session-id.ts', () => ({
  resolveSessionIdentity: mocks.resolveSessionIdentity,
}));

test('session setup uses detected shell and reports managed files', async () => {
  const { default: SessionSetup } = await import('../commands/session/setup.js');
  mocks.detectSessionShell.mockReturnValue('zsh');
  mocks.setupSessionIntegration.mockResolvedValue({
    shell: 'zsh',
    managedFile: '/tmp/.nocobase/shell/session.zsh',
    profileFile: '/tmp/.zshrc',
    profileUpdated: true,
    agentConfigured: true,
    agentPluginFile: '/tmp/.config/opencode/plugins/nb-agent-session.js',
    agentConfigFile: '/tmp/.config/opencode/opencode.json',
    agentSkippedReason: undefined,
  });

  const log = vi.fn();
  const command = Object.assign(Object.create(SessionSetup.prototype), {
    parse: vi.fn(async () => ({
      flags: {},
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SessionSetup.prototype.run.call(command);

  expect(mocks.setupSessionIntegration).toHaveBeenCalledWith('zsh');
  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration configured for zsh.',
    'Managed file: /tmp/.nocobase/shell/session.zsh',
    'Opencode agent plugin installed: /tmp/.config/opencode/plugins/nb-agent-session.js',
    'Opencode config updated: /tmp/.config/opencode/opencode.json',
    'Profile updated: /tmp/.zshrc',
    'Open a new shell session or reload your profile to initialize NB_SESSION_ID automatically.',
  ]);
});

test('session setup reports skipped opencode integration when config is not found', async () => {
  const { default: SessionSetup } = await import('../commands/session/setup.js');
  mocks.detectSessionShell.mockReturnValue('zsh');
  mocks.setupSessionIntegration.mockResolvedValue({
    shell: 'zsh',
    managedFile: '/tmp/.nocobase/shell/session.zsh',
    profileFile: '/tmp/.zshrc',
    profileUpdated: true,
    agentConfigured: false,
    agentPluginFile: '/tmp/.config/opencode/plugins/nb-agent-session.js',
    agentConfigFile: '/tmp/.config/opencode/opencode.json',
    agentSkippedReason: 'opencode_config_not_found',
  });

  const log = vi.fn();
  const command = Object.assign(Object.create(SessionSetup.prototype), {
    parse: vi.fn(async () => ({
      flags: {},
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SessionSetup.prototype.run.call(command);

  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration configured for zsh.',
    'Managed file: /tmp/.nocobase/shell/session.zsh',
    'Opencode config not found. Skipped agent session integration.',
    'Profile updated: /tmp/.zshrc',
    'Open a new shell session or reload your profile to initialize NB_SESSION_ID automatically.',
  ]);
});

test('session id prints the current NB_SESSION_ID', async () => {
  const { default: SessionId } = await import('../commands/session/id.js');
  mocks.resolveSessionIdentity.mockReturnValue({
    id: 'chat-session',
  });

  const log = vi.fn();
  const command = Object.assign(Object.create(SessionId.prototype), {
    parse: vi.fn(async () => ({
      flags: {},
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SessionId.prototype.run.call(command);

  expect(log).toHaveBeenCalledWith('chat-session');
});

test('session remove uses detected shell and reports removed files', async () => {
  const { default: SessionRemove } = await import('../commands/session/remove.js');
  mocks.detectSessionShell.mockReturnValue('powershell');
  mocks.removeSessionIntegration.mockResolvedValue({
    shell: 'powershell',
    managedFile: 'C:\\Users\\test\\.nocobase\\shell\\session.ps1',
    profileFile: 'C:\\Users\\test\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1',
    profileUpdated: true,
    managedFileRemoved: true,
    agentPluginFile: 'C:\\Users\\test\\.config\\opencode\\plugins\\nb-agent-session.js',
    agentConfigFile: 'C:\\Users\\test\\.config\\opencode\\opencode.json',
    agentPluginRemoved: true,
    agentConfigUpdated: true,
  });

  const log = vi.fn();
  const command = Object.assign(Object.create(SessionRemove.prototype), {
    parse: vi.fn(async () => ({
      flags: {},
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SessionRemove.prototype.run.call(command);

  expect(mocks.removeSessionIntegration).toHaveBeenCalledWith('powershell');
  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration removed for powershell.',
    'Profile updated: C:\\Users\\test\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1',
    'Managed file removed: C:\\Users\\test\\.nocobase\\shell\\session.ps1',
    'Opencode config updated: C:\\Users\\test\\.config\\opencode\\opencode.json',
    'Opencode agent plugin removed: C:\\Users\\test\\.config\\opencode\\plugins\\nb-agent-session.js',
  ]);
});
