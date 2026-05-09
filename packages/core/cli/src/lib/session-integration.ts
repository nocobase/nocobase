/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveCliHomeDir } from './cli-home.js';

export type SessionShell = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';

const START_MARKER = '# >>> nocobase nb session >>>';
const END_MARKER = '# <<< nocobase nb session <<<';
const OPENCODE_PLUGIN_NAME = 'nb-agent-session.js';

function shellDir() {
  return path.join(resolveCliHomeDir(), 'shell');
}

function resolveSessionHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function usesWindowsOpencodeConfig(shell: SessionShell) {
  return process.platform === 'win32' && (shell === 'powershell' || shell === 'cmd');
}

function opencodeConfigDir(shell: SessionShell) {
  if (usesWindowsOpencodeConfig(shell)) {
    const appData = process.env.APPDATA || path.join(resolveSessionHomeDir(), 'AppData', 'Roaming');
    return path.join(appData, 'opencode');
  }

  return path.join(resolveSessionHomeDir(), '.config', 'opencode');
}

function opencodePluginFilePath(shell: SessionShell) {
  return path.join(opencodeConfigDir(shell), 'plugins', OPENCODE_PLUGIN_NAME);
}

function opencodeConfigFilePath(shell: SessionShell) {
  return path.join(opencodeConfigDir(shell), 'opencode.json');
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

function managedFilePath(shell: SessionShell) {
  const dir = shellDir();
  switch (shell) {
    case 'bash':
      return path.join(dir, 'session.bash');
    case 'zsh':
      return path.join(dir, 'session.zsh');
    case 'fish':
      return path.join(dir, 'session.fish');
    case 'powershell':
      return path.join(dir, 'session.ps1');
    case 'cmd':
      return path.join(dir, 'nb.cmd');
    default:
      return path.join(dir, 'session.sh');
  }
}

function detectWindowsPowerShellProfile() {
  const home = resolveSessionHomeDir();
  const modern = path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
  return modern;
}

export function detectSessionShell(): SessionShell | undefined {
  if (process.env.FISH_VERSION) {
    return 'fish';
  }
  if (process.env.ZSH_VERSION) {
    return 'zsh';
  }
  if (process.env.BASH_VERSION) {
    return 'bash';
  }

  const shellPath = String(process.env.SHELL ?? '').trim().toLowerCase();
  if (shellPath.endsWith('/zsh')) {
    return 'zsh';
  }
  if (shellPath.endsWith('/bash')) {
    return 'bash';
  }
  if (shellPath.endsWith('/fish')) {
    return 'fish';
  }

  if (process.platform === 'win32') {
    if (process.env.PSModulePath) {
      return 'powershell';
    }
    const comspec = String(process.env.ComSpec ?? '').trim().toLowerCase();
    if (comspec.endsWith('cmd.exe')) {
      return 'cmd';
    }
  }

  return undefined;
}

export function getSessionShellProfilePath(shell: SessionShell): string | undefined {
  const home = resolveSessionHomeDir();
  switch (shell) {
    case 'bash':
      return path.join(home, '.bashrc');
    case 'zsh':
      return path.join(home, '.zshrc');
    case 'fish':
      return path.join(home, '.config', 'fish', 'config.fish');
    case 'powershell':
      return detectWindowsPowerShellProfile();
    case 'cmd':
      return undefined;
    default:
      return undefined;
  }
}

function buildManagedFileContent(shell: SessionShell) {
  switch (shell) {
    case 'bash':
    case 'zsh':
      return [
        '# NocoBase session integration',
        'if [ -n "${CODEX_THREAD_ID:-}" ]; then',
        '  export NB_SESSION_ID="${CODEX_THREAD_ID}"',
        'else',
        `  export NB_SESSION_ID="nb-$(node -e 'console.log(require("node:crypto").randomUUID())')"`,
        'fi',
        '',
      ].join('\n');
    case 'fish':
      return [
        '# NocoBase session integration',
        'if set -q CODEX_THREAD_ID',
        '    set -gx NB_SESSION_ID "$CODEX_THREAD_ID"',
        'else',
        '    set -gx NB_SESSION_ID "nb-"(node -e "console.log(require(\'node:crypto\').randomUUID())")',
        'end',
        '',
      ].join('\n');
    case 'powershell':
      return [
        '# NocoBase session integration',
        'if ($env:CODEX_THREAD_ID) {',
        '  $env:NB_SESSION_ID = $env:CODEX_THREAD_ID',
        '} else {',
        '  $env:NB_SESSION_ID = "nb-" + [guid]::NewGuid().ToString()',
        '}',
        '',
      ].join('\n');
    case 'cmd':
      return [
        '@echo off',
        'if defined CODEX_THREAD_ID (',
        '  set "NB_SESSION_ID=%CODEX_THREAD_ID%"',
        ') else (',
        '  for /f %%i in (\'node -e "console.log(require(\\\'node:crypto\\\').randomUUID())"\') do set "NB_SESSION_ID=nb-%%i"',
        ')',
        '',
      ].join('\r\n');
    default:
      return '';
  }
}

function buildProfileSnippet(shell: SessionShell, managedPath: string) {
  switch (shell) {
    case 'bash':
    case 'zsh':
      return [
        START_MARKER,
        `[ -f "${managedPath}" ] && source "${managedPath}"`,
        END_MARKER,
      ].join('\n');
    case 'fish':
      return [
        START_MARKER,
        `if test -f '${managedPath.replace(/'/g, "\\'")}'`,
        `    source '${managedPath.replace(/'/g, "\\'")}'`,
        'end',
        END_MARKER,
      ].join('\n');
    case 'powershell':
      return [
        START_MARKER,
        `if (Test-Path '${managedPath.replace(/'/g, "''")}') { . '${managedPath.replace(/'/g, "''")}' }`,
        END_MARKER,
      ].join('\r\n');
    default:
      return '';
  }
}

function buildOpencodePluginContent() {
  return [
    '/**',
    ' * opencode plugin: expose the current conversation session id to shell tools.',
    ' *',
    ' * Semantics:',
    ' * - same chat: stable',
    ' * - different chat: different',
    ' */',
    'export const NbAgentSessionPlugin = async () => {',
    '  return {',
    '    "shell.env": async (input, output) => {',
    '      const sessionID = typeof input?.sessionID === "string" ? input.sessionID.trim() : "";',
    '      if (!sessionID) {',
    '        return;',
    '      }',
    '',
    '      output.env = {',
    '        ...output.env,',
    '        NB_SESSION_ID: sessionID,',
    '      };',
    '    },',
    '  };',
    '};',
    '',
    'export default NbAgentSessionPlugin;',
    '',
  ].join('\n');
}

async function installOpencodeSessionPlugin(shell: SessionShell) {
  const configFile = opencodeConfigFilePath(shell);
  const configExists = await pathExists(configFile);
  if (!configExists) {
    return {
      pluginFile: opencodePluginFilePath(shell),
      configFile,
      configured: false,
      skippedReason: 'opencode_config_not_found' as const,
    };
  }

  const pluginFile = opencodePluginFilePath(shell);
  await fs.mkdir(path.dirname(pluginFile), { recursive: true });
  await fs.writeFile(pluginFile, buildOpencodePluginContent(), 'utf8');

  let config: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(configFile, 'utf8');
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch (_error) {
    config = {
      $schema: 'https://opencode.ai/config.json',
    };
  }

  const plugins = Array.isArray(config.plugin) ? [...config.plugin] : [];
  if (!plugins.includes(pluginFile)) {
    plugins.push(pluginFile);
  }
  config.plugin = plugins;

  await fs.writeFile(configFile, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  return {
    pluginFile,
    configFile,
    configured: true,
    skippedReason: undefined,
  };
}

async function removeOpencodeSessionPlugin(shell: SessionShell) {
  const pluginFile = opencodePluginFilePath(shell);
  const configFile = opencodeConfigFilePath(shell);

  let pluginFileRemoved = false;
  try {
    await fs.rm(pluginFile, { force: true });
    pluginFileRemoved = true;
  } catch (_error) {
    pluginFileRemoved = false;
  }

  let configUpdated = false;
  try {
    const raw = await fs.readFile(configFile, 'utf8');
    const config = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(config.plugin)) {
      const nextPlugins = config.plugin.filter((item) => item !== pluginFile);
      if (nextPlugins.length !== config.plugin.length) {
        config.plugin = nextPlugins;
        await fs.writeFile(configFile, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
        configUpdated = true;
      }
    }
  } catch (_error) {
    configUpdated = false;
  }

  return {
    pluginFile,
    configFile,
    pluginFileRemoved,
    configUpdated,
  };
}

async function upsertMarkedBlock(filePath: string, block: string) {
  let content = '';
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (_error) {
    content = '';
  }

  const pattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}\\r?\\n?`, 'g');
  const cleaned = content.replace(pattern, '').replace(/\s*$/, '');
  const next = cleaned ? `${cleaned}\n\n${block}\n` : `${block}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, next, 'utf8');
}

