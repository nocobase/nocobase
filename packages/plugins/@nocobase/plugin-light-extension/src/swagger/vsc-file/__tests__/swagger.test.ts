/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';

import swagger from '../..';

test('documents exactly the four retained RunJS source locator kinds', () => {
  const locator = swagger.components.schemas.RunJSSourceLocator;

  expect(locator.oneOf.map((schema) => schema.properties.kind.enum[0])).toEqual([
    'flowModel.step',
    'flowModel.flowRegistry.runjs',
    'chart.option',
    'chart.events',
  ]);
});

test('keeps complete-snapshot and guarded-delta save schemas distinct', () => {
  const save = swagger.paths['/runJSSources:save'].post;
  const saveChanges = swagger.paths['/runJSSources:saveChanges'].post;
  const saveSchema = save.requestBody.content['application/json'].schema;
  const changesSchema = saveChanges.requestBody.content['application/json'].schema;
  const changeSchema = swagger.components.schemas.RunJSSourceIncrementalFileChange;
  const [upsert, deletion] = changeSchema.oneOf;

  expect(saveSchema.properties).toHaveProperty('files');
  expect(saveSchema.properties).not.toHaveProperty('changes');
  expect(changesSchema.properties).toHaveProperty('changes');
  expect(changesSchema.properties).not.toHaveProperty('files');
  expect(upsert.required).toEqual(expect.arrayContaining(['operation', 'path', 'expectedBlobHash', 'content']));
  expect(upsert.properties.expectedBlobHash).toMatchObject({ nullable: true, pattern: '^[a-f0-9]{64}$' });
  expect(deletion.required).toEqual(expect.arrayContaining(['operation', 'path', 'expectedBlobHash']));
  expect(deletion.properties.expectedBlobHash).toMatchObject({ pattern: '^[a-f0-9]{64}$' });
});

test('keeps open metadata and missing-workspace status contracts public', () => {
  const workspaceFile = swagger.components.schemas.RunJSSourceWorkspaceFile;
  const repository = swagger.components.schemas.RunJSSourceRepository;
  const openLatest = swagger.paths['/runJSSources:openLatest'].post;

  expect(workspaceFile.required).toEqual(expect.arrayContaining(['path', 'blobHash', 'size', 'managed']));
  expect(workspaceFile.properties.blobHash.pattern).toBe('^[a-f0-9]{64}$');
  expect(openLatest.responses).not.toHaveProperty('409');
  expect(swagger.paths['/runJSSources:open'].post.responses).toHaveProperty('409');
  expect(repository.required).toEqual(expect.arrayContaining(['id', 'repoId', 'headCommitId']));
});

test('documents the complete raw VSC compatibility resource without exposing protected owners', () => {
  const rawPaths = Object.keys(swagger.paths)
    .filter((path) => path.startsWith('/vscFile:'))
    .sort();

  expect(rawPaths).toEqual(
    [
      'archiveRepository',
      'createRepository',
      'diff',
      'diffFile',
      'getCommit',
      'getFile',
      'getRepository',
      'listCommits',
      'listRefs',
      'pull',
      'push',
      'restoreCommit',
      'restoreFile',
      'updateRef',
    ].map((action) => `/vscFile:${action}`),
  );
  expect(swagger.paths['/vscFile:push'].post).toMatchObject({
    tags: ['vscFile'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            required: ['repoId', 'baseCommitId', 'message', 'files'],
          },
        },
      },
    },
  });
  expect(swagger.paths['/vscFile:push'].post.description).toContain('protected RunJS and light-extension repositories');
});
