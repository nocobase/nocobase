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

import { execFile, execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { resolveCliHomeDir } from './cli-home.js';

export type SessionShell = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';

const START_MARKER = '# >>> nocobase nb session >>>';
const END_MARKER = '# <<< nocobase nb session <<<';
const OPENCODE_PLUGIN_NAME = 'nb-agent-session.js';
const CMD_AUTORUN_REGISTRY_KEY = 'HKCU\\Software\\Microsoft\\Command Processor';
const CMD_AUTORUN_REGISTRY_VALUE = 'AutoRun';
const CMD_AUTORUN_OVERRIDE_FILE_ENV = 'NB_SESSION_CMD_AUTORUN_FILE';
const WINDOWS_PARENT_PROCESS_OVERRIDE_ENV = 'NB_SESSION_TEST_PARENT_PROCESS_NAME';

const execFileAsync = promisify(execFile);

function shellDir() {
  return path.join(resolveCliHomeDir(), 'shell');
}

function resolveSessionHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function opencodeConfigDir(shell: SessionShell) {
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

function detectWindowsPowerShellProfiles() {
  const home = resolveSessionHomeDir();
  const modern = path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
  const legacy = path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
  return Array.from(new Set([modern, legacy]));
}

function normalizeShellHint(shellHint: string): SessionShell | undefined {
  const normalized = shellHint.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === 'fish' || normalized === 'fish.exe') {
    return 'fish';
  }
  if (normalized === 'zsh' || normalized === 'zsh.exe') {
    return 'zsh';
  }
  if (normalized === 'bash' || normalized === 'bash.exe') {
    return 'bash';
  }
  if (normalized === 'powershell' || normalized === 'powershell.exe' || normalized === 'pwsh' || normalized === 'pwsh.exe') {
    return 'powershell';
  }
  if (normalized === 'cmd' || normalized === 'cmd.exe') {
    return 'cmd';
  }

  const normalizedPath = normalized.replace(/\\/g, '/');
  if (!normalizedPath) {
    return undefined;
  }
  if (normalizedPath.endsWith('/zsh') || normalizedPath.endsWith('/zsh.exe')) {
    return 'zsh';
  }
  if (normalizedPath.endsWith('/bash') || normalizedPath.endsWith('/bash.exe')) {
    return 'bash';
  }
  if (normalizedPath.endsWith('/fish') || normalizedPath.endsWith('/fish.exe')) {
    return 'fish';
  }
  if (normalizedPath.endsWith('/pwsh') || normalizedPath.endsWith('/pwsh.exe')) {
    return 'powershell';
  }
  if (normalizedPath.endsWith('/powershell') || normalizedPath.endsWith('/powershell.exe')) {
    return 'powershell';
  }
  if (normalizedPath.endsWith('/cmd') || normalizedPath.endsWith('/cmd.exe')) {
    return 'cmd';
  }

  return undefined;
}

function normalizeWindowsShellProcessName(processName: string): SessionShell | undefined {
  const normalized = processName.trim().toLowerCase();
  if (normalized === 'cmd' || normalized === 'cmd.exe') {
    return 'cmd';
  }
  if (normalized === 'fish' || normalized === 'fish.exe') {
    return 'fish';
  }
  if (normalized === 'zsh' || normalized === 'zsh.exe') {
    return 'zsh';
  }
  if (
    normalized === 'bash'
    || normalized === 'bash.exe'
    || normalized === 'git-bash'
    || normalized === 'git-bash.exe'
  ) {
    return 'bash';
  }
  if (normalized === 'powershell' || normalized === 'powershell.exe' || normalized === 'pwsh' || normalized === 'pwsh.exe') {
    return 'powershell';
  }
  return undefined;
}

function resolveWindowsShellFromProcessChain(processNames: string[]): SessionShell | undefined {
  const normalizedShells = processNames
    .map((processName) => normalizeWindowsShellProcessName(processName))
    .filter((shell): shell is SessionShell => Boolean(shell));

  if (normalizedShells.length === 0) {
    return undefined;
  }

  let leadingCmdCount = 0;
  while (normalizedShells[leadingCmdCount] === 'cmd') {
    leadingCmdCount += 1;
  }

  if (leadingCmdCount > 0 && normalizedShells[leadingCmdCount]) {
    return normalizedShells[leadingCmdCount];
  }

  return normalizedShells[0];
}

function detectWindowsShellByParentProcess(): SessionShell | undefined {
  if (process.platform !== 'win32' || !process.ppid) {
    return undefined;
  }

  const overrideParentProcess = String(process.env[WINDOWS_PARENT_PROCESS_OVERRIDE_ENV] ?? '').trim();
  if (overrideParentProcess) {
    return resolveWindowsShellFromProcessChain(overrideParentProcess.split(/[,\r\n]+/));
  }

  try {
    return resolveWindowsShellFromProcessChain(
      String(
        execFileSync(
          'powershell.exe',
          [
            '-NoProfile',
            '-Command',
            [
              `$id = ${process.ppid}`,
              '$names = @()',
              'for ($i = 0; $i -lt 6 -and $id; $i++) {',
              '  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue',
              '  if (-not $process) { break }',
              '  $names += $process.Name',
              '  $id = $process.ParentProcessId',
              '}',
              '$names -join [Environment]::NewLine',
            ].join('; '),
          ],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            windowsHide: true,
          },
        ),
      ).split(/\r?\n/),
    );
  } catch (_error) {
    // fall back to environment-based detection
  }

  return undefined;
}

