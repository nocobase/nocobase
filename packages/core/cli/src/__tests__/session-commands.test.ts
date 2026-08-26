/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
    profileFiles: ['/tmp/.zshrc'],
    profileUpdated: true,
    cmdAutoRunConfigured: false,
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

test('session setup reports created opencode integration when config is not found', async () => {
  const { default: SessionSetup } = await import('../commands/session/setup.js');
  mocks.detectSessionShell.mockReturnValue('zsh');
  mocks.setupSessionIntegration.mockResolvedValue({
    shell: 'zsh',
    managedFile: '/tmp/.nocobase/shell/session.zsh',
    profileFile: '/tmp/.zshrc',
    profileFiles: ['/tmp/.zshrc'],
    profileUpdated: true,
    cmdAutoRunConfigured: false,
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

  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration configured for zsh.',
    'Managed file: /tmp/.nocobase/shell/session.zsh',
    'Opencode agent plugin installed: /tmp/.config/opencode/plugins/nb-agent-session.js',
    'Opencode config updated: /tmp/.config/opencode/opencode.json',
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
    profileFiles: ['C:\\Users\\test\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1'],
    profileUpdated: true,
    managedFileRemoved: true,
    cmdAutoRunRemoved: false,
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

test('session setup reports skipped opencode integration when config dir is not found', async () => {
  const { default: SessionSetup } = await import('../commands/session/setup.js');
  mocks.detectSessionShell.mockReturnValue('zsh');
  mocks.setupSessionIntegration.mockResolvedValue({
    shell: 'zsh',
    managedFile: '/tmp/.nocobase/shell/session.zsh',
    profileFile: '/tmp/.zshrc',
    profileFiles: ['/tmp/.zshrc'],
    profileUpdated: true,
    cmdAutoRunConfigured: false,
    agentConfigured: false,
    agentPluginFile: '/tmp/.config/opencode/plugins/nb-agent-session.js',
    agentConfigFile: '/tmp/.config/opencode/opencode.json',
    agentSkippedReason: 'opencode_dir_not_found',
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
    'Opencode config directory not found. Skipped agent session integration.',
    'Profile updated: /tmp/.zshrc',
    'Open a new shell session or reload your profile to initialize NB_SESSION_ID automatically.',
  ]);
});

test('session setup reports every updated powershell profile', async () => {
  const { default: SessionSetup } = await import('../commands/session/setup.js');
  mocks.detectSessionShell.mockReturnValue('powershell');
  mocks.setupSessionIntegration.mockResolvedValue({
    shell: 'powershell',
    managedFile: 'C:\\Users\\test\\.nocobase\\shell\\session.ps1',
    profileFile: 'C:\\Users\\test\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1',
    profileFiles: [
      'C:\\Users\\test\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1',
      'C:\\Users\\test\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1',
    ],
    profileUpdated: true,
    cmdAutoRunConfigured: false,
    agentConfigured: true,
    agentPluginFile: 'C:\\Users\\test\\.config\\opencode\\plugins\\nb-agent-session.js',
    agentConfigFile: 'C:\\Users\\test\\.config\\opencode\\opencode.json',
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

  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration configured for powershell.',
    'Managed file: C:\\Users\\test\\.nocobase\\shell\\session.ps1',
    'Opencode agent plugin installed: C:\\Users\\test\\.config\\opencode\\plugins\\nb-agent-session.js',
    'Opencode config updated: C:\\Users\\test\\.config\\opencode\\opencode.json',
    'Profile updated: C:\\Users\\test\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1',
    'Profile updated: C:\\Users\\test\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1',
    'Open a new shell session or reload your profile to initialize NB_SESSION_ID automatically.',
  ]);
});

test('session setup reports cmd AutoRun integration', async () => {
  const { default: SessionSetup } = await import('../commands/session/setup.js');
  mocks.detectSessionShell.mockReturnValue('cmd');
  mocks.setupSessionIntegration.mockResolvedValue({
    shell: 'cmd',
    managedFile: 'C:\\Users\\test\\.nocobase\\shell\\nb.cmd',
    profileFiles: [],
    profileUpdated: false,
    cmdAutoRunConfigured: true,
    cmdAutoRunLocation: 'HKCU\\Software\\Microsoft\\Command Processor\\AutoRun',
    agentConfigured: true,
    agentPluginFile: 'C:\\Users\\test\\.config\\opencode\\plugins\\nb-agent-session.js',
    agentConfigFile: 'C:\\Users\\test\\.config\\opencode\\opencode.json',
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

  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration configured for cmd.',
    'Managed file: C:\\Users\\test\\.nocobase\\shell\\nb.cmd',
    'cmd AutoRun updated: HKCU\\Software\\Microsoft\\Command Processor\\AutoRun',
    'Open a new cmd session to initialize NB_SESSION_ID automatically.',
    'Opencode agent plugin installed: C:\\Users\\test\\.config\\opencode\\plugins\\nb-agent-session.js',
    'Opencode config updated: C:\\Users\\test\\.config\\opencode\\opencode.json',
  ]);
});

test('session remove reports cmd AutoRun cleanup', async () => {
  const { default: SessionRemove } = await import('../commands/session/remove.js');
  mocks.detectSessionShell.mockReturnValue('cmd');
  mocks.removeSessionIntegration.mockResolvedValue({
    shell: 'cmd',
    managedFile: 'C:\\Users\\test\\.nocobase\\shell\\nb.cmd',
    profileFiles: [],
    profileUpdated: false,
    managedFileRemoved: true,
    cmdAutoRunRemoved: true,
    cmdAutoRunLocation: 'HKCU\\Software\\Microsoft\\Command Processor\\AutoRun',
    agentPluginFile: 'C:\\Users\\test\\AppData\\Roaming\\opencode\\plugins\\nb-agent-session.js',
    agentConfigFile: 'C:\\Users\\test\\AppData\\Roaming\\opencode\\opencode.json',
    agentPluginRemoved: false,
    agentConfigUpdated: false,
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

  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Session integration removed for cmd.',
    'Managed file removed: C:\\Users\\test\\.nocobase\\shell\\nb.cmd',
    'cmd AutoRun updated: HKCU\\Software\\Microsoft\\Command Processor\\AutoRun',
  ]);
});
