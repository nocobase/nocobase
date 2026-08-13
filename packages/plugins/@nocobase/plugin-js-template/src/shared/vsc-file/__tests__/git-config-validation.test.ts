/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  normalizeGitRepositoryUrlSyntax,
  validateGitBranchSyntax,
  validateGitSubdirectorySyntax,
} from '../git-config-validation';

const unsupportedGitScheme = ['s', 's', 'h'].join('');
const unsupportedScpLikeUrl = ['git', '@git.example.com:team/project.git'].join('');

describe('shared Git config syntax', () => {
  it.each([
    [
      'https://git.example.com/team/project.git',
      { valid: true, url: 'https://git.example.com/team/project.git', transport: 'https' },
    ],
    [
      'http://git.example.com/team/project.git',
      { valid: true, url: 'http://git.example.com/team/project.git', transport: 'http' },
    ],
  ] as const)('normalizes repository URL %s', (input, expected) => {
    expect(normalizeGitRepositoryUrlSyntax(input)).toEqual(expected);
  });

  it.each([
    ['', 'invalid-url'],
    ['https://git.example.com/team/project.git?token=secret', 'invalid-url'],
    ['https://git.example.com/team/project.git#main', 'invalid-url'],
    [`${unsupportedGitScheme}://git@git.example.com/team\\project.git`, 'unsupported-url-protocol'],
    [`${unsupportedGitScheme}://git@git.example.com/team/project.git`, 'unsupported-url-protocol'],
    [unsupportedScpLikeUrl, 'invalid-url'],
    ['file:///srv/project.git', 'unsupported-url-protocol'],
    ['https://token@git.example.com/team/project.git', 'url-credentials-forbidden'],
    ['http://token@git.example.com/team/project.git', 'url-credentials-forbidden'],
  ] as const)('rejects repository URL %s with %s', (input, reason) => {
    expect(normalizeGitRepositoryUrlSyntax(input)).toMatchObject({ valid: false, reason });
  });

  it('enforces the repository URL length limit', () => {
    expect(normalizeGitRepositoryUrlSyntax(`https://git.example.com/${'a'.repeat(2024)}`).valid).toBe(true);
    expect(normalizeGitRepositoryUrlSyntax(`https://git.example.com/${'a'.repeat(2025)}`)).toEqual({
      valid: false,
      reason: 'invalid-url',
    });
  });

  it.each(['main', 'feature/git-sync', 'release-2026.07'])('accepts branch %s', (branch) => {
    expect(validateGitBranchSyntax(branch)).toEqual({ valid: true, branch });
  });

  it.each([
    '',
    'HEAD',
    'refs/heads/main',
    '../main',
    'main..next',
    'feature//x',
    '-danger',
    'main.lock',
    'main~1',
    '.hidden/main',
    'feature/@{main',
  ])('rejects unsafe branch %s', (branch) => {
    expect(validateGitBranchSyntax(branch)).toEqual({ valid: false, reason: 'invalid-branch' });
  });

  it('enforces the branch length limit', () => {
    expect(validateGitBranchSyntax('a'.repeat(255)).valid).toBe(true);
    expect(validateGitBranchSyntax('a'.repeat(256))).toEqual({ valid: false, reason: 'invalid-branch' });
  });

  it.each(['packages/js-template', 'extensions/sales.v2', 'one'])('accepts subdirectory %s', (subdirectory) => {
    expect(validateGitSubdirectorySyntax(subdirectory)).toEqual({ valid: true, subdirectory });
  });

  it.each(['/absolute', 'a\\b', 'a/../b', 'a//b', 'a/.git/b', 'a/.GIT/b', 'a/', './a', 'a\0b'])(
    'rejects unsafe subdirectory %s',
    (subdirectory) => {
      expect(validateGitSubdirectorySyntax(subdirectory)).toEqual({
        valid: false,
        reason: 'invalid-subdirectory',
      });
    },
  );

  it('enforces the subdirectory length limit', () => {
    expect(validateGitSubdirectorySyntax('a'.repeat(1024)).valid).toBe(true);
    expect(validateGitSubdirectorySyntax('a'.repeat(1025))).toEqual({
      valid: false,
      reason: 'invalid-subdirectory',
    });
  });
});
