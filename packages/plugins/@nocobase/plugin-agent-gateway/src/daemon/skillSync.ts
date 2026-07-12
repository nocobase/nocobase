/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { spawn } from 'child_process';

import { JsonRecord } from './types';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../shared/apiContract';

export interface UploadedZipSource {
  type: 'zip';
  archivePath?: string;
  archiveUrl?: string;
  auth?: 'node-token';
  sha256: string;
  sizeBytes?: number;
  uploadedAt?: string;
}

export interface GitHubSkillSource {
  type: 'github';
  repoUrl: string;
  ref?: string;
  commitSha?: string;
  archiveUrl?: string;
  sha256?: string;
}

export type SkillVersionSource = UploadedZipSource | GitHubSkillSource;

export interface SkillVersionInstallRecord {
  skillVersionId: string;
  versionLabel: string;
  source: SkillVersionSource;
  skillRootPath?: string;
}

export interface NodeSkillInstallPayload {
  nodeId: string;
  skillVersionId: string;
  status: 'installed' | 'failed' | 'removed';
  installedAt?: string;
  lastSeenAt: string;
  capabilitiesSnapshotJson: JsonRecord;
  settingsSnapshotJson: JsonRecord;
}

export interface SyncNodeSkillVersionOptions {
  nodeId: string;
  skillsRoot: string;
  skillVersion: SkillVersionInstallRecord;
  cacheRoot?: string;
  extractArchive?: (archivePath: string, destination: string, signal?: AbortSignal) => Promise<void>;
  writeInstallStatus?: (payload: NodeSkillInstallPayload) => Promise<void>;
  downloadTimeoutMs?: number;
  downloadHeaders?: Record<string, string>;
  trustedArchiveServerUrl?: string;
  signal?: AbortSignal;
}

export interface SyncNodeSkillVersionResult {
  skillVersionId: string;
  installPath: string;
  idempotent: boolean;
  status: 'installed';
  sourceDigest: string;
}

interface InstallMarker {
  skillVersionId: string;
  sourceDigest: string;
  installedAt: string;
}

const GITHUB_COMMIT_PATTERN = /^[0-9a-f]{40}$/i;
const ZIPINFO_MODE_PATTERN = /^([bcdlps-])[rwxstST-]{9}\s+/;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 30_000;
const PROCESS_TERMINATE_GRACE_MS = 2000;

function getAbortError(signal?: AbortSignal) {
  if (signal?.reason instanceof Error) {
    return signal.reason;
  }
  const error = new Error('Skill synchronization aborted');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw getAbortError(signal);
  }
}

