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
import { jsTemplateActionNames } from '../resources/jsTemplates';
import { jsTemplateFileActionNames } from '../resources/jsTemplateFiles';
import { jsTemplateUsageActionNames } from '../resources/jsTemplateUsages';
import { jsTemplateProjectActionNames } from '../resources/jsTemplateProjects';

const publicActions = {
  jsTemplateProjects: ['list', 'get'],
  jsTemplates: [
    'listCatalog',
    'get',
    'listSelectable',
    'compileWorkspacePreview',
    'saveAsJsTemplate',
    'detachToInline',
  ],
  jsTemplateUsages: ['listUsages'],
  jsTemplateFiles: ['pull', 'getFile', 'saveSource'],
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

describe('js-template swagger', () => {
  it('exports only the public authoring action allowlist and keeps it aligned with registered resource actions', () => {
    const registeredActions = {
      jsTemplateProjects: jsTemplateProjectActionNames,
      jsTemplates: jsTemplateActionNames,
      jsTemplateUsages: jsTemplateUsageActionNames,
      jsTemplateFiles: jsTemplateFileActionNames,
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

  it('documents JS Template resources directly with canonical tags and terminology', () => {
    for (const resource of ['jsTemplateProjects', 'jsTemplates', 'jsTemplateUsages', 'jsTemplateFiles'] as const) {
      const actions = publicActions[resource];
      for (const action of actions) {
        const operation = swaggerDocument.paths[`/${resource}:${action}`].post;

        expect(operation.tags).toEqual([resource]);
        expect(`${operation.summary}\n${operation.description ?? ''}`).not.toMatch(/light[ -]extension/iu);
      }
    }
  });

  it('keeps shared schemas and save/preview status contracts public', () => {
    const schemas = swaggerDocument.components.schemas;
    const saveSource = swaggerDocument.paths['/jsTemplateFiles:saveSource'].post;
    const saveRequest = saveSource.requestBody.content['application/json'].schema;
    const preview = swaggerDocument.paths['/jsTemplates:compileWorkspacePreview'].post;
    const previewRequest = preview.requestBody.content['application/json'].schema;

    for (const schemaName of [
      'JsTemplateWorkspaceFile',
      'JsTemplateFileChange',
      'JsTemplateSourceBinding',
      'JsTemplateCompileArtifactSummary',
      'JsTemplateDiagnostic',
      'JsTemplateErrorResponse',
      'RunJSSourceWorkspaceFile',
      'RunJSSourceSettingsDescriptor',
    ] as const) {
      expect(schemas[schemaName], schemaName).toBeTruthy();
    }
    expect(schemas.JsTemplateSourceBinding.properties.kind).toEqual({
      $ref: '#/components/schemas/JsTemplateKind',
    });
    expect(schemas.JsTemplateSourceBinding.properties).toEqual({
      type: {
        type: 'string',
        enum: ['js-template-entry'],
      },
      projectId: {
        type: 'string',
      },
      templateId: {
        type: 'string',
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
    });
    expect(schemas.JsTemplateSourceBinding.additionalProperties).toBe(false);
    expect(schemas.JsTemplateDiagnostic.required).toEqual(expect.arrayContaining(['code', 'severity', 'message']));
    expect(schemas.JsTemplateErrorResponse.properties.errors.items).toEqual({
      $ref: '#/components/schemas/JsTemplateErrorItem',
    });
    expect(saveRequest.properties.expectedHeadCommitId).toEqual({
      $ref: '#/components/schemas/JsTemplateExpectedHeadCommitId',
    });
    expect(saveRequest.properties.files.items).toEqual({
      $ref: '#/components/schemas/JsTemplateFileChange',
    });
    expect(previewRequest.properties.files.items).toEqual({
      $ref: '#/components/schemas/JsTemplateWorkspaceFile',
    });
    expect(saveSource.responses).toHaveProperty('409');
    for (const status of [200, 207, 409, 422]) {
      expect(preview.responses).toHaveProperty(String(status));
    }
  });

  it('documents exactly the five retained authoring kinds, including JS Page', () => {
    expect(swaggerDocument.components.schemas.JsTemplateKind.enum).toEqual([
      'js-block',
      'js-page',
      'js-field',
      'js-action',
      'js-item',
    ]);
  });

  it('keeps source relocation and reusable Template contracts public', () => {
    const schemas = swaggerDocument.components.schemas;
    const saveAsJsTemplate = swaggerDocument.paths['/jsTemplates:saveAsJsTemplate'].post;
    const detachToInline = swaggerDocument.paths['/jsTemplates:detachToInline'].post;
    const listSelectable = swaggerDocument.paths['/jsTemplates:listSelectable'].post;

    expect(saveAsJsTemplate.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/SaveAsJsTemplateRequest',
    });
    expect(schemas.SaveAsJsTemplateRequest.required).toEqual(
      expect.arrayContaining(['locator', 'files', 'destination', 'templateName']),
    );
    expect(schemas.SaveAsJsTemplateDestination.oneOf).toEqual([
      expect.objectContaining({ required: ['type', 'projectId'] }),
      expect.objectContaining({ required: ['type', 'name'] }),
    ]);
    expect(schemas.SaveAsJsTemplateDestination.oneOf[0].properties.projectId).toEqual({
      type: 'string',
      description: 'Existing destination JS Template Project id.',
    });
    expect(schemas.SaveAsJsTemplateDestination.oneOf[0].properties).not.toHaveProperty('repoId');

    expect(detachToInline.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/DetachJsTemplateToInlineRequest',
    });
    expect(schemas.DetachJsTemplateToInlineRequest.required).toContain('idempotencyKey');
    expect(schemas.DetachJsTemplateToInlineResult.required).toContain('filesHash');
    expect(schemas.DetachJsTemplateToInlineResult.properties.filesHash).toEqual({
      type: 'string',
      minLength: 1,
    });
    expect(schemas.DetachJsTemplateToInlineResult.properties.sourceRef.properties.repoId).toEqual({
      type: 'string',
    });
    expect(schemas.DetachJsTemplateToInlineResult.properties.sourceRef.properties).not.toHaveProperty('projectId');
    expect(schemas.JsTemplateSelectableTemplateListEnvelope.properties.data.items).toEqual({
      $ref: '#/components/schemas/JsTemplateSelectableTemplate',
    });
    for (const operation of [saveAsJsTemplate, detachToInline]) {
      expect(operation.responses).toHaveProperty('200');
      expect(operation.responses).toHaveProperty('409');
      expect(operation.responses).toHaveProperty('422');
    }
    expect(listSelectable.responses).toHaveProperty('200');
  });

  it('documents the entry-centric catalog projection', () => {
    const schemas = swaggerDocument.components.schemas;
    const listCatalog = swaggerDocument.paths['/jsTemplates:listCatalog'].post;

    expect(listCatalog.responses[200].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/JsTemplateCatalogEntryListEnvelope',
    });
    expect(schemas.JsTemplateCatalogEntry.required).toEqual(
      expect.arrayContaining(['id', 'projectId', 'templateName', 'kind', 'status', 'usageCount']),
    );
    expect(schemas.JsTemplateCatalogEntryListEnvelope.properties.data.items).toEqual({
      $ref: '#/components/schemas/JsTemplateCatalogEntry',
    });
  });
});
