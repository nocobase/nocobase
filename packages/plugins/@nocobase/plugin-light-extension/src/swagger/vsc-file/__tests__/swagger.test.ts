/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';

import swagger from '..';

test('marks owner-aware RunJS workspace operations as internal MCP actions', () => {
  expect(swagger['x-mcp']).toBe(false);
  expect(Object.keys(swagger.paths)).toEqual(
    expect.arrayContaining([
      '/runJSSources:compilePreview',
      '/runJSSources:open',
      '/runJSSources:openLatest',
      '/runJSSources:save',
    ]),
  );
  expect(Object.keys(swagger.paths)).not.toEqual(
    expect.arrayContaining([
      '/runJSSources:exportZip',
      '/runJSSources:importZip',
      '/runJSSources:restoreFromCode',
      '/vscFile:push',
    ]),
  );
  for (const path of Object.values(swagger.paths)) {
    expect(path.post['x-mcp']).toBe(false);
  }
});

test('documents save as a guarded complete snapshot', () => {
  const save = swagger.paths['/runJSSources:save'].post;
  const schema = save.requestBody.content['application/json'].schema;

  expect(schema.required).toEqual(['locator', 'baseCommitId', 'baseOwnerFingerprint', 'message', 'files']);
  expect(schema.properties).not.toHaveProperty('expectedHeadCommitId');
  expect(save.description).toContain('complete snapshot');
  expect(save.description).toContain('omitted from files is deleted');
  expect(save.description).toContain('baseCommitId');
  expect(save.description).toContain('baseOwnerFingerprint');
});

test('documents openLatest missing-workspace discovery without repository creation', () => {
  const openLatest = swagger.paths['/runJSSources:openLatest'].post;
  const repository = swagger.components.schemas.RunJSSourceRepository;

  expect(openLatest.description).toContain('does not create a missing repository');
  expect(openLatest.description).toContain('repoId/id empty');
  expect(openLatest.description).toContain('headCommitId null');
  expect(openLatest.responses).not.toHaveProperty('409');
  expect(swagger.paths['/runJSSources:open'].post.responses).toHaveProperty('409');
  expect(repository.required).toEqual(expect.arrayContaining(['id', 'repoId', 'headCommitId']));
});
