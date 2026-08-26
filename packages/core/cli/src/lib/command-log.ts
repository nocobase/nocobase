/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { resolveCliHomeDir } from './cli-home.js';
import { DEFAULT_LOG_ENABLED, DEFAULT_LOG_RETENTION_DAYS, getCliConfigValue } from './cli-config.js';

const ACTIVE_LOG_FILE_ENV = 'NB_CLI_ACTIVE_LOG_FILE';
const ACTIVE_META_FILE_ENV = 'NB_CLI_ACTIVE_META_FILE';
const LOG_DIR_ENV = 'NB_CLI_LOG_DIR';
const LOG_DISABLED_ENV = 'NB_CLI_LOG_DISABLED';
const ANSI_ESCAPE_PATTERN = new RegExp(String.raw`\u001B\[[0-?]*[ -/]*[@-~]`, 'g');
const CLEANUP_STATE_FILE = '.cleanup-state.json';
const CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000;

export type CommandLogMeta = {
  command: string;
  argv: string[];
  cwd: string;
  pid: number;
  ppid: number;
  sessionId?: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  exitCode?: number;
  signal?: string;
  logFile: string;
  cliVersion?: string;
  nodeVersion?: string;
  platform?: string;
  interactive?: boolean;
  verbose?: boolean;
  errorMessage?: string;
};

export type CommandLogSession = {
  logFile: string;
  metaFile: string;
  meta: CommandLogMeta;
};

type CleanupState = {
  lastCleanupAt?: string;
};

function isTruthyEnvFlag(value: string | undefined): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateParts(date: Date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return {
    dayKey: `${year}-${month}-${day}`,
    timestampKey: `${year}${month}${day}-${hour}${minute}${second}`,
  };
}

function sanitizeFileNameSegment(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'command';
}

function resolveSessionDirName(sessionId?: string): string {
  const trimmed = String(sessionId ?? '').trim();
  if (!trimmed) {
    return 'no-session';
  }
  return sanitizeFileNameSegment(trimmed);
}

export function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_PATTERN, '');
}

export function shouldEnableCommandLog(env: NodeJS.ProcessEnv = process.env): boolean {
  return !isTruthyEnvFlag(env[LOG_DISABLED_ENV]);
}

export function resolveCommandLogDir(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (!shouldEnableCommandLog(env)) {
    return undefined;
  }

  const configured = String(env[LOG_DIR_ENV] ?? '').trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.join(resolveCliHomeDir(), 'logs');
}

export function getActiveCommandLogFile(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = String(env[ACTIVE_LOG_FILE_ENV] ?? '').trim();
  return value || undefined;
}

function readActiveCommandMetaFile(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = String(env[ACTIVE_META_FILE_ENV] ?? '').trim();
  return value || undefined;
}

export function hasActiveCommandLog(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getActiveCommandLogFile(env));
}

export function sanitizeArgv(argv: string[]): string[] {
  const sensitiveFlags = new Set(['--token', '--access-token', '--password', '--secret']);
  const sanitized: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (sensitiveFlags.has(token)) {
      sanitized.push(token);
      if (index + 1 < argv.length) {
        sanitized.push('***');
        index += 1;
      }
      continue;
    }

    const matched = token.match(/^(--(?:token|access-token|password|secret))=(.*)$/);
    if (matched) {
      sanitized.push(`${matched[1]}=***`);
      continue;
    }

    sanitized.push(token);
  }

  return sanitized;
}

export function getCommandLogCommandId(argv: string[]): string {
  const positional = argv.filter((token) => token && !token.startsWith('-'));
  if (positional.length === 0) {
    return 'command';
  }

  const commandPath = positional[0] === 'api' ? positional.slice(0, 3) : positional.slice(0, 2);
  return sanitizeFileNameSegment(commandPath.join('-'));
}

