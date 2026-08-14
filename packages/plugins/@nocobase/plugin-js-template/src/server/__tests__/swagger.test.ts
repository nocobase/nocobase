/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swaggerDocument from '../../swagger';
import { runJSSourceActionNames } from '@nocobase/runjs/workspace/server';
import { JS_TEMPLATE_ERROR_CODES } from '../../shared/errors';
import { jsTemplateCreateJobActionNames } from '../resources/jsTemplateCreateJobs';
import { jsTemplateActionNames } from '../resources/jsTemplates';
import { jsTemplateFileActionNames } from '../resources/jsTemplateFiles';
import { jsTemplateUsageActionNames } from '../resources/jsTemplateUsages';
import { jsTemplateProjectActionNames } from '../resources/jsTemplateProjects';
import { jsTemplateSyncActionNames } from '../resources/jsTemplateSync';

const publicActions = {
  jsTemplateProjects: ['create', 'list', 'get'],
  jsTemplateCreateJobs: ['list', 'get', 'retry', 'dismiss'],
  jsTemplates: ['get', 'listSelectable', 'compileWorkspacePreview', 'saveAsJsTemplate', 'detachToInline', 'delete'],
  jsTemplateUsages: ['listUsages'],
  jsTemplateFiles: ['pull', 'getFile', 'saveSource'],
  jsTemplateSync: ['get', 'configure', 'disconnect', 'testConnection', 'plan', 'pull', 'push', 'createFromGit'],
  runJSSources: ['capabilities', 'open', 'openLatest', 'compilePreview', 'save', 'saveChanges'],
} as const;

