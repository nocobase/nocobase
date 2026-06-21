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

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  getSessionShellProfilePath,
  getSessionShellProfilePaths,
  removeSessionIntegration,
  setupSessionIntegration,
} from '../lib/session-integration.js';

const originalHome = process.env.HOME;
const originalUserProfile = process.env.USERPROFILE;
const originalNbCliRoot = process.env.NB_CLI_ROOT;
const originalAppData = process.env.APPDATA;
const originalCmdAutoRunFile = process.env.NB_SESSION_CMD_AUTORUN_FILE;

let tempHome = '';

beforeEach(async () => {
  tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-session-'));
  process.env.HOME = tempHome;
  process.env.USERPROFILE = tempHome;
  process.env.NB_CLI_ROOT = tempHome;
  process.env.APPDATA = path.join(tempHome, 'AppData', 'Roaming');
  process.env.NB_SESSION_CMD_AUTORUN_FILE = path.join(tempHome, '.cmd-autorun');
});

afterEach(async () => {
  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
  if (originalUserProfile === undefined) {
    delete process.env.USERPROFILE;
  } else {
    process.env.USERPROFILE = originalUserProfile;
  }
  if (originalNbCliRoot === undefined) {
    delete process.env.NB_CLI_ROOT;
  } else {
    process.env.NB_CLI_ROOT = originalNbCliRoot;
  }
  if (originalAppData === undefined) {
    delete process.env.APPDATA;
  } else {
    process.env.APPDATA = originalAppData;
  }
  if (originalCmdAutoRunFile === undefined) {
    delete process.env.NB_SESSION_CMD_AUTORUN_FILE;
  } else {
    process.env.NB_SESSION_CMD_AUTORUN_FILE = originalCmdAutoRunFile;
  }
  await rm(tempHome, { recursive: true, force: true });
});

test('setupSessionIntegration writes managed shell file and zsh profile block', async () => {
  const opencodeConfigPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');
  await rm(path.dirname(opencodeConfigPath), { recursive: true, force: true });
  await mkdir(path.dirname(opencodeConfigPath), { recursive: true });
  await writeFile(
    opencodeConfigPath,
    `${JSON.stringify({ $schema: 'https://opencode.ai/config.json', plugin: [] }, null, 2)}\n`,
    'utf8',
  );

  const result = await setupSessionIntegration('zsh');
  const profilePath = getSessionShellProfilePath('zsh');
  const managedContent = await readFile(result.managedFile, 'utf8');
  const opencodePluginPath = path.join(tempHome, '.config', 'opencode', 'plugins', 'nb-agent-session.js');
  const opencodePluginContent = await readFile(opencodePluginPath, 'utf8');
  const opencodeConfigContent = await readFile(opencodeConfigPath, 'utf8');
  const opencodeConfig = JSON.parse(opencodeConfigContent) as { plugin?: string[] };

  expect(result.profileFile).toBe(profilePath);
  expect(managedContent).toContain('NB_SESSION_ID');
  expect(managedContent).not.toContain('nb()');
  expect(managedContent).not.toContain('CODEX_THREAD_ID');
  expect(managedContent).not.toContain('OPENCODE_RUN_ID');
  expect(managedContent).not.toContain('COPILOT_AGENT_SESSION_ID');
  expect(managedContent).not.toContain('CLAUDE_CODE_SESSION_ID');
  expect(managedContent).not.toContain('[ -z "${NB_SESSION_ID:-}" ]');
  expect(managedContent).toContain(`node -e 'console.log(require("node:crypto").randomUUID())'`);
  expect(result.agentConfigured).toBe(true);
  expect(result.agentPluginFile).toBe(opencodePluginPath);
  expect(result.agentConfigFile).toBe(opencodeConfigPath);
  expect(opencodePluginContent).toContain('NB_SESSION_ID: sessionID');
  expect(opencodeConfig.plugin).toContain(opencodePluginPath);
  await expect(readFile(profilePath!, 'utf8')).resolves.toContain('nocobase nb session');
});

test('removeSessionIntegration removes the managed shell block from bash profile', async () => {
  const opencodeConfigPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');
  await rm(path.dirname(opencodeConfigPath), { recursive: true, force: true });
  await mkdir(path.dirname(opencodeConfigPath), { recursive: true });
  await writeFile(
    opencodeConfigPath,
    `${JSON.stringify({ $schema: 'https://opencode.ai/config.json', plugin: [] }, null, 2)}\n`,
    'utf8',
  );

  const setup = await setupSessionIntegration('bash');
  const removed = await removeSessionIntegration('bash');
  const opencodeConfigContent = await readFile(opencodeConfigPath, 'utf8');

  expect(removed.managedFileRemoved).toBe(true);
  expect(removed.profileUpdated).toBe(true);
  expect(removed.agentPluginRemoved).toBe(true);
  expect(removed.agentConfigUpdated).toBe(true);
  await expect(readFile(setup.profileFile!, 'utf8')).resolves.not.toContain('nocobase nb session');
  expect(opencodeConfigContent).not.toContain('nb-agent-session.js');
});

test('setupSessionIntegration creates opencode config when config dir exists but opencode.json does not', async () => {
  const opencodeDir = path.join(tempHome, '.config', 'opencode');
  await mkdir(opencodeDir, { recursive: true });

  const result = await setupSessionIntegration('zsh');
  const opencodePluginPath = path.join(opencodeDir, 'plugins', 'nb-agent-session.js');
  const opencodeConfigPath = path.join(opencodeDir, 'opencode.json');
  const opencodeConfigContent = await readFile(opencodeConfigPath, 'utf8');

  expect(result.agentConfigured).toBe(true);
  await expect(readFile(opencodePluginPath, 'utf8')).resolves.toContain('NbAgentSessionPlugin');
  expect(JSON.parse(opencodeConfigContent)).toMatchObject({
    $schema: 'https://opencode.ai/config.json',
    plugin: [opencodePluginPath],
  });
});

