/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swaggerDocument from '../../swagger';
import { lightExtensionEntryActionNames } from '../resources/lightExtensionEntries';
import { lightExtensionFileActionNames } from '../resources/lightExtensionFiles';
import { lightExtensionReferenceActionNames } from '../resources/lightExtensionReferences';
import { lightExtensionRepoActionNames } from '../resources/lightExtensionRepos';
import { lightExtensionActionNames } from '../resources/lightExtensions';
import { runJSSourceActionNames } from '../vsc-file/runjs-sources';

const publicActions = {
  lightExtensionRepos: ['list', 'get'],
  lightExtensionEntries: ['get'],
  lightExtensionReferences: ['readReferences'],
  lightExtensionFiles: ['pull', 'getFile', 'saveSource'],
  lightExtensions: ['compileWorkspacePreview'],
  runJSSources: ['open', 'openLatest', 'compilePreview', 'save'],
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
    };
    const expectedPaths = Object.entries(publicActions)
      .flatMap(([resource, actions]) => actions.map((action) => `/${resource}:${action}`))
      .sort();

    expect(swaggerDocument.openapi).toBe('3.0.2');
    expect(swaggerDocument.info).toMatchObject({
      title: 'NocoBase API - Light extension plugin',
      version: '1.0.0',
    });
    expect(Object.keys(swaggerDocument.paths).sort()).toEqual(expectedPaths);

    for (const [resource, actions] of Object.entries(publicActions)) {
      for (const action of actions) {
        expect(registeredActions[resource as keyof typeof registeredActions]).toContain(action);
        expect(swaggerDocument.paths[`/${resource}:${action}`].post).toBeTruthy();
        expect(Object.keys(swaggerDocument.paths[`/${resource}:${action}`])).toEqual(['post']);
      }
    }
  });

  it('reuses shared schemas for files, bindings, artifacts, diagnostics, errors, and expected Head conflicts', () => {
    const schemas = swaggerDocument.components.schemas;
    const saveSource = swaggerDocument.paths['/lightExtensionFiles:saveSource'].post;
    const saveRequest = saveSource.requestBody.content['application/json'].schema;
    const previewRequest =
      swaggerDocument.paths['/lightExtensions:compileWorkspacePreview'].post.requestBody.content['application/json']
        .schema;

    expect(schemas.LightExtensionWorkspaceFile).toBeTruthy();
    expect(schemas.LightExtensionFileChange).toBeTruthy();
    expect(schemas.LightExtensionSourceBinding.properties.kind).toEqual({
      $ref: '#/components/schemas/LightExtensionKind',
    });
    expect(schemas.LightExtensionCompileEntryResult.properties.artifact).toEqual({
      $ref: '#/components/schemas/LightExtensionCompileArtifactSummary',
    });
    expect(schemas.LightExtensionSaveSourceEntryResult.properties.execution).toMatchObject({
      enum: ['compiled', 'skipped'],
    });
    expect(schemas.LightExtensionEntry.properties).toEqual(
      expect.objectContaining({
        compiledInputKey: expect.objectContaining({ nullable: true }),
        compilerBuildId: expect.objectContaining({ nullable: true }),
      }),
    );
    expect(schemas.LightExtensionDiagnostic.required).toEqual(['code', 'severity', 'message']);
    expect(schemas.LightExtensionDiagnostic.properties).toEqual(
      expect.objectContaining({
        path: expect.objectContaining({ type: 'string' }),
        line: expect.objectContaining({ type: 'integer' }),
        column: expect.objectContaining({ type: 'integer' }),
        kind: { $ref: '#/components/schemas/LightExtensionKind' },
        entryName: expect.objectContaining({ type: 'string' }),
        details: expect.objectContaining({ type: 'object' }),
      }),
    );
    expect(schemas.RunJSSourceOpenResult.required).toContain('settingsDescriptor');
    expect(schemas.RunJSSourceOpenResult.properties.settingsDescriptor).toEqual({
      $ref: '#/components/schemas/RunJSSourceSettingsDescriptor',
    });
    expect(schemas.RunJSSourceSettingsDescriptor.required).toEqual(
      expect.arrayContaining([
        'descriptorPath',
        'entryId',
        'schema',
        'defaults',
        'settingsSchemaHash',
        'settingsDefaultsHash',
        'diagnostics',
      ]),
    );
    expect(schemas.RunJSSourceSettingsDescriptor.properties.settingsSchemaHash.pattern).toBe('^[a-f0-9]{64}$');
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
    expect(saveSource.responses[409].content['application/json'].schema.oneOf).toContainEqual({
      $ref: '#/components/schemas/LightExtensionSourceOutdatedErrorResponse',
    });
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

  it('documents root business payloads, incremental saves, and preview/save status semantics', () => {
    const saveSource = swaggerDocument.paths['/lightExtensionFiles:saveSource'].post;
    const saveRequest = saveSource.requestBody.content['application/json'].schema;
    const preview = swaggerDocument.paths['/lightExtensions:compileWorkspacePreview'].post;
    const previewRequest = preview.requestBody.content['application/json'].schema;

    expect(saveRequest.required).toEqual(['repoId', 'expectedHeadCommitId', 'message', 'files']);
    expect(Object.keys(saveRequest.properties).sort()).toEqual(
      ['expectedHeadCommitId', 'files', 'message', 'repoId'].sort(),
    );
    expect(saveRequest.properties.values).toBeUndefined();
    expect(saveRequest.properties.files.description).toContain('Incremental source patch');
    expect(saveSource.description).toContain('files is a delta');
    expect(saveSource.description).toContain('--body-file');
    expect(saveSource.description).toContain('LIGHT_EXTENSION_SOURCE_OUTDATED');
    expect(Object.keys(saveSource.responses).map(Number).sort()).toEqual([200, 403, 409, 422]);

    expect(previewRequest.required).toEqual(['repoId', 'files']);
    expect(Object.keys(previewRequest.properties).sort()).toEqual(
      ['entryId', 'entryPath', 'expectedHeadCommitId', 'files', 'kind', 'repoId', 'runtimeVersion'].sort(),
    );
    expect(previewRequest.properties.values).toBeUndefined();
    expect(preview.description).toContain('HTTP 200');
    expect(preview.description).toContain('HTTP 207');
    expect(preview.description).toContain('HTTP 422');
    expect(Object.keys(preview.responses).map(Number).sort()).toEqual([200, 207, 403, 409, 422]);
  });
});
