/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swaggerDocument from '../../swagger';
import { runJSSourceActionNames, vscFileActionNames } from '@nocobase/runjs-workspace/server';
import { lightExtensionEntryActionNames } from '../resources/lightExtensionEntries';
import { lightExtensionFileActionNames } from '../resources/lightExtensionFiles';
import { lightExtensionReferenceActionNames } from '../resources/lightExtensionReferences';
import { lightExtensionRepoActionNames } from '../resources/lightExtensionRepos';
import { lightExtensionActionNames } from '../resources/lightExtensions';

const publicActions = {
  lightExtensionRepos: ['list', 'get'],
  lightExtensionEntries: ['get', 'listSelectable'],
  lightExtensionReferences: ['readReferences'],
  lightExtensionFiles: ['pull', 'getFile', 'saveSource'],
  lightExtensions: ['compileWorkspacePreview', 'moveSource', 'moveToInline'],
  runJSSources: ['open', 'openLatest', 'compilePreview', 'save', 'saveChanges'],
  vscFile: [
    'createRepository',
    'getRepository',
    'archiveRepository',
    'pull',
    'getFile',
    'push',
    'listCommits',
    'getCommit',
    'diff',
    'diffFile',
    'restoreFile',
    'restoreCommit',
    'listRefs',
    'updateRef',
  ],
} as const;

describe('light-extension swagger', () => {
  it('exports only the public authoring action allowlist and keeps it aligned with registered resource actions', () => {
    const registeredActions = {
      lightExtensionRepos: lightExtensionRepoActionNames,
      lightExtensionEntries: lightExtensionEntryActionNames,
      lightExtensionReferences: lightExtensionReferenceActionNames,
      lightExtensionFiles: lightExtensionFileActionNames,
      lightExtensions: lightExtensionActionNames,
      runJSSources: runJSSourceActionNames,
      vscFile: vscFileActionNames,
    };
    const expectedPaths = Object.entries(publicActions)
      .flatMap(([resource, actions]) => actions.map((action) => `/${resource}:${action}`))
      .sort();

    expect(Object.keys(swaggerDocument.paths).sort()).toEqual(expectedPaths);

    for (const [resource, actions] of Object.entries(publicActions)) {
      for (const action of actions) {
        expect(registeredActions[resource as keyof typeof registeredActions]).toContain(action);
        expect(swaggerDocument.paths[`/${resource}:${action}`].post).toBeTruthy();
      }
    }
  });

  it('keeps shared schemas and save/preview status contracts public', () => {
    const schemas = swaggerDocument.components.schemas;
    const saveSource = swaggerDocument.paths['/lightExtensionFiles:saveSource'].post;
    const saveRequest = saveSource.requestBody.content['application/json'].schema;
    const preview = swaggerDocument.paths['/lightExtensions:compileWorkspacePreview'].post;
    const previewRequest = preview.requestBody.content['application/json'].schema;

    for (const schemaName of [
      'LightExtensionWorkspaceFile',
      'LightExtensionFileChange',
      'LightExtensionSourceBinding',
      'LightExtensionCompileArtifactSummary',
      'LightExtensionDiagnostic',
      'LightExtensionErrorResponse',
      'RunJSSourceWorkspaceFile',
      'RunJSSourceSettingsDescriptor',
    ] as const) {
      expect(schemas[schemaName], schemaName).toBeTruthy();
    }
    expect(schemas.LightExtensionSourceBinding.properties.kind).toEqual({
      $ref: '#/components/schemas/LightExtensionKind',
    });
    expect(schemas.LightExtensionDiagnostic.required).toEqual(expect.arrayContaining(['code', 'severity', 'message']));
    expect(schemas.LightExtensionErrorResponse.properties.errors.items).toEqual({
      $ref: '#/components/schemas/LightExtensionErrorItem',
    });
    expect(saveRequest.properties.expectedHeadCommitId).toEqual({
      $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
    });
    expect(saveRequest.properties.files.items).toEqual({
      $ref: '#/components/schemas/LightExtensionFileChange',
    });
    expect(previewRequest.properties.files.items).toEqual({
      $ref: '#/components/schemas/LightExtensionWorkspaceFile',
    });
    expect(saveSource.responses).toHaveProperty('409');
    for (const status of [200, 207, 409, 422]) {
      expect(preview.responses).toHaveProperty(String(status));
    }
  });

  it('documents exactly the five retained authoring kinds, including JS Page', () => {
    expect(swaggerDocument.components.schemas.LightExtensionKind.enum).toEqual([
      'js-block',
      'js-page',
      'js-field',
      'js-action',
      'js-item',
    ]);
  });

  it('keeps source migration and reusable Entry contracts public', () => {
    const schemas = swaggerDocument.components.schemas;
    const moveSource = swaggerDocument.paths['/lightExtensions:moveSource'].post;
    const moveToInline = swaggerDocument.paths['/lightExtensions:moveToInline'].post;
    const listSelectable = swaggerDocument.paths['/lightExtensionEntries:listSelectable'].post;

    expect(moveSource.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/LightExtensionMoveSourceRequest',
    });
    expect(schemas.LightExtensionMoveSourceRequest.required).toEqual(
      expect.arrayContaining(['locator', 'files', 'destination', 'entryName']),
    );
    expect(schemas.LightExtensionMoveSourceDestination.oneOf).toEqual([
      expect.objectContaining({ required: ['type', 'repoId'] }),
      expect.objectContaining({ required: ['type', 'name'] }),
    ]);

    expect(moveToInline.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/LightExtensionMoveToInlineRequest',
    });
    expect(schemas.LightExtensionMoveToInlineRequest.required).toContain('idempotencyKey');
    expect(schemas.LightExtensionSelectableEntryListEnvelope.properties.data.items).toEqual({
      $ref: '#/components/schemas/LightExtensionSelectableEntry',
    });
    for (const operation of [moveSource, moveToInline]) {
      expect(operation.responses).toHaveProperty('200');
      expect(operation.responses).toHaveProperty('409');
      expect(operation.responses).toHaveProperty('422');
    }
    expect(listSelectable.responses).toHaveProperty('200');
  });
});