function cmdAutoRunSegment(managedFile: string) {
  return `if exist "${managedFile}" call "${managedFile}"`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cmdAutoRunLocation() {
  const overrideFile = String(process.env[CMD_AUTORUN_OVERRIDE_FILE_ENV] ?? '').trim();
  if (overrideFile) {
    return overrideFile;
  }

  return `${CMD_AUTORUN_REGISTRY_KEY}\\${CMD_AUTORUN_REGISTRY_VALUE}`;
}

function parseRegistryQueryValue(output: string, valueName: string) {
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(new RegExp(`^\\s*${escapeRegExp(valueName)}\\s+REG_\\w+\\s*(.*)$`));
    if (match) {
      return match[1] ?? '';
    }
  }

  return undefined;
}

async function readCmdAutoRunValue() {
  const overrideFile = String(process.env[CMD_AUTORUN_OVERRIDE_FILE_ENV] ?? '').trim();
  if (overrideFile) {
    try {
      return await fs.readFile(overrideFile, 'utf8');
    } catch (_error) {
      return undefined;
    }
  }

  if (process.platform !== 'win32') {
    return undefined;
  }

  try {
    const { stdout } = await execFileAsync(
      'reg',
      ['query', CMD_AUTORUN_REGISTRY_KEY, '/v', CMD_AUTORUN_REGISTRY_VALUE],
      { windowsHide: true },
    );
    return parseRegistryQueryValue(stdout, CMD_AUTORUN_REGISTRY_VALUE);
  } catch (_error) {
    return undefined;
  }
}

async function writeCmdAutoRunValue(value: string) {
  const overrideFile = String(process.env[CMD_AUTORUN_OVERRIDE_FILE_ENV] ?? '').trim();
  if (overrideFile) {
    await fs.mkdir(path.dirname(overrideFile), { recursive: true });
    await fs.writeFile(overrideFile, value, 'utf8');
    return;
  }

  if (process.platform !== 'win32') {
    throw new Error('cmd AutoRun is only supported on Windows.');
  }

  await execFileAsync(
    'reg',
    ['add', CMD_AUTORUN_REGISTRY_KEY, '/v', CMD_AUTORUN_REGISTRY_VALUE, '/t', 'REG_SZ', '/d', value, '/f'],
    { windowsHide: true },
  );
}

async function deleteCmdAutoRunValue() {
  const overrideFile = String(process.env[CMD_AUTORUN_OVERRIDE_FILE_ENV] ?? '').trim();
  if (overrideFile) {
    await fs.rm(overrideFile, { force: true });
    return;
  }

  if (process.platform !== 'win32') {
    return;
  }

  try {
    await execFileAsync('reg', ['delete', CMD_AUTORUN_REGISTRY_KEY, '/v', CMD_AUTORUN_REGISTRY_VALUE, '/f'], {
      windowsHide: true,
    });
  } catch (_error) {
    // ignore missing registry value
  }
}

function appendCmdAutoRunSegment(currentValue: string | undefined, segment: string) {
  const current = String(currentValue ?? '').trim();
  if (!current) {
    return segment;
  }
  if (current.includes(segment)) {
    return current;
  }
  return `${current} & ${segment}`;
}

function removeCmdAutoRunSegment(currentValue: string | undefined, segment: string) {
  const current = String(currentValue ?? '').trim();
  if (!current) {
    return '';
  }
  if (current === segment) {
    return '';
  }

  const escapedSegment = escapeRegExp(segment);
  let next = current
    .replace(new RegExp(`\\s*&\\s*${escapedSegment}$`), '')
    .replace(new RegExp(`^${escapedSegment}\\s*&\\s*`), '')
    .replace(new RegExp(`\\s*&\\s*${escapedSegment}(?=\\s*&\\s*)`, 'g'), '');

  next = next.replace(/\s{2,}/g, ' ').trim();
  next = next.replace(/\s*&\s*&\s*/g, ' & ').trim();
  return next;
}

