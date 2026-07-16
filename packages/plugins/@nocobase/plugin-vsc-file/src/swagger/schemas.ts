/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const stringArray = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'string',
  },
};

const modelUid = {
  type: 'string',
  minLength: 1,
};

export const runJSSourceSchemas = {
  RunJSSourceLocator: {
    oneOf: [
      {
        type: 'object',
        required: ['kind', 'modelUid', 'flowKey', 'stepKey', 'paramPath'],
        properties: {
          kind: { type: 'string', enum: ['flowModel.step'] },
          modelUid,
          flowKey: { type: 'string', minLength: 1 },
          stepKey: { type: 'string', minLength: 1 },
          paramPath: stringArray,
          versionPath: stringArray,
        },
      },
      {
        type: 'object',
        required: ['kind', 'modelUid', 'containerFlowKey', 'containerStepKey', 'valuePath', 'scene'],
        properties: {
          kind: { type: 'string', enum: ['flowModel.nestedRunJS'] },
          modelUid,
          containerFlowKey: { type: 'string', minLength: 1 },
          containerStepKey: { type: 'string', minLength: 1 },
          valuePath: {
            type: 'array',
            minItems: 1,
            items: {
              oneOf: [{ type: 'string' }, { type: 'integer', minimum: 0, maximum: 100000 }],
            },
          },
          scene: { type: 'string', minLength: 1 },
        },
      },
      {
        type: 'object',
        required: ['kind', 'modelUid', 'flowKey', 'stepKey', 'sourcePath'],
        properties: {
          kind: { type: 'string', enum: ['flowModel.flowRegistry.runjs'] },
          modelUid,
          flowKey: { type: 'string', minLength: 1 },
          stepKey: { type: 'string', minLength: 1 },
          sourcePath: stringArray,
        },
      },
      {
        type: 'object',
        required: ['kind', 'nodeId'],
        properties: {
          kind: { type: 'string', enum: ['workflow.javascript'] },
          nodeId: {
            oneOf: [
              { type: 'string', minLength: 1 },
              { type: 'integer', minimum: 0 },
            ],
          },
        },
      },
      {
        type: 'object',
        required: ['kind', 'modelUid'],
        properties: {
          kind: { type: 'string', enum: ['chart.option'] },
          modelUid,
        },
      },
      {
        type: 'object',
        required: ['kind', 'modelUid'],
        properties: {
          kind: { type: 'string', enum: ['chart.events'] },
          modelUid,
        },
      },
    ],
    description: 'Stable owner locator normalized by the runJSSources resource.',
  },
  RunJSSourceInitialSource: {
    type: 'object',
    required: ['code', 'version'],
    properties: {
      code: { type: 'string' },
      version: { type: 'string', minLength: 1 },
    },
    description: 'Current editor source used only when a recognized RunJS owner is still uninitialized.',
  },
  RunJSSourceFileChange: {
    type: 'object',
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'Allowed RunJS workspace path under src, README.md, or .nocobase/runjs-source.json.',
      },
      operation: {
        type: 'string',
        enum: ['upsert', 'delete'],
        default: 'upsert',
      },
      content: {
        type: 'string',
        description: 'Complete UTF-8 source content for an upsert.',
      },
      blobHash: {
        type: 'string',
        description: 'Existing blob hash from the selected repository commit to reuse instead of content.',
      },
      size: { type: 'integer', minimum: 0 },
      language: { type: 'string' },
      mode: { type: 'string' },
    },
  },
  RunJSSourceDiagnostic: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string' },
      severity: { type: 'string', enum: ['error', 'warning', 'info'] },
      code: { type: 'string' },
      ruleId: { type: 'string' },
      path: { type: 'string' },
      line: { type: 'integer', minimum: 1 },
      column: { type: 'integer', minimum: 1 },
      details: { type: 'object', additionalProperties: true },
    },
  },
  RunJSSourceRuntimeArtifact: {
    type: 'object',
    required: ['code', 'version', 'diagnostics', 'filesHash'],
    properties: {
      code: { type: 'string' },
      version: { type: 'string' },
      sourceMap: { type: 'string' },
      diagnostics: {
        type: 'array',
        items: { $ref: '#/components/schemas/RunJSSourceDiagnostic' },
      },
      filesHash: { type: 'string' },
      entryPath: { type: 'string' },
      metadata: { type: 'object', additionalProperties: true },
    },
  },
  RunJSSourceRepository: {
    type: 'object',
    required: ['id', 'repoId', 'ownerType', 'ownerId', 'name', 'status', 'defaultRef', 'headCommitId', 'headSeq'],
    properties: {
      id: { type: 'string' },
      repoId: { type: 'string' },
      ownerType: { type: 'string', enum: ['runjs-source'] },
      ownerId: { type: 'string' },
      name: { type: 'string', enum: ['source'] },
      status: { type: 'string', enum: ['active', 'archived'] },
      defaultRef: { type: 'string', enum: ['head'] },
      headCommitId: { type: 'string', nullable: true },
      headSeq: { type: 'integer', minimum: 0 },
    },
  },
  RunJSSourceOpenResult: {
    type: 'object',
    required: [
      'locator',
      'locatorKind',
      'repositoryIdentity',
      'legacy',
      'ownerFingerprint',
      'source',
      'repository',
      'files',
      'permissions',
      'history',
    ],
    properties: {
      locator: { $ref: '#/components/schemas/RunJSSourceLocator' },
      locatorKind: { type: 'string' },
      repositoryIdentity: { type: 'object', additionalProperties: true },
      legacy: { type: 'object', additionalProperties: true },
      ownerFingerprint: { type: 'string' },
      source: { type: 'object', additionalProperties: true },
      repository: { $ref: '#/components/schemas/RunJSSourceRepository' },
      files: {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
      permissions: {
        type: 'object',
        required: ['canRead', 'canWrite', 'canSave'],
        properties: {
          canRead: { type: 'boolean' },
          canWrite: { type: 'boolean' },
          canSave: { type: 'boolean' },
        },
      },
      history: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
    },
  },
  RunJSSourceOpenEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: { $ref: '#/components/schemas/RunJSSourceOpenResult' },
    },
  },
  RunJSSourceCompilePreviewEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['locator', 'locatorKind', 'artifact'],
        properties: {
          locator: { $ref: '#/components/schemas/RunJSSourceLocator' },
          locatorKind: { type: 'string' },
          artifact: { $ref: '#/components/schemas/RunJSSourceRuntimeArtifact' },
        },
      },
    },
  },
  RunJSSourceSaveEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['locator', 'locatorKind', 'repository', 'commit', 'artifact', 'ownerFingerprint', 'writeResult'],
        properties: {
          locator: { $ref: '#/components/schemas/RunJSSourceLocator' },
          locatorKind: { type: 'string' },
          repository: { $ref: '#/components/schemas/RunJSSourceRepository' },
          commit: { type: 'object', additionalProperties: true },
          artifact: {
            type: 'object',
            required: ['entryPath', 'filesHash', 'runtimeCodeHash', 'diagnostics'],
            properties: {
              entryPath: { type: 'string', nullable: true },
              filesHash: { type: 'string' },
              runtimeCodeHash: { type: 'string' },
              diagnostics: {
                type: 'array',
                items: { $ref: '#/components/schemas/RunJSSourceDiagnostic' },
              },
            },
          },
          ownerFingerprint: { type: 'string' },
          writeResult: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
  RunJSSourceErrorResponse: {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['code', 'message', 'status'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'integer' },
            details: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
  },
};
