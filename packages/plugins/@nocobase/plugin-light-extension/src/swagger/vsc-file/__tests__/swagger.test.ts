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

test('publishes only owner-aware RunJS workspace authoring actions', () => {
  expect(Object.keys(swagger.paths)).toEqual(
    expect.arrayContaining([
      '/runJSSources:compilePreview',
      '/runJSSources:open',
      '/runJSSources:openLatest',
      '/runJSSources:save',
      '/runJSSources:saveChanges',
      '/lightExtensionFiles:saveSource',
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

test('documents saveChanges as an explicit delta with per-path blob guards', () => {
  const saveChanges = swagger.paths['/runJSSources:saveChanges'].post;
  const schema = saveChanges.requestBody.content['application/json'].schema;
  const changeSchema = swagger.components.schemas.RunJSSourceIncrementalFileChange;
  const [upsert, deletion] = changeSchema.oneOf;

  expect(schema.required).toEqual(['locator', 'repoId', 'baseCommitId', 'baseOwnerFingerprint', 'message', 'changes']);
  expect(schema.properties).not.toHaveProperty('files');
  expect(schema.properties.changes.items).toEqual({
    $ref: '#/components/schemas/RunJSSourceIncrementalFileChange',
  });
  expect(saveChanges.description).toContain('omitted workspace path remains unchanged');
  expect(saveChanges.description).toContain('explicit operation: "delete"');
  expect(saveChanges.description).toContain('complete UTF-8 content of that changed file only');
  expect(saveChanges.description).toContain('RUNJS_FILE_CONFLICT');
  expect(saveChanges.description).toContain('.nocobase/runjs-source.json is server-managed');
  expect(upsert.required).toEqual(['operation', 'path', 'expectedBlobHash', 'content']);
  expect(upsert.properties.expectedBlobHash).toMatchObject({ nullable: true, pattern: '^[a-f0-9]{64}$' });
  expect(deletion.required).toEqual(['operation', 'path', 'expectedBlobHash']);
  expect(deletion.properties.expectedBlobHash).toMatchObject({ pattern: '^[a-f0-9]{64}$' });
});

test('documents stable blob metadata and managed files in open results', () => {
  const files = swagger.components.schemas.RunJSSourceOpenResult.properties.files;
  const workspaceFile = swagger.components.schemas.RunJSSourceWorkspaceFile;

  expect(files.items).toEqual({ $ref: '#/components/schemas/RunJSSourceWorkspaceFile' });
  expect(workspaceFile.required).toEqual(['path', 'blobHash', 'size', 'managed']);
  expect(workspaceFile.properties.blobHash.pattern).toBe('^[a-f0-9]{64}$');
  expect(workspaceFile.properties.managed.description).toContain('cannot be changed through ordinary saveChanges');
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