function parseDateDirName(name: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) {
    return undefined;
  }

  const parsed = new Date(`${name}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function readCleanupState(filePath: string): Promise<CleanupState> {
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf8')) as CleanupState;
  } catch {
    return {};
  }
}

async function writeCleanupState(filePath: string, state: CleanupState) {
  await fsp.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function resolveCommandLogRetentionDays(): Promise<number> {
  const configured = await getCliConfigValue('log.retention-days').catch(() => String(DEFAULT_LOG_RETENTION_DAYS));
  const parsed = Number.parseInt(String(configured).trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return DEFAULT_LOG_RETENTION_DAYS;
  }
  return parsed;
}

async function resolveCommandLogEnabled(): Promise<boolean> {
  const configured = await getCliConfigValue('log.enabled').catch(() => String(DEFAULT_LOG_ENABLED));
  const normalized = String(configured).trim().toLowerCase();
  if (normalized === 'false') {
    return false;
  }
  if (normalized === 'true') {
    return true;
  }
  return DEFAULT_LOG_ENABLED;
}

async function cleanupCommandLogs(rootDir: string, retentionDays: number, now: Date = new Date()) {
  if (retentionDays === 0) {
    return;
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays + 1);

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dirDate = parseDateDirName(entry.name);
    if (!dirDate || dirDate >= cutoff) {
      continue;
    }

    await fsp.rm(path.join(rootDir, entry.name), { recursive: true, force: true });
  }
}

async function maybeCleanupCommandLogs(rootDir: string, env: NodeJS.ProcessEnv = process.env) {
  await fsp.mkdir(rootDir, { recursive: true });
  const stateFile = path.join(rootDir, CLEANUP_STATE_FILE);
  const state = await readCleanupState(stateFile);
  const lastCleanupAt = Date.parse(String(state.lastCleanupAt ?? ''));
  if (!Number.isNaN(lastCleanupAt) && Date.now() - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  const retentionDays = await resolveCommandLogRetentionDays();
  await cleanupCommandLogs(rootDir, retentionDays);
  await writeCleanupState(stateFile, { lastCleanupAt: new Date().toISOString() });
}

async function writeMetaFile(filePath: string, meta: CommandLogMeta) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

function writeMetaFileSync(filePath: string, meta: CommandLogMeta) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

export async function initCommandLogSession(options: {
  argv: string[];
  cwd: string;
  pid?: number;
  ppid?: number;
  sessionId?: string;
  cliVersion?: string;
  nodeVersion?: string;
  platform?: string;
  interactive?: boolean;
  verbose?: boolean;
  startedAt?: Date;
  env?: NodeJS.ProcessEnv;
}): Promise<CommandLogSession | undefined> {
  const env = options.env ?? process.env;
  if (!shouldEnableCommandLog(env)) {
    return undefined;
  }

  const enabled = await resolveCommandLogEnabled().catch(() => DEFAULT_LOG_ENABLED);
  if (!enabled) {
    return undefined;
  }

  const rootDir = resolveCommandLogDir(env);
  if (!rootDir) {
    return undefined;
  }

  await maybeCleanupCommandLogs(rootDir, env).catch(() => undefined);

  const startedAt = options.startedAt ?? new Date();
  const { dayKey, timestampKey } = formatDateParts(startedAt);
  const commandId = getCommandLogCommandId(options.argv);
  const fileStem = `${timestampKey}-${commandId}-${options.pid ?? process.pid}`;
  const sessionDirName = resolveSessionDirName(options.sessionId);
  const logDir = path.join(rootDir, dayKey, sessionDirName);
  const logFile = path.join(logDir, `${fileStem}.log`);
  const metaFile = path.join(logDir, `${fileStem}.meta.json`);
  const meta: CommandLogMeta = {
    command: commandId,
    argv: sanitizeArgv(options.argv),
    cwd: options.cwd,
    pid: options.pid ?? process.pid,
    ppid: options.ppid ?? process.ppid,
    sessionId: options.sessionId,
    startedAt: startedAt.toISOString(),
    logFile,
    cliVersion: options.cliVersion,
    nodeVersion: options.nodeVersion,
    platform: options.platform,
    interactive: options.interactive,
    verbose: options.verbose,
  };

  await fsp.mkdir(logDir, { recursive: true });
  await fsp.writeFile(logFile, '', 'utf8');
  await writeMetaFile(metaFile, meta);

  env[ACTIVE_LOG_FILE_ENV] = logFile;
  env[ACTIVE_META_FILE_ENV] = metaFile;

  return {
    logFile,
    metaFile,
    meta,
  };
}

export function finalizeCommandLogSessionSync(
  session: CommandLogSession | undefined,
  options: {
    exitCode?: number;
    signal?: string;
    errorMessage?: string;
    endedAt?: Date;
  } = {},
) {
  if (!session) {
    return;
  }

  const endedAt = options.endedAt ?? new Date();
  const startedAtMs = Date.parse(session.meta.startedAt);
  const nextMeta: CommandLogMeta = {
    ...session.meta,
    endedAt: endedAt.toISOString(),
    durationMs: Number.isNaN(startedAtMs) ? undefined : Math.max(0, endedAt.getTime() - startedAtMs),
    exitCode: options.exitCode ?? session.meta.exitCode,
    signal: options.signal ?? session.meta.signal,
    errorMessage: options.errorMessage ?? session.meta.errorMessage,
  };

  writeMetaFileSync(session.metaFile, nextMeta);
  session.meta = nextMeta;
}

export function appendCommandLogChunk(chunk: string | Uint8Array, env: NodeJS.ProcessEnv = process.env) {
  const logFile = getActiveCommandLogFile(env);
  if (!logFile) {
    return;
  }

  const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
  if (!text) {
    return;
  }

  fs.appendFileSync(logFile, stripAnsi(text), 'utf8');
}

export function installCommandLogWriteHooks(env: NodeJS.ProcessEnv = process.env): (() => void) | undefined {
  if (!hasActiveCommandLog(env)) {
    return undefined;
  }

  const originalStdoutWrite = process.stdout.write.bind(process.stdout) as typeof process.stdout.write;
  const originalStderrWrite = process.stderr.write.bind(process.stderr) as typeof process.stderr.write;

  process.stdout.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => {
    appendCommandLogChunk(chunk, env);
    return originalStdoutWrite(chunk as never, encoding as never, callback as never);
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => {
    appendCommandLogChunk(chunk, env);
    return originalStderrWrite(chunk as never, encoding as never, callback as never);
  }) as typeof process.stderr.write;

  return () => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  };
}

export function getActiveCommandMetaFile(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return readActiveCommandMetaFile(env);
}