async function setupCmdAutoRun(managedFile: string) {
  const segment = cmdAutoRunSegment(managedFile);
  const currentValue = await readCmdAutoRunValue();
  const nextValue = appendCmdAutoRunSegment(currentValue, segment);
  if (nextValue === String(currentValue ?? '').trim()) {
    return {
      configured: true,
      location: cmdAutoRunLocation(),
    };
  }

  await writeCmdAutoRunValue(nextValue);
  return {
    configured: true,
    location: cmdAutoRunLocation(),
  };
}

async function removeCmdAutoRun(managedFile: string) {
  const segment = cmdAutoRunSegment(managedFile);
  const currentValue = await readCmdAutoRunValue();
  const nextValue = removeCmdAutoRunSegment(currentValue, segment);
  const current = String(currentValue ?? '').trim();
  const changed = nextValue !== current;

  if (changed) {
    if (nextValue) {
      await writeCmdAutoRunValue(nextValue);
    } else {
      await deleteCmdAutoRunValue();
    }
  }

  return {
    removed: changed,
    location: cmdAutoRunLocation(),
  };
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

  const normalizedShell = normalizeShellHint(String(process.env.SHELL ?? ''));
  const normalizedLoginShell = normalizeShellHint(String(process.env.LOGINSHELL ?? ''));

  if (process.platform === 'win32') {
    const isMsysRuntime = Boolean(process.env.MSYSTEM);
    const detectedWindowsShell = detectWindowsShellByParentProcess();
    const shellHint = normalizedLoginShell ?? normalizedShell;

    if (detectedWindowsShell === 'bash' || detectedWindowsShell === 'zsh' || detectedWindowsShell === 'fish') {
      return detectedWindowsShell;
    }

    if (shellHint === 'bash' || shellHint === 'zsh' || shellHint === 'fish') {
      return shellHint;
    }

    if (detectedWindowsShell && !(isMsysRuntime && detectedWindowsShell === 'cmd' && shellHint)) {
      return detectedWindowsShell;
    }

    if (normalizedLoginShell) {
      return normalizedLoginShell;
    }

    if (normalizedShell) {
      return normalizedShell;
    }

    if (isMsysRuntime) {
      return 'bash';
    }

    const comspec = String(process.env.ComSpec ?? '').trim().toLowerCase();
    const prompt = String(process.env.PROMPT ?? '').trim();
    if (prompt && comspec.endsWith('cmd.exe')) {
      return 'cmd';
    }
    if (process.env.PSModulePath) {
      return 'powershell';
    }
    if (comspec.endsWith('cmd.exe')) {
      return 'cmd';
    }

    return undefined;
  }

  if (normalizedShell) {
    return normalizedShell;
  }

  if (normalizedLoginShell) {
    return normalizedLoginShell;
  }

  return undefined;
}

export function getSessionShellProfilePaths(shell: SessionShell): string[] {
  const home = resolveSessionHomeDir();
  switch (shell) {
    case 'bash':
      return [path.join(home, '.bashrc')];
    case 'zsh':
      return [path.join(home, '.zshrc')];
    case 'fish':
      return [path.join(home, '.config', 'fish', 'config.fish')];
    case 'powershell':
      return process.platform === 'win32'
        ? detectWindowsPowerShellProfiles()
        : [path.join(home, '.config', 'powershell', 'Microsoft.PowerShell_profile.ps1')];
    case 'cmd':
      return [];
    default:
      return [];
  }
}

export function getSessionShellProfilePath(shell: SessionShell): string | undefined {
  return getSessionShellProfilePaths(shell)[0];
}

