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
import { getSessionShellProfilePath, setupSessionIntegration, removeSessionIntegration } from '../lib/session-integration.js';

const originalHome = process.env.HOME;
const originalUserProfile = process.env.USERPROFILE;
const originalNbCliRoot = process.env.NB_CLI_ROOT;
const originalAppData = process.env.APPDATA;

let tempHome = '';

beforeEach(async () => {
  tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-session-'));
  process.env.HOME = tempHome;
  process.env.USERPROFILE = tempHome;
  process.env.NB_CLI_ROOT = tempHome;
  process.env.APPDATA = path.join(tempHome, 'AppData', 'Roaming');
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

  expect(result.profileFile).toBe(profilePath);
  expect(managedContent).toContain('NB_SESSION_ID');
  expect(managedContent).not.toContain('nb()');
  expect(managedContent).toContain('CODEX_THREAD_ID');
  expect(managedContent).not.toContain('[ -z "${NB_SESSION_ID:-}" ]');
  expect(managedContent).toContain(`node -e 'console.log(require("node:crypto").randomUUID())'`);
  expect(result.agentConfigured).toBe(true);
  expect(result.agentPluginFile).toBe(opencodePluginPath);
  expect(result.agentConfigFile).toBe(opencodeConfigPath);
  expect(opencodePluginContent).toContain('NB_SESSION_ID: sessionID');
  expect(opencodeConfigContent).toContain(opencodePluginPath);
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

test('setupSessionIntegration skips opencode agent integration when opencode config does not exist', async () => {
  const result = await setupSessionIntegration('zsh');
  const opencodePluginPath = path.join(tempHome, '.config', 'opencode', 'plugins', 'nb-agent-session.js');

  expect(result.agentConfigured).toBe(false);
  expect(result.agentSkippedReason).toBe('opencode_config_not_found');
  await expect(readFile(opencodePluginPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
});

test('setupSessionIntegration uses APPDATA for opencode integration on Windows', async () => {
  const configPath = path.join(tempHome, 'AppData', 'Roaming', 'opencode', 'opencode.json');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ plugin: [] }, null, 2)}\n`, 'utf8');

  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  try {
    const result = await setupSessionIntegration('powershell');
    expect(result.agentConfigured).toBe(true);
    expect(result.agentConfigFile).toBe(configPath);
    expect(result.agentPluginFile).toBe(path.join(tempHome, 'AppData', 'Roaming', 'opencode', 'plugins', 'nb-agent-session.js'));
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