test('setupSessionIntegration skips opencode agent integration when config dir does not exist', async () => {
  const result = await setupSessionIntegration('zsh');
  const opencodePluginPath = path.join(tempHome, '.config', 'opencode', 'plugins', 'nb-agent-session.js');
  const opencodeConfigPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');

  expect(result.agentConfigured).toBe(false);
  expect(result.agentSkippedReason).toBe('opencode_dir_not_found');
  await expect(readFile(opencodePluginPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(readFile(opencodeConfigPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
});

test('setupSessionIntegration uses HOME config dir for opencode integration on Windows powershell', async () => {
  const configPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ plugin: [] }, null, 2)}\n`, 'utf8');

  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const result = await setupSessionIntegration('powershell');
    expect(result.agentConfigured).toBe(true);
    expect(result.agentConfigFile).toBe(configPath);
    expect(result.agentPluginFile).toBe(path.join(tempHome, '.config', 'opencode', 'plugins', 'nb-agent-session.js'));
  } finally {
    platformSpy.mockRestore();
  }
});

test('setupSessionIntegration updates both PowerShell profile locations on Windows', async () => {
  const configPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ plugin: [] }, null, 2)}\n`, 'utf8');

  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const result = await setupSessionIntegration('powershell');
    const profilePaths = getSessionShellProfilePaths('powershell');

    expect(result.profileFiles).toEqual(profilePaths);
    expect(result.profileFile).toBe(profilePaths[0]);

    for (const profilePath of profilePaths) {
      await expect(readFile(profilePath, 'utf8')).resolves.toContain('nocobase nb session');
      await expect(readFile(profilePath, 'utf8')).resolves.toContain(result.managedFile);
    }
  } finally {
    platformSpy.mockRestore();
  }
});

test('removeSessionIntegration removes the session block from both PowerShell profile locations on Windows', async () => {
  const configPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ plugin: [] }, null, 2)}\n`, 'utf8');

  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    await setupSessionIntegration('powershell');
    const removed = await removeSessionIntegration('powershell');
    const profilePaths = getSessionShellProfilePaths('powershell');

    expect(removed.profileFiles).toEqual(profilePaths);
    expect(removed.profileUpdated).toBe(true);

    for (const profilePath of profilePaths) {
      await expect(readFile(profilePath, 'utf8')).resolves.not.toContain('nocobase nb session');
    }
  } finally {
    platformSpy.mockRestore();
  }
});

test('setupSessionIntegration keeps HOME-based opencode integration for bash on Windows', async () => {
  const configPath = path.join(tempHome, '.config', 'opencode', 'opencode.json');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ plugin: [] }, null, 2)}\n`, 'utf8');

  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const result = await setupSessionIntegration('bash');
    expect(result.agentConfigured).toBe(true);
    expect(result.agentConfigFile).toBe(configPath);
    expect(result.agentPluginFile).toBe(path.join(tempHome, '.config', 'opencode', 'plugins', 'nb-agent-session.js'));
  } finally {
    platformSpy.mockRestore();
  }
});

test('setupSessionIntegration configures cmd AutoRun on Windows and preserves existing commands', async () => {
  const autoRunFile = process.env.NB_SESSION_CMD_AUTORUN_FILE!;
  await writeFile(autoRunFile, 'doskey /insert', 'utf8');

  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const result = await setupSessionIntegration('cmd');
    const managedContent = await readFile(result.managedFile, 'utf8');
    const autoRunContent = await readFile(autoRunFile, 'utf8');

    expect(result.cmdAutoRunConfigured).toBe(true);
    expect(result.cmdAutoRunLocation).toBe(autoRunFile);
    expect(result.manualStep).toBeUndefined();
    expect(managedContent).not.toContain('node -e');
    expect(managedContent).not.toContain('powershell.exe');
    expect(managedContent).toContain('set "NB_SESSION_ID=nb-%RANDOM%%RANDOM%%RANDOM%%RANDOM%"');
    expect(autoRunContent).toContain('doskey /insert');
    expect(autoRunContent).toContain(`if exist "${result.managedFile}" call "${result.managedFile}"`);
  } finally {
    platformSpy.mockRestore();
  }
});

test('setupSessionIntegration keeps cmd AutoRun idempotent across repeated setup', async () => {
  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const first = await setupSessionIntegration('cmd');
    const second = await setupSessionIntegration('cmd');
    const autoRunContent = await readFile(process.env.NB_SESSION_CMD_AUTORUN_FILE!, 'utf8');
    const expectedSegment = `if exist "${first.managedFile}" call "${first.managedFile}"`;

    expect(second.cmdAutoRunConfigured).toBe(true);
    expect(autoRunContent).toBe(expectedSegment);
  } finally {
    platformSpy.mockRestore();
  }
});

test('removeSessionIntegration removes only the managed cmd AutoRun segment', async () => {
  const autoRunFile = process.env.NB_SESSION_CMD_AUTORUN_FILE!;
  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const setup = await setupSessionIntegration('cmd');
    await writeFile(
      autoRunFile,
      `doskey /insert & if exist "${setup.managedFile}" call "${setup.managedFile}" & echo ready`,
      'utf8',
    );

    const removed = await removeSessionIntegration('cmd');
    const autoRunContent = await readFile(autoRunFile, 'utf8');

    expect(removed.cmdAutoRunRemoved).toBe(true);
    expect(removed.cmdAutoRunLocation).toBe(autoRunFile);
    expect(autoRunContent).toBe('doskey /insert & echo ready');
  } finally {
    platformSpy.mockRestore();
  }
});
