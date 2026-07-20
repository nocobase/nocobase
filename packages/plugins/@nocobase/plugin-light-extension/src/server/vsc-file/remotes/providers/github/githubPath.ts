/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSyncError } from '../../RemoteSyncAdapter';

const maxOwnerLength = 39;
const maxRepositoryLength = 100;
const maxBranchLength = 255;
const maxSubdirectoryLength = 1024;

export function normalizeGitHubOwner(value: unknown): string {
  const owner = requireTrimmedString(value, 'owner', maxOwnerLength);
  if (!/^(?!-)(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/u.test(owner)) {
    throw invalidConfig('GitHub owner is invalid', 'invalid-owner');
  }
  return owner;
}

export function normalizeGitHubRepository(value: unknown): string {
  const repository = requireTrimmedString(value, 'repository', maxRepositoryLength);
  if (!/^[A-Za-z0-9_.-]+$/u.test(repository) || repository === '.' || repository === '..') {
    throw invalidConfig('GitHub repository is invalid', 'invalid-repository');
  }
  return repository;
}

export function normalizeGitHubBranch(value: unknown): string {
  if (typeof value !== 'string' || value.trim() !== value || value.length > maxBranchLength) {
    throw invalidConfig('GitHub branch is invalid', 'invalid-branch');
  }
  if (!value) {
    return '';
  }
  if (
    value === '@' ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.endsWith('.') ||
    value.startsWith('refs/') ||
    value.includes('//') ||
    value.includes('..') ||
    value.includes('@{') ||
    hasInvalidRefCharacter(value) ||
    value.split('/').some((segment) => !segment || segment.startsWith('.') || segment.endsWith('.lock'))
  ) {
    throw invalidConfig('GitHub branch is invalid', 'invalid-branch');
  }
  return value;
}

export function normalizeGitHubSubdirectory(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || value.trim() !== value || value.length > maxSubdirectoryLength) {
    throw invalidConfig('GitHub subdirectory is invalid', 'invalid-subdirectory');
  }
  if (value.startsWith('/') || value.endsWith('/') || value.includes('\\')) {
    throw invalidConfig('GitHub subdirectory must be a POSIX relative path', 'invalid-subdirectory');
  }
  const segments = value.split('/');
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment.toLocaleLowerCase('en-US') === '.git' ||
        segment.includes('\0'),
    )
  ) {
    throw invalidConfig('GitHub subdirectory contains an unsafe path segment', 'invalid-subdirectory');
  }
  return segments.join('/');
}

export function githubRepositoryPath(owner: string, repository: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
}

export function githubRefPath(owner: string, repository: string, branch: string): string {
  return `${githubRepositoryPath(owner, repository)}/git/ref/heads/${encodeURIComponent(branch)}`;
}

export function githubObjectPath(
  owner: string,
  repository: string,
  objectType: 'commits' | 'trees' | 'blobs',
  sha: string,
): string {
  return `${githubRepositoryPath(owner, repository)}/git/${objectType}/${encodeURIComponent(sha)}`;
}

export function isPathInSubdirectory(path: string, subdirectory: string | null): boolean {
  return subdirectory === null || path.startsWith(`${subdirectory}/`);
}

export function stripGitHubSubdirectory(path: string, subdirectory: string | null): string {
  return subdirectory === null ? path : path.slice(subdirectory.length + 1);
}

export function addGitHubSubdirectory(path: string, subdirectory: string | null): string {
  return subdirectory === null ? path : `${subdirectory}/${path}`;
}

function requireTrimmedString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value || value.trim() !== value || value.length > maxLength) {
    throw invalidConfig(`GitHub ${field} is invalid`, `invalid-${field}`);
  }
  return value;
}

function invalidConfig(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CONFIG_INVALID', message, {
    details: { provider: 'github', reasonCode },
  });
}

function hasInvalidRefCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f || '~^:?*[\\'.includes(character)) {
      return true;
    }
  }
  return false;
}