function buildManagedFileContent(shell: SessionShell) {
  switch (shell) {
    case 'bash':
    case 'zsh':
      return [
        '# NocoBase session integration',
        `export NB_SESSION_ID="nb-$(node -e 'console.log(require("node:crypto").randomUUID())')"`,
        '',
      ].join('\n');
    case 'fish':
      return [
        '# NocoBase session integration',
        'set -gx NB_SESSION_ID "nb-"(node -e "console.log(require(\'node:crypto\').randomUUID())")',
        '',
      ].join('\n');
    case 'powershell':
      return [
        '# NocoBase session integration',
        '  $env:NB_SESSION_ID = "nb-" + [guid]::NewGuid().ToString()',
        '',
      ].join('\n');
    case 'cmd':
      return [
        '@echo off',
        'set "NB_SESSION_ID=nb-%RANDOM%%RANDOM%%RANDOM%%RANDOM%"',
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
  const configDir = opencodeConfigDir(shell);
  const configFile = opencodeConfigFilePath(shell);
  const pluginFile = opencodePluginFilePath(shell);
  const configDirExists = await pathExists(configDir);
  if (!configDirExists) {
    return {
      pluginFile,
      configFile,
      configured: false,
      skippedReason: 'opencode_dir_not_found' as const,
    };
  }

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
  profileFiles: string[];
  profileUpdated: boolean;
  cmdAutoRunConfigured: boolean;
  cmdAutoRunLocation?: string;
  manualStep?: string;
  agentPluginFile?: string;
  agentConfigFile?: string;
  agentConfigured: boolean;
  agentSkippedReason?: 'opencode_dir_not_found';
}

export async function setupSessionIntegration(shell: SessionShell): Promise<SessionSetupResult> {
  const managedFile = managedFilePath(shell);
  await fs.mkdir(path.dirname(managedFile), { recursive: true });
  await fs.writeFile(managedFile, buildManagedFileContent(shell), 'utf8');
  const agent = await installOpencodeSessionPlugin(shell);

  if (shell === 'cmd') {
    if (process.platform === 'win32' || String(process.env[CMD_AUTORUN_OVERRIDE_FILE_ENV] ?? '').trim()) {
      try {
        const autoRun = await setupCmdAutoRun(managedFile);
        return {
          shell,
          managedFile,
          profileFiles: [],
          profileUpdated: false,
          cmdAutoRunConfigured: autoRun.configured,
          cmdAutoRunLocation: autoRun.location,
          agentPluginFile: agent.pluginFile,
          agentConfigFile: agent.configFile,
          agentConfigured: agent.configured,
          agentSkippedReason: agent.skippedReason,
        };
      } catch (_error) {
        // fall through to the manual step guidance below
      }
    }

    return {
      shell,
      managedFile,
      profileFiles: [],
      profileUpdated: false,
      cmdAutoRunConfigured: false,
      agentPluginFile: agent.pluginFile,
      agentConfigFile: agent.configFile,
      agentConfigured: agent.configured,
      agentSkippedReason: agent.skippedReason,
      manualStep: `cmd.exe AutoRun was not updated. Run 'call "${managedFile}"' in the current cmd session before using nb, or configure AutoRun to call it automatically.`,
    };
  }

  const profileFiles = getSessionShellProfilePaths(shell);
  if (profileFiles.length > 0) {
    const snippet = buildProfileSnippet(shell, managedFile);
    await Promise.all(profileFiles.map((profileFile) => upsertMarkedBlock(profileFile, snippet)));
    return {
      shell,
      managedFile,
      profileFile: profileFiles[0],
      profileFiles,
      profileUpdated: true,
      cmdAutoRunConfigured: false,
      agentPluginFile: agent.pluginFile,
      agentConfigFile: agent.configFile,
      agentConfigured: agent.configured,
      agentSkippedReason: agent.skippedReason,
    };
  }

  return {
    shell,
    managedFile,
    profileFiles: [],
    profileUpdated: false,
    cmdAutoRunConfigured: false,
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
  profileFiles: string[];
  profileUpdated: boolean;
  managedFileRemoved: boolean;
  cmdAutoRunRemoved: boolean;
  cmdAutoRunLocation?: string;
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

  if (shell === 'cmd') {
    const autoRun = await removeCmdAutoRun(managedFile);
    const agent = await removeOpencodeSessionPlugin(shell);

    return {
      shell,
      managedFile,
      profileFiles: [],
      profileUpdated: false,
      managedFileRemoved,
      cmdAutoRunRemoved: autoRun.removed,
      cmdAutoRunLocation: autoRun.location,
      agentPluginFile: agent.pluginFile,
      agentConfigFile: agent.configFile,
      agentPluginRemoved: agent.pluginFileRemoved,
      agentConfigUpdated: agent.configUpdated,
    };
  }

  const profileFiles = getSessionShellProfilePaths(shell);
  const profileUpdateResults = await Promise.all(
    profileFiles.map(async (profileFile) => ((await removeMarkedBlock(profileFile)) ? profileFile : undefined)),
  );
  const updatedProfileFiles = profileUpdateResults.filter((profileFile): profileFile is string => Boolean(profileFile));
  const agent = await removeOpencodeSessionPlugin(shell);

  return {
    shell,
    managedFile,
    profileFile: updatedProfileFiles[0],
    profileFiles: updatedProfileFiles,
    profileUpdated: updatedProfileFiles.length > 0,
    managedFileRemoved,
    cmdAutoRunRemoved: false,
    agentPluginFile: agent.pluginFile,
    agentConfigFile: agent.configFile,
    agentPluginRemoved: agent.pluginFileRemoved,
    agentConfigUpdated: agent.configUpdated,
  };
}