describe('js-template swagger', () => {
  it('exports only the public authoring action allowlist and keeps it aligned with registered resource actions', () => {
    const registeredActions = {
      jsTemplateProjects: jsTemplateProjectActionNames,
      jsTemplateCreateJobs: jsTemplateCreateJobActionNames,
      jsTemplates: jsTemplateActionNames,
      jsTemplateUsages: jsTemplateUsageActionNames,
      jsTemplateFiles: jsTemplateFileActionNames,
      jsTemplateSync: jsTemplateSyncActionNames,
      runJSSources: runJSSourceActionNames,
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

  it('documents the complete HTTP/HTTPS Git synchronization contract', () => {
    const schemas = swaggerDocument.components.schemas;
    const config = schemas.JsTemplateGitRemoteConfigDraft;
    const outputConfig = schemas.JsTemplateGitRemoteConfigOutput;
    const unsupportedOutputConfig = schemas.JsTemplateUnsupportedGitRemoteConfigOutput;
    const createRequest = schemas.JsTemplateSyncCreateFromGitRequest;

    expect(config.properties).not.toHaveProperty('transport');
    expect(outputConfig.properties.transport).toMatchObject({ enum: ['http', 'https'], readOnly: true });
    expect(unsupportedOutputConfig.properties.transport).toMatchObject({ enum: ['unsupported'], readOnly: true });
    expect(config.properties.url.pattern).toBe('^https?://');
    expect(createRequest).toMatchObject({
      type: 'object',
      required: ['idempotencyKey', 'provider', 'config', 'name'],
      additionalProperties: false,
    });
    expect(createRequest.properties).not.toHaveProperty('projectId');
    expect(createRequest).not.toHaveProperty('allOf');

    for (const action of jsTemplateSyncActionNames) {
      const operation = swaggerDocument.paths[`/jsTemplateSync:${action}`].post;
      expect(operation.responses).toHaveProperty('400');
      expect(operation.responses).toHaveProperty('403');
      expect(operation.responses).toHaveProperty('409');
      expect(operation.responses).toHaveProperty('422');
    }
    expect(swaggerDocument.paths['/jsTemplateSync:createFromGit'].post.responses).toHaveProperty('202');
    expect(schemas.JsTemplateSyncExecutionRequest.required).toEqual(
      expect.arrayContaining([
        'expectedHeadCommitId',
        'expectedRemoteRevision',
        'expectedRemoteTargetVersion',
        'planFingerprint',
      ]),
    );
  });

  it('documents durable starter and ZIP creation plus distinct job mutation semantics', () => {
    const create = swaggerDocument.paths['/jsTemplateProjects:create'].post;
    const createRequest = swaggerDocument.components.schemas.JsTemplateCreateProjectRequest;
    const getJob = swaggerDocument.paths['/jsTemplateCreateJobs:get'].post;
    const retryJob = swaggerDocument.paths['/jsTemplateCreateJobs:retry'].post;
    const dismissJob = swaggerDocument.paths['/jsTemplateCreateJobs:dismiss'].post;

    expect(create.responses).toHaveProperty('202');
    expect(create.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/JsTemplateCreateProjectRequest',
    });
    expect(createRequest.required).toEqual(['idempotencyKey', 'name']);
    expect(createRequest.properties).toHaveProperty('zipBase64');
    expect(getJob.responses).not.toHaveProperty('409');
    expect(retryJob.responses).toHaveProperty('409');
    expect(dismissJob.description).toMatch(/soft-dismiss/iu);
  });

  it('does not expose the raw VSC transport through OpenAPI', () => {
    expect(Object.keys(swaggerDocument.paths)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^\/vscFile:/u)]),
    );
    expect(swaggerDocument.tags.map((tag) => tag.name)).not.toContain('vscFile');
    expect(Object.keys(swaggerDocument.components.schemas)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^RawVscFile/u)]),
    );
  });

  it('does not expose the retired catalog authoring APIs or schemas', () => {
    expect(swaggerDocument.paths).not.toHaveProperty('/jsTemplates:listCatalog');
    expect(swaggerDocument.paths).not.toHaveProperty('/jsTemplateProjects:addTemplate');
    expect(swaggerDocument.components.schemas).not.toHaveProperty('JsTemplateCatalogEntry');
    expect(swaggerDocument.components.schemas).not.toHaveProperty('JsTemplateCatalogEntryListEnvelope');
    expect(swaggerDocument.components.schemas).not.toHaveProperty('JsTemplateCatalogAddTemplateRequest');
  });

  it('documents JS Template resources directly with canonical tags and terminology', () => {
    for (const resource of [
      'jsTemplateProjects',
      'jsTemplateCreateJobs',
      'jsTemplates',
      'jsTemplateUsages',
      'jsTemplateFiles',
    ] as const) {
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
      'JsTemplateErrorCode',
      'JsTemplateErrorResponse',
      'RunJSSourceWorkspaceFile',
      'RunJSSourceSettingsDescriptor',
      'RunJSAuthoringCapabilities',
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
    expect(schemas.JsTemplateDiagnostic.properties.kind).toEqual({ type: 'string' });
    expect(schemas.JsTemplateCompileArtifactSummary.required).toContain('runtimeVersion');
    expect(schemas.JsTemplateCompileArtifactSummary.properties).not.toHaveProperty('version');
    expect(schemas.CompiledJsTemplateArtifact.required).toContain('runtimeVersion');
    expect(schemas.CompiledJsTemplateArtifact.properties).not.toHaveProperty('version');
    expect(schemas.JsTemplateErrorResponse.properties.errors.items).toEqual({
      $ref: '#/components/schemas/JsTemplateErrorItem',
    });
    expect(schemas.JsTemplateErrorCode.enum).toEqual([...JS_TEMPLATE_ERROR_CODES]);
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

  it('documents exactly the four retained authoring kinds', () => {
    expect(swaggerDocument.components.schemas.JsTemplateKind.enum).toEqual([
      'js-block',
      'js-field',
      'js-action',
      'js-item',
    ]);
  });

  it('documents list and dismiss creation-job contracts without exposing internal execution fields', () => {
    const schemas = swaggerDocument.components.schemas;
    const listJobs = swaggerDocument.paths['/jsTemplateCreateJobs:list'].post;
    const dismissJob = swaggerDocument.paths['/jsTemplateCreateJobs:dismiss'].post;

    expect(listJobs.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/JsTemplateCreateJobListEnvelope',
    });
    expect(dismissJob.requestBody.content['application/json'].schema).toMatchObject({
      required: ['jobId'],
      additionalProperties: false,
    });
    expect(dismissJob.responses['404'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/JsTemplateCreateJobNotFoundErrorResponse',
    });
    expect(schemas.JsTemplateCreateJobNotFoundErrorResponse.properties.errors.items.properties.code.enum).toEqual([
      'JS_TEMPLATE_CREATE_JOB_NOT_FOUND',
    ]);
    expect(schemas.JsTemplateCreateJobNotFoundErrorResponse.properties.errors.items.properties.status.enum).toEqual([
      404,
    ]);
    expect(schemas.JsTemplateErrorCode.enum).toContain('JS_TEMPLATE_CREATE_JOB_NOT_FOUND');
    expect(schemas.JsTemplateCreateJobListEnvelope.properties.data).toEqual({
      $ref: '#/components/schemas/JsTemplateCreateJobListResult',
    });
    expect(schemas.JsTemplateCreateJobDismissEnvelope.properties.data).toEqual({
      $ref: '#/components/schemas/JsTemplateCreateJobDismissResult',
    });
    expect(schemas.JsTemplateCreateJobSummary.properties).not.toHaveProperty('applicationName');
    expect(schemas.JsTemplateCreateJobSummary.properties).not.toHaveProperty('payload');
    expect(schemas.JsTemplateCreateJobSummary.properties).not.toHaveProperty('actorUserId');
    expect(schemas.JsTemplateCreateJobSummary.properties).not.toHaveProperty('requestId');
    expect(schemas.JsTemplateCreateJobSummary.properties).not.toHaveProperty('claimToken');
  });

  it('keeps canonical conversion, deletion, and reusable Template contracts public', () => {
    const schemas = swaggerDocument.components.schemas;
    const saveAsJsTemplate = swaggerDocument.paths['/jsTemplates:saveAsJsTemplate'].post;
    const detachToInline = swaggerDocument.paths['/jsTemplates:detachToInline'].post;
    const deleteTemplate = swaggerDocument.paths['/jsTemplates:delete'].post;
    const listUsages = swaggerDocument.paths['/jsTemplateUsages:listUsages'].post;
    const listSelectable = swaggerDocument.paths['/jsTemplates:listSelectable'].post;

    expect(saveAsJsTemplate.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/SaveAsJsTemplateRequest',
    });
    expect(schemas.SaveAsJsTemplateRequest.required).toEqual(
      expect.arrayContaining(['idempotencyKey', 'locator', 'runtimeVersion', 'files', 'destination', 'templateName']),
    );
    expect(schemas.SaveAsJsTemplateRequest.properties).not.toHaveProperty('version');
    expect(schemas.SaveAsJsTemplateDestination.oneOf).toEqual([
      expect.objectContaining({ required: ['type', 'projectId'] }),
      expect.objectContaining({ required: ['type', 'name'] }),
    ]);
    expect(schemas.SaveAsJsTemplateDestination.oneOf[0].properties.projectId).toEqual({
      type: 'string',
      description: 'Existing destination Source Project id.',
    });
    expect(schemas.SaveAsJsTemplateDestination.oneOf[0].properties).not.toHaveProperty('repoId');

    expect(detachToInline.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/DetachJsTemplateToInlineRequest',
    });
    expect(schemas.DetachJsTemplateToInlineRequest.required).toEqual([
      'idempotencyKey',
      'locator',
      'projectId',
      'templateId',
      'expectedProjectHeadCommitId',
    ]);
    expect(Object.keys(schemas.DetachJsTemplateToInlineRequest.properties)).toEqual([
      'idempotencyKey',
      'locator',
      'projectId',
      'templateId',
      'expectedProjectHeadCommitId',
    ]);
    expect(schemas.DetachJsTemplateToInlineRequest.additionalProperties).toBe(false);
    expect(schemas.DetachJsTemplateToInlineResult.required).toContain('filesHash');
    expect(schemas.DetachJsTemplateToInlineResult.required).toContain('runtimeVersion');
    expect(schemas.DetachJsTemplateToInlineResult.properties).not.toHaveProperty('version');
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
    expect(deleteTemplate.responses).toHaveProperty('409');
    expect(schemas.DeleteJsTemplateEnvelope.properties.data).toEqual({
      $ref: '#/components/schemas/DeleteJsTemplateResult',
    });
    expect(listUsages.requestBody.content['application/json'].schema.required).toEqual(['templateId']);
    expect(listUsages.responses).toHaveProperty('403');
    expect(listUsages.responses).toHaveProperty('404');
    expect(schemas.JsTemplateUsageListEnvelope.properties.data).toEqual({
      $ref: '#/components/schemas/JsTemplateUsageListResult',
    });
  });
});
