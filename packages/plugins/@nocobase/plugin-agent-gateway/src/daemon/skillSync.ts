/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

import { JsonRecord } from './types';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../shared/apiContract';
import { AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, SKILL_CAPABILITY_REPLAY_POLICY } from '../shared/skillCapability';
import {
  downloadSkillArchive,
  extractSkillZipArchive,
  SKILL_ARCHIVE_ERROR_CODES,
  SkillArchiveError,
} from '../node/skillArchive';

export { persistSkillZipUpload, validateSkillZipArchive } from '../node/skillArchive';

export interface UploadedZipSource {
  type: 'zip';
  archivePath?: string;
  archiveUrl?: string;
  auth?: 'skill-capability';
  capabilityToken?: string;
  capabilityExpiresAt?: string;
  capabilityReplayPolicy?: typeof SKILL_CAPABILITY_REPLAY_POLICY;
  runId?: string;
  claimAttempt?: number;
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
  capabilityToken?: string;
  capabilityExpiresAt?: string;
  capabilityReplayPolicy?: typeof SKILL_CAPABILITY_REPLAY_POLICY;
  runId?: string;
  claimAttempt?: number;
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
  capabilityToken?: string;
  runId?: string;
  claimAttempt?: number;
  sourceSha256?: string;
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
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 30_000;
const PUBLIC_GITHUB_ORIGIN = 'https://github.com';
const PUBLIC_GITHUB_API_ORIGIN = 'https://api.github.com';
const PUBLIC_GITHUB_CODELOAD_ORIGIN = 'https://codeload.github.com';

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

function getSourceDigest(source: SkillVersionSource) {
  if (source.sha256) {
    return source.sha256;
  }
  if (source.type === 'github' && source.commitSha) {
    return `github:${normalizeRepoUrl(source.repoUrl)}:${source.commitSha}`;
  }
  return JSON.stringify(source);
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
  const getHeaders =
    source.type === 'zip' && source.auth === 'skill-capability'
      ? (url: URL) => getSkillCapabilityArchiveHeaders(url.toString(), source, trustedArchiveServerUrl, downloadHeaders)
      : undefined;
  const assertOriginAllowed = createSkillArchiveOriginPolicy(source, archiveUrl, trustedArchiveServerUrl);
  await downloadSkillArchive({
    archiveUrl,
    destination: archivePath,
    timeoutMs,
    assertOriginAllowed,
    getHeaders,
    signal,
  });
  return archivePath;
}

export function createSkillArchiveOriginPolicy(
  source: SkillVersionSource,
  archiveUrl: string,
  trustedArchiveServerUrl?: string,
) {
  const initialArchiveOrigin = new URL(archiveUrl).origin;
  if (source.type === 'zip' && source.auth === 'skill-capability') {
    if (!trustedArchiveServerUrl) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedServer);
    }
    const trustedOrigin = new URL(trustedArchiveServerUrl).origin;
    return (url: URL) => {
      if (url.origin !== trustedOrigin) {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedEndpoint);
      }
    };
  }

  const allowedOrigins = new Set([initialArchiveOrigin]);
  if (source.type === 'github') {
    const repoOrigin = new URL(source.repoUrl).origin;
    if (
      repoOrigin === PUBLIC_GITHUB_ORIGIN &&
      (initialArchiveOrigin === PUBLIC_GITHUB_ORIGIN || initialArchiveOrigin === PUBLIC_GITHUB_API_ORIGIN)
    ) {
      allowedOrigins.add(PUBLIC_GITHUB_CODELOAD_ORIGIN);
    }
  }
  return (url: URL) => {
    if (!allowedOrigins.has(url.origin)) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadOrigin);
    }
  };
}

function getSkillCapabilityArchiveHeaders(
  archiveUrl: string,
  source: UploadedZipSource,
  trustedArchiveServerUrl: string | undefined,
  downloadHeaders: Record<string, string>,
) {
  if (!trustedArchiveServerUrl) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedServer);
  }
  if (!source.capabilityToken || !source.runId || !source.claimAttempt || !source.sha256) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedEndpoint);
  }
  const archive = new URL(archiveUrl);
  const trustedServer = new URL(trustedArchiveServerUrl);
  const archivePathPrefix = `${getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion)}/`;
  const archiveTarget = archive.pathname.slice(archivePathPrefix.length);
  if (
    archive.origin !== trustedServer.origin ||
    !archive.pathname.startsWith(archivePathPrefix) ||
    !archiveTarget ||
    archiveTarget.includes('/') ||
    archive.searchParams.get('runId') !== source.runId ||
    archive.searchParams.get('claimAttempt') !== String(source.claimAttempt) ||
    archive.searchParams.get('sha256') !== source.sha256
  ) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedEndpoint);
  }
  return {
    ...downloadHeaders,
    [AGENT_GATEWAY_SKILL_CAPABILITY_HEADER]: source.capabilityToken,
  };
}

function getPersistedSkillVersionSource(source: SkillVersionSource): SkillVersionSource {
  const { capabilityToken: _capabilityToken, ...persistedSource } = source;
  return persistedSource;
}

function buildInstallPayload(options: {
  nodeId: string;
  skillVersion: SkillVersionInstallRecord;
  installPath: string;
  skillMdPath: string;
  installedAt?: string;
}): NodeSkillInstallPayload {
  const now = new Date().toISOString();
  const source = normalizeSkillVersionSource(options.skillVersion.source);
  const capabilityToken = source.capabilityToken;
  const runId = source.runId;
  const claimAttempt = source.claimAttempt;
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
      source: getPersistedSkillVersionSource(source),
      versionLabel: options.skillVersion.versionLabel,
    },
    ...(capabilityToken && runId && claimAttempt && source.sha256
      ? {
          capabilityToken,
          runId,
          claimAttempt,
          sourceSha256: source.sha256,
        }
      : {}),
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
  const removeDownloadedArchiveOnFailure = !(source.type === 'zip' && source.archivePath);
  throwIfAborted(options.signal);
  if (source.sha256) {
    const actualDigest = await sha256File(archivePath, options.signal);
    if (actualDigest !== source.sha256) {
      if (removeDownloadedArchiveOnFailure) {
        await fs.rm(archivePath, { force: true });
      }
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
    await (options.extractArchive || extractSkillZipArchive)(archivePath, tempInstallPath, options.signal);
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
    if (removeDownloadedArchiveOnFailure) {
      await fs.rm(archivePath, { force: true });
    }
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
