/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscGitRemoteTransport } from './remote-sync-types';

const MAX_GIT_URL_LENGTH = 2048;
const MAX_GIT_BRANCH_LENGTH = 255;
const MAX_GIT_SUBDIRECTORY_LENGTH = 1024;

export type GitRepositoryUrlSyntaxResult =
  | { valid: true; url: string; transport: VscGitRemoteTransport }
  | { valid: false; reason: 'invalid-url' | 'unsupported-url-protocol' }
  | { valid: false; reason: 'url-credentials-forbidden'; transport: VscGitRemoteTransport };

export type GitBranchSyntaxResult = { valid: true; branch: string } | { valid: false; reason: 'invalid-branch' };

export type GitSubdirectorySyntaxResult =
  | { valid: true; subdirectory: string }
  | { valid: false; reason: 'invalid-subdirectory' };

export function normalizeGitRepositoryUrlSyntax(value: string): GitRepositoryUrlSyntaxResult {
  if (value.length === 0 || value.length > MAX_GIT_URL_LENGTH || value.trim() !== value || /[\0\r\n]/u.test(value)) {
    return { valid: false, reason: 'invalid-url' };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, reason: 'invalid-url' };
  }

  const transport = protocolToTransport(url.protocol);
  if (!transport) {
    return { valid: false, reason: 'unsupported-url-protocol' };
  }
  if (!url.hostname || !url.pathname || url.pathname === '/' || url.search || url.hash) {
    return { valid: false, reason: 'invalid-url' };
  }
  if (url.username || url.password) {
    return { valid: false, reason: 'url-credentials-forbidden', transport };
  }
  if (url.pathname.includes('\\')) {
    return { valid: false, reason: 'invalid-url' };
  }

  return { valid: true, url: url.toString(), transport };
}

export function validateGitBranchSyntax(branch: string): GitBranchSyntaxResult {
  if (
    !branch ||
    branch.length > MAX_GIT_BRANCH_LENGTH ||
    branch.trim() !== branch ||
    branch === '@' ||
    branch === 'HEAD' ||
    branch.startsWith('-') ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.endsWith('.') ||
    branch.startsWith('refs/') ||
    branch.includes('//') ||
    branch.includes('..') ||
    branch.includes('@{') ||
    hasInvalidGitRefCharacter(branch) ||
    branch.split('/').some((segment) => !segment || segment.startsWith('.') || segment.endsWith('.lock'))
  ) {
    return { valid: false, reason: 'invalid-branch' };
  }

  return { valid: true, branch };
}

export function validateGitSubdirectorySyntax(subdirectory: string): GitSubdirectorySyntaxResult {
  if (
    !subdirectory ||
    subdirectory.length > MAX_GIT_SUBDIRECTORY_LENGTH ||
    subdirectory.trim() !== subdirectory ||
    subdirectory.startsWith('/') ||
    subdirectory.endsWith('/') ||
    subdirectory.includes('\\') ||
    subdirectory.includes('\0')
  ) {
    return { valid: false, reason: 'invalid-subdirectory' };
  }

  const segments = subdirectory.split('/');
  if (
    segments.some(
      (segment) => !segment || segment === '.' || segment === '..' || segment.toLocaleLowerCase('en-US') === '.git',
    )
  ) {
    return { valid: false, reason: 'invalid-subdirectory' };
  }

  return { valid: true, subdirectory: segments.join('/') };
}

function protocolToTransport(protocol: string): VscGitRemoteTransport | null {
  if (protocol === 'http:') {
    return 'http';
  }
  if (protocol === 'https:') {
    return 'https';
  }
  return null;
}

function hasInvalidGitRefCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f || '~^:?*[\\'.includes(character)) {
      return true;
    }
  }
  return false;
}