function normalizeRepoUrl(repoUrl: string) {
  return repoUrl.replace(/\/$/, '').replace(/\.git$/, '');
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function assertSafeSegment(segment: string, label: string) {
  if (!segment || segment.includes('/') || segment.includes('\\') || segment === '.' || segment === '..') {
    throw new Error(`${label} must be a safe path segment`);
  }
}

function isWithin(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isSafeZipEntryName(entryName: string) {
  const normalizedName = entryName.replace(/\\/g, '/');
  if (!normalizedName || normalizedName.startsWith('/') || /^[A-Za-z]:\//.test(normalizedName)) {
    return false;
  }
  return normalizedName
    .split('/')
    .filter((segment) => segment.length > 0)
    .every((segment) => segment !== '.' && segment !== '..');
}

function getInstallPath(skillsRoot: string, skillVersionId: string) {
  assertSafeSegment(skillVersionId, 'skillVersionId');
  return path.join(skillsRoot, skillVersionId);
}

async function sha256File(filePath: string, signal?: AbortSignal) {
  throwIfAborted(signal);
  const hash = createHash('sha256');
  const file = await fs.open(filePath, 'r');
  try {
    for await (const chunk of file.createReadStream()) {
      throwIfAborted(signal);
      hash.update(chunk);
    }
  } finally {
    await file.close();
  }
  throwIfAborted(signal);
  return hash.digest('hex');
}

function sha256Buffer(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

function getSourceDigest(source: SkillVersionSource) {
  if (source.sha256) {
    return source.sha256;
  }
  if (source.type === 'github' && source.commitSha) {
    return `github:${normalizeRepoUrl(source.repoUrl)}:${source.commitSha}`;
  }
  return JSON.stringify(source);
}

export async function persistSkillZipUpload(options: {
  content: Buffer;
  uploadDir: string;
  fileName?: string;
  now?: Date;
  validateArchive?: boolean;
}): Promise<UploadedZipSource> {
  await fs.mkdir(options.uploadDir, { recursive: true });
  const sha256 = sha256Buffer(options.content);
  const fileName = options.fileName || `${sha256}.zip`;
  assertSafeSegment(fileName, 'fileName');
  const archivePath = path.join(options.uploadDir, fileName);
  await fs.writeFile(archivePath, options.content, {
    mode: 0o600,
  });
  if (options.validateArchive) {
    try {
      await validateSkillZipArchive(archivePath);
    } catch (error) {
      await fs.rm(archivePath, { force: true });
      throw error;
    }
  }
  return {
    type: 'zip',
    archivePath,
    sha256,
    sizeBytes: options.content.byteLength,
    uploadedAt: (options.now || new Date()).toISOString(),
  };
}

export function solidifyGitHubSkillSource(source: GitHubSkillSource): GitHubSkillSource {
  const repoUrl = normalizeRepoUrl(source.repoUrl);
  if (!repoUrl) {
    throw new Error('GitHub repoUrl is required');
  }

  if (source.archiveUrl && source.sha256) {
    return {
      ...source,
      repoUrl,
    };
  }

  const commitSha = source.commitSha || '';
  if (!GITHUB_COMMIT_PATTERN.test(commitSha)) {
    throw new Error(
      'GitHub skill source must be solidified to a 40-character commit SHA or immutable archive with sha256',
    );
  }

  return {
    ...source,
    repoUrl,
    commitSha,
    ref: commitSha,
    archiveUrl: `${repoUrl}/archive/${commitSha}.zip`,
  };
}

export function normalizeSkillVersionSource(source: SkillVersionSource): SkillVersionSource {
  if (source.type === 'github') {
    return solidifyGitHubSkillSource(source);
  }
  if (!source.sha256) {
    throw new Error('Uploaded Skill ZIP source must include sha256');
  }
  if (!source.archivePath && !source.archiveUrl) {
    throw new Error('Uploaded Skill ZIP source must include archivePath or archiveUrl');
  }
  return source;
}

async function downloadArchive(
  archiveUrl: string,
  destination: string,
  timeoutMs: number,
  headers: Record<string, string> = {},
  redirectCount = 0,
  signal?: AbortSignal,
) {
  throwIfAborted(signal);
  if (redirectCount > 5) {
    throw new Error('Too many redirects while downloading Skill archive');
  }
  const url = new URL(archiveUrl);
  const transport = url.protocol === 'https:' ? https : http;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  throwIfAborted(signal);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let responseStream: http.IncomingMessage | null = null;
    let output: ReturnType<typeof createWriteStream> | null = null;
    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
    };
    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (error) {
        reject(error);
        return;
      }
      resolve();
    };
    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      responseStream?.destroy();
      output?.destroy();
      finish(error);
    };
    const request = transport.get(url, { headers }, (response) => {
      responseStream = response;
      const statusCode = response.statusCode || 0;
      const location = response.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location) {
        response.resume();
        const redirectedUrl = new URL(location, url).toString();
        const redirectedHeaders = new URL(redirectedUrl).origin === url.origin ? headers : {};
        downloadArchive(redirectedUrl, destination, timeoutMs, redirectedHeaders, redirectCount + 1, signal)
          .then(() => finish())
          .catch((error) => fail(error instanceof Error ? error : new Error(String(error))));
        return;
      }
      if (statusCode < 200 || statusCode >= 300) {
        finish(new Error(`Failed to download Skill archive: HTTP ${statusCode}`));
        response.resume();
        return;
      }
      const destinationStream = createWriteStream(destination, {
        mode: 0o600,
      });
      output = destinationStream;
      response.pipe(destinationStream);
      destinationStream.on('finish', () => {
        destinationStream.close();
        finish();
      });
      destinationStream.on('error', fail);
      response.on('error', fail);
      response.on('aborted', () => fail(new Error(`Skill archive download was interrupted: ${archiveUrl}`)));
    });
    const abort = () => {
      const error = getAbortError(signal);
      responseStream?.destroy();
      output?.destroy();
      request.destroy(error);
      finish(error);
    };
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Skill archive download timed out: ${archiveUrl}`));
    });
    request.on('error', (error) => fail(error));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
  });
  throwIfAborted(signal);
}

async function runProcessOutput(command: string, args: string[], signal?: AbortSignal) {
  throwIfAborted(signal);
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let abortError: Error | null = null;
    let forceKillTimer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
        forceKillTimer = null;
      }
    };
    const abort = () => {
      if (abortError) {
        return;
      }
      abortError = getAbortError(signal);
      child.kill('SIGTERM');
      forceKillTimer = setTimeout(() => {
        child.kill('SIGKILL');
      }, PROCESS_TERMINATE_GRACE_MS);
    };
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      cleanup();
      reject(abortError || error);
    });
    child.on('close', (code) => {
      cleanup();
      if (abortError) {
        reject(abortError);
        return;
      }
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
  });
}

async function validateZipEntries(archivePath: string, signal?: AbortSignal) {
  throwIfAborted(signal);
  const names = (await runProcessOutput('zipinfo', ['-1', archivePath], signal))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!names.length) {
    throw new Error('Skill archive is empty');
  }
  for (const name of names) {
    throwIfAborted(signal);
    if (!isSafeZipEntryName(name)) {
      throw new Error(`Unsafe Skill archive entry path: ${name}`);
    }
  }

  const listing = await runProcessOutput('zipinfo', ['-l', archivePath], signal);
  for (const line of listing.split(/\r?\n/)) {
    throwIfAborted(signal);
    const match = line.match(ZIPINFO_MODE_PATTERN);
    if (!match) {
      continue;
    }
    if (match[1] !== '-' && match[1] !== 'd') {
      throw new Error('Skill archive may only contain regular files and directories');
    }
  }
}

async function validateExtractedTree(root: string, signal?: AbortSignal) {
  throwIfAborted(signal);
  const realRoot = await fs.realpath(root);
  async function visit(currentPath: string) {
    throwIfAborted(signal);
    const stat = await fs.lstat(currentPath);
    if (stat.isSymbolicLink()) {
      throw new Error('Skill archive may not contain symbolic links');
    }
    if (!stat.isDirectory() && !stat.isFile()) {
      throw new Error('Skill archive may only contain regular files and directories');
    }
    const realPath = await fs.realpath(currentPath);
    if (!isWithin(realRoot, realPath)) {
      throw new Error('Skill archive extracted outside the install directory');
    }
    if (stat.isDirectory()) {
      const entries = await fs.readdir(currentPath);
      for (const entry of entries) {
        throwIfAborted(signal);
        await visit(path.join(currentPath, entry));
      }
    }
  }
  await visit(realRoot);
  throwIfAborted(signal);
}

async function extractZipWithSystemUnzip(archivePath: string, destination: string, signal?: AbortSignal) {
  await validateZipEntries(archivePath, signal);
  throwIfAborted(signal);
  await fs.mkdir(destination, { recursive: true });
  throwIfAborted(signal);
  await runProcessOutput('unzip', ['-q', archivePath, '-d', destination], signal);
  await validateExtractedTree(destination, signal);
}

export async function validateSkillZipArchive(archivePath: string, signal?: AbortSignal) {
  throwIfAborted(signal);
  const validationPath = path.join(path.dirname(archivePath), `.agent-gateway-validate-${randomUUID()}`);
  await fs.rm(validationPath, { recursive: true, force: true });
  try {
    await extractZipWithSystemUnzip(archivePath, validationPath, signal);
    const skillMdPath = await findSkillMd(validationPath, signal);
    if (!skillMdPath) {
      throw new Error('Skill archive must contain a standard Agent Skills SKILL.md file');
    }
  } finally {
    await fs.rm(validationPath, { recursive: true, force: true });
  }
}

async function findSkillMd(root: string, signal?: AbortSignal): Promise<string | null> {
  throwIfAborted(signal);
  const realRoot = await fs.realpath(root);
  const validateSkillFile = async (candidate: string) => {
    throwIfAborted(signal);
    const stat = await fs.lstat(candidate);
    if (!stat.isFile()) {
      return null;
    }
    const realPath = await fs.realpath(candidate);
    return isWithin(realRoot, realPath) ? candidate : null;
  };
  const direct = path.join(root, 'SKILL.md');
  try {
    const skillMdPath = await validateSkillFile(direct);
    if (skillMdPath) {
      return skillMdPath;
    }
  } catch {
    throwIfAborted(signal);
    // Continue scanning one-level archive wrappers.
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    throwIfAborted(signal);
    if (entry.isDirectory()) {
      const nested = path.join(root, entry.name, 'SKILL.md');
      try {
        const skillMdPath = await validateSkillFile(nested);
        if (skillMdPath) {
          return skillMdPath;
        }
      } catch {
        throwIfAborted(signal);
        // Continue scanning one-level archive wrappers.
      }
    }
  }
  return null;
}

async function readMarker(markerPath: string): Promise<InstallMarker | null> {
  try {
    const marker = JSON.parse(await fs.readFile(markerPath, 'utf8')) as unknown;
    if (
      isRecord(marker) &&
      typeof marker.skillVersionId === 'string' &&
      typeof marker.sourceDigest === 'string' &&
      typeof marker.installedAt === 'string'
    ) {
      return {
        skillVersionId: marker.skillVersionId,
        sourceDigest: marker.sourceDigest,
        installedAt: marker.installedAt,
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function getArchivePath(
  source: SkillVersionSource,
  cacheRoot: string,
  expectedDigest: string,
  timeoutMs: number,
  downloadHeaders: Record<string, string> = {},
  trustedArchiveServerUrl?: string,
  signal?: AbortSignal,
) {
  throwIfAborted(signal);
  if (source.type === 'zip' && source.archivePath) {
    return source.archivePath;
  }
  const archiveUrl = source.archiveUrl;
  if (!archiveUrl) {
    throw new Error('Skill archive URL is required');
  }
  const archivePath = path.join(cacheRoot, `${expectedDigest.replace(/[^A-Za-z0-9.-]/g, '_')}.zip`);
  const archiveHeaders =
    source.type === 'zip' && source.auth === 'node-token'
      ? getAuthenticatedArchiveHeaders(archiveUrl, trustedArchiveServerUrl, downloadHeaders)
      : {};
  await downloadArchive(archiveUrl, archivePath, timeoutMs, archiveHeaders, 0, signal);
  return archivePath;
}

function getAuthenticatedArchiveHeaders(
  archiveUrl: string,
  trustedArchiveServerUrl: string | undefined,
  downloadHeaders: Record<string, string>,
) {
  if (!trustedArchiveServerUrl) {
    throw new Error('Authenticated Skill ZIP archive URL requires a trusted server URL');
  }
  const archive = new URL(archiveUrl);
  const trustedServer = new URL(trustedArchiveServerUrl);
  const archivePathPrefix = `${getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion)}/`;
  const archiveTarget = archive.pathname.slice(archivePathPrefix.length);
  if (
    archive.origin !== trustedServer.origin ||
    !archive.pathname.startsWith(archivePathPrefix) ||
    !archiveTarget ||
    archiveTarget.includes('/')
  ) {
    throw new Error('Authenticated Skill ZIP archive URL must point to the configured NocoBase archive endpoint');
  }
  return downloadHeaders;
}

function buildInstallPayload(options: {
  nodeId: string;
  skillVersion: SkillVersionInstallRecord;
  installPath: string;
  skillMdPath: string;
  installedAt?: string;
}): NodeSkillInstallPayload {
  const now = new Date().toISOString();
  return {
    nodeId: options.nodeId,
    skillVersionId: options.skillVersion.skillVersionId,
    status: 'installed',
    installedAt: options.installedAt,
    lastSeenAt: now,
    capabilitiesSnapshotJson: {
      skillRootPath: options.installPath,
      skillMdPath: options.skillMdPath,
    },
    settingsSnapshotJson: {
      source: normalizeSkillVersionSource(options.skillVersion.source),
      versionLabel: options.skillVersion.versionLabel,
    },
  };
}

export async function syncNodeSkillVersion(options: SyncNodeSkillVersionOptions): Promise<SyncNodeSkillVersionResult> {
  throwIfAborted(options.signal);
  const source = normalizeSkillVersionSource(options.skillVersion.source);
  const sourceDigest = getSourceDigest(source);
  const installPath = getInstallPath(options.skillsRoot, options.skillVersion.skillVersionId);
  const markerPath = path.join(installPath, '.agent-gateway-install.json');
  const existingMarker = await readMarker(markerPath);
  throwIfAborted(options.signal);
  const existingSkillMd = existingMarker ? await findSkillMd(installPath, options.signal) : null;

  if (
    existingMarker?.skillVersionId === options.skillVersion.skillVersionId &&
    existingMarker.sourceDigest === sourceDigest &&
    existingSkillMd
  ) {
    throwIfAborted(options.signal);
    await options.writeInstallStatus?.(
      buildInstallPayload({
        nodeId: options.nodeId,
        skillVersion: options.skillVersion,
        installPath,
        skillMdPath: existingSkillMd,
        installedAt: existingMarker.installedAt,
      }),
    );
    throwIfAborted(options.signal);
    return {
      skillVersionId: options.skillVersion.skillVersionId,
      installPath,
      idempotent: true,
      status: 'installed',
      sourceDigest,
    };
  }

  const cacheRoot = options.cacheRoot || path.join(options.skillsRoot, '.cache');
  const archivePath = await getArchivePath(
    source,
    cacheRoot,
    sourceDigest,
    options.downloadTimeoutMs || DEFAULT_DOWNLOAD_TIMEOUT_MS,
    options.downloadHeaders,
    options.trustedArchiveServerUrl,
    options.signal,
  );
  throwIfAborted(options.signal);
  if (source.sha256) {
    const actualDigest = await sha256File(archivePath, options.signal);
    if (actualDigest !== source.sha256) {
      throw new Error('Skill archive sha256 does not match the solidified source');
    }
  }

  const tempInstallPath = `${installPath}.tmp-${randomUUID()}`;
  throwIfAborted(options.signal);
  await fs.rm(tempInstallPath, { recursive: true, force: true });
  throwIfAborted(options.signal);
  await fs.mkdir(tempInstallPath, { recursive: true });
  try {
    throwIfAborted(options.signal);
    await (options.extractArchive || extractZipWithSystemUnzip)(archivePath, tempInstallPath, options.signal);
    await validateExtractedTree(tempInstallPath, options.signal);
    const tempSkillMdPath = await findSkillMd(tempInstallPath, options.signal);
    if (!tempSkillMdPath) {
      throw new Error('Skill archive must contain a standard Agent Skills SKILL.md file');
    }
    throwIfAborted(options.signal);
    await fs.rm(installPath, { recursive: true, force: true });
    await fs.rename(tempInstallPath, installPath);
  } catch (error) {
    await fs.rm(tempInstallPath, { recursive: true, force: true });
    throw error;
  }
  throwIfAborted(options.signal);
  const skillMdPath = await findSkillMd(installPath, options.signal);
  if (!skillMdPath) {
    throw new Error('Skill archive must contain a standard Agent Skills SKILL.md file');
  }

  throwIfAborted(options.signal);
  const installedAt = new Date().toISOString();
  const marker: InstallMarker = {
    skillVersionId: options.skillVersion.skillVersionId,
    sourceDigest,
    installedAt,
  };
  await fs.writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
  throwIfAborted(options.signal);
  await options.writeInstallStatus?.(
    buildInstallPayload({
      nodeId: options.nodeId,
      skillVersion: options.skillVersion,
      installPath,
      skillMdPath,
      installedAt,
    }),
  );
  throwIfAborted(options.signal);

  return {
    skillVersionId: options.skillVersion.skillVersionId,
    installPath,
    idempotent: false,
    status: 'installed',
    sourceDigest,
  };
}
