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
  status: 'installed' | 'failed';
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
  extractArchive?: (archivePath: string, destination: string) => Promise<void>;
  writeInstallStatus?: (payload: NodeSkillInstallPayload) => Promise<void>;
  downloadTimeoutMs?: number;
  downloadHeaders?: Record<string, string>;
  trustedArchiveServerUrl?: string;
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

async function sha256File(filePath: string) {
  const hash = createHash('sha256');
  const file = await fs.open(filePath, 'r');
  try {
    for await (const chunk of file.createReadStream()) {
      hash.update(chunk);
    }
  } finally {
    await file.close();
  }
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
) {
  if (redirectCount > 5) {
    throw new Error('Too many redirects while downloading Skill archive');
  }
  const url = new URL(archiveUrl);
  const transport = url.protocol === 'https:' ? https : http;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const request = transport.get(url, { headers }, (response) => {
      const statusCode = response.statusCode || 0;
      const location = response.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location) {
        response.resume();
        const redirectedUrl = new URL(location, url).toString();
        const redirectedHeaders = new URL(redirectedUrl).origin === url.origin ? headers : {};
        downloadArchive(redirectedUrl, destination, timeoutMs, redirectedHeaders, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (statusCode < 200 || statusCode >= 300) {
        reject(new Error(`Failed to download Skill archive: HTTP ${statusCode}`));
        response.resume();
        return;
      }
      const output = createWriteStream(destination, {
        mode: 0o600,
      });
      response.pipe(output);
      output.on('finish', () => {
        output.close();
        resolve();
      });
      output.on('error', reject);
    });
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Skill archive download timed out: ${archiveUrl}`));
    });
    request.on('error', reject);
  });
}

async function runProcessOutput(command: string, args: string[]) {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
  });
}

async function validateZipEntries(archivePath: string) {
  const names = (await runProcessOutput('zipinfo', ['-1', archivePath]))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!names.length) {
    throw new Error('Skill archive is empty');
  }
  for (const name of names) {
    if (!isSafeZipEntryName(name)) {
      throw new Error(`Unsafe Skill archive entry path: ${name}`);
    }
  }

  const listing = await runProcessOutput('zipinfo', ['-l', archivePath]);
  for (const line of listing.split(/\r?\n/)) {
    const match = line.match(ZIPINFO_MODE_PATTERN);
    if (!match) {
      continue;
    }
    if (match[1] !== '-' && match[1] !== 'd') {
      throw new Error('Skill archive may only contain regular files and directories');
    }
  }
}

async function validateExtractedTree(root: string) {
  const realRoot = await fs.realpath(root);
  async function visit(currentPath: string) {
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
        await visit(path.join(currentPath, entry));
      }
    }
  }
  await visit(realRoot);
}

async function extractZipWithSystemUnzip(archivePath: string, destination: string) {
  await validateZipEntries(archivePath);
  await fs.mkdir(destination, { recursive: true });
  await runProcessOutput('unzip', ['-q', archivePath, '-d', destination]);
  await validateExtractedTree(destination);
}

export async function validateSkillZipArchive(archivePath: string) {
  const validationPath = path.join(path.dirname(archivePath), `.agent-gateway-validate-${randomUUID()}`);
  await fs.rm(validationPath, { recursive: true, force: true });
  try {
    await extractZipWithSystemUnzip(archivePath, validationPath);
    const skillMdPath = await findSkillMd(validationPath);
    if (!skillMdPath) {
      throw new Error('Skill archive must contain a standard Agent Skills SKILL.md file');
    }
  } finally {
    await fs.rm(validationPath, { recursive: true, force: true });
  }
}

async function findSkillMd(root: string): Promise<string | null> {
  const realRoot = await fs.realpath(root);
  const validateSkillFile = async (candidate: string) => {
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
    // Continue scanning one-level archive wrappers.
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = path.join(root, entry.name, 'SKILL.md');
      try {
        const skillMdPath = await validateSkillFile(nested);
        if (skillMdPath) {
          return skillMdPath;
        }
      } catch {
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
) {
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
  await downloadArchive(archiveUrl, archivePath, timeoutMs, archiveHeaders);
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
  if (
    archive.origin !== trustedServer.origin ||
    !/^\/api\/agent-gateway\/skill-versions\/[^/]+\/archive:download$/.test(archive.pathname)
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
  const source = normalizeSkillVersionSource(options.skillVersion.source);
  const sourceDigest = getSourceDigest(source);
  const installPath = getInstallPath(options.skillsRoot, options.skillVersion.skillVersionId);
  const markerPath = path.join(installPath, '.agent-gateway-install.json');
  const existingMarker = await readMarker(markerPath);
  const existingSkillMd = existingMarker ? await findSkillMd(installPath) : null;

  if (
    existingMarker?.skillVersionId === options.skillVersion.skillVersionId &&
    existingMarker.sourceDigest === sourceDigest &&
    existingSkillMd
  ) {
    await options.writeInstallStatus?.(
      buildInstallPayload({
        nodeId: options.nodeId,
        skillVersion: options.skillVersion,
        installPath,
        skillMdPath: existingSkillMd,
        installedAt: existingMarker.installedAt,
      }),
    );
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
  );
  if (source.sha256) {
    const actualDigest = await sha256File(archivePath);
    if (actualDigest !== source.sha256) {
      throw new Error('Skill archive sha256 does not match the solidified source');
    }
  }

  const tempInstallPath = `${installPath}.tmp-${randomUUID()}`;
  await fs.rm(tempInstallPath, { recursive: true, force: true });
  await fs.mkdir(tempInstallPath, { recursive: true });
  try {
    await (options.extractArchive || extractZipWithSystemUnzip)(archivePath, tempInstallPath);
    await validateExtractedTree(tempInstallPath);
    const tempSkillMdPath = await findSkillMd(tempInstallPath);
    if (!tempSkillMdPath) {
      throw new Error('Skill archive must contain a standard Agent Skills SKILL.md file');
    }
    await fs.rm(installPath, { recursive: true, force: true });
    await fs.rename(tempInstallPath, installPath);
  } catch (error) {
    await fs.rm(tempInstallPath, { recursive: true, force: true });
    throw error;
  }
  const skillMdPath = await findSkillMd(installPath);
  if (!skillMdPath) {
    throw new Error('Skill archive must contain a standard Agent Skills SKILL.md file');
  }

  const installedAt = new Date().toISOString();
  const marker: InstallMarker = {
    skillVersionId: options.skillVersion.skillVersionId,
    sourceDigest,
    installedAt,
  };
  await fs.writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
  await options.writeInstallStatus?.(
    buildInstallPayload({
      nodeId: options.nodeId,
      skillVersion: options.skillVersion,
      installPath,
      skillMdPath,
      installedAt,
    }),
  );

  return {
    skillVersionId: options.skillVersion.skillVersionId,
    installPath,
    idempotent: false,
    status: 'installed',
    sourceDigest,
  };
}