async function removeMarkedBlock(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const pattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}\\r?\\n?`, 'g');
    const next = content.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trimEnd();
    await fs.writeFile(filePath, next ? `${next}\n` : '', 'utf8');
    return true;
  } catch (_error) {
    return false;
  }
}

export interface SessionSetupResult {
  shell: SessionShell;
  managedFile: string;
  profileFile?: string;
  profileUpdated: boolean;
  manualStep?: string;
  agentPluginFile?: string;
  agentConfigFile?: string;
  agentConfigured: boolean;
  agentSkippedReason?: 'opencode_config_not_found';
}

export async function setupSessionIntegration(shell: SessionShell): Promise<SessionSetupResult> {
  const managedFile = managedFilePath(shell);
  await fs.mkdir(path.dirname(managedFile), { recursive: true });
  await fs.writeFile(managedFile, buildManagedFileContent(shell), 'utf8');
  const agent = await installOpencodeSessionPlugin(shell);

  const profileFile = getSessionShellProfilePath(shell);
  if (profileFile) {
    await upsertMarkedBlock(profileFile, buildProfileSnippet(shell, managedFile));
    return {
      shell,
      managedFile,
      profileFile,
      profileUpdated: true,
      agentPluginFile: agent.pluginFile,
      agentConfigFile: agent.configFile,
      agentConfigured: agent.configured,
      agentSkippedReason: agent.skippedReason,
    };
  }

  return {
    shell,
    managedFile,
    profileUpdated: false,
    agentPluginFile: agent.pluginFile,
    agentConfigFile: agent.configFile,
    agentConfigured: agent.configured,
    agentSkippedReason: agent.skippedReason,
    manualStep: `cmd.exe does not have a shell profile like bash or PowerShell. Run "${managedFile}" in the current cmd session before using nb, or configure AutoRun to call it automatically.`,
  };
}

export interface SessionRemoveResult {
  shell: SessionShell;
  managedFile: string;
  profileFile?: string;
  profileUpdated: boolean;
  managedFileRemoved: boolean;
  agentPluginFile?: string;
  agentConfigFile?: string;
  agentPluginRemoved: boolean;
  agentConfigUpdated: boolean;
}

export async function removeSessionIntegration(shell: SessionShell): Promise<SessionRemoveResult> {
  const managedFile = managedFilePath(shell);
  let managedFileRemoved = false;
  try {
    await fs.rm(managedFile, { force: true });
    managedFileRemoved = true;
  } catch (_error) {
    managedFileRemoved = false;
  }

  const profileFile = getSessionShellProfilePath(shell);
  const profileUpdated = profileFile ? await removeMarkedBlock(profileFile) : false;
  const agent = await removeOpencodeSessionPlugin(shell);

  return {
    shell,
    managedFile,
    profileFile,
    profileUpdated,
    managedFileRemoved,
    agentPluginFile: agent.pluginFile,
    agentConfigFile: agent.configFile,
    agentPluginRemoved: agent.pluginFileRemoved,
    agentConfigUpdated: agent.configUpdated,
  };
}
