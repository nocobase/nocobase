/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../constants';

const nullableString = {
  type: 'string',
  nullable: true,
};

const nullableDateTime = {
  type: 'string',
  format: 'date-time',
  nullable: true,
};

export const jsTemplateSchemas = {
  JsTemplateKind: {
    type: 'string',
    enum: [...JS_TEMPLATE_SUPPORTED_KINDS],
    description: 'Supported client-side js-template authoring surface kind.',
  },
  JsTemplateWorkspaceFile: {
    type: 'object',
    required: ['path', 'content'],
    properties: {
      path: {
        type: 'string',
        description: 'Repository-relative POSIX source path.',
        example: 'src/client/js-blocks/order-summary/index.tsx',
      },
      content: {
        type: 'string',
        description: 'Complete UTF-8 source content for this workspace file.',
      },
      language: {
        type: 'string',
        description: 'Optional editor language hint.',
      },
      mode: {
        type: 'string',
        description: 'Optional source file mode.',
      },
    },
  },
  JsTemplateFileChange: {
    type: 'object',
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'Repository-relative POSIX source path changed by this incremental patch.',
        example: 'src/client/js-blocks/order-summary/index.tsx',
      },
      content: {
        type: 'string',
        description: 'Complete UTF-8 source content.',
      },
      blobHash: {
        type: 'string',
        description: 'Existing source blob hash to reuse instead of sending content.',
      },
      size: {
        type: 'integer',
        minimum: 0,
      },
      language: {
        type: 'string',
      },
      mode: {
        type: 'string',
      },
      operation: {
        type: 'string',
        enum: ['upsert', 'delete'],
        default: 'upsert',
        description: 'Incremental change operation. Delete changes must not include content or blobHash.',
      },
    },
    description: 'One incremental js-template source patch item, not a complete workspace snapshot.',
  },
  JsTemplateSourceBinding: {
    type: 'object',
    required: ['type', 'projectId', 'templateId', 'kind'],
    properties: {
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
    },
    additionalProperties: false,
  },
  JsTemplateCompileArtifactSummary: {
    type: 'object',
    required: ['version', 'entryPath'],
    properties: {
      version: {
        type: 'string',
      },
      entryPath: {
        type: 'string',
      },
      filesHash: {
        type: 'string',
      },
      metadata: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  JsTemplateDiagnostic: {
    type: 'object',
    required: ['code', 'severity', 'message'],
    properties: {
      code: {
        type: 'string',
        description: 'Stable machine-readable validator or compiler diagnostic code.',
      },
      severity: {
        type: 'string',
        enum: ['error', 'warning'],
      },
      message: {
        type: 'string',
      },
      path: {
        type: 'string',
        description: 'Repository-relative source path associated with the diagnostic.',
      },
      line: {
        type: 'integer',
        minimum: 1,
      },
      column: {
        type: 'integer',
        minimum: 1,
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      templateName: {
        type: 'string',
      },
      details: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  JsTemplateErrorItem: {
    type: 'object',
    required: ['code', 'message', 'status'],
    properties: {
      code: {
        type: 'string',
        example: 'JS_TEMPLATE_VALIDATION_FAILED',
      },
      message: {
        type: 'string',
      },
      status: {
        type: 'integer',
      },
      details: {
        type: 'object',
        additionalProperties: true,
        properties: {
          diagnostics: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/JsTemplateDiagnostic',
            },
          },
        },
      },
    },
  },
  JsTemplateErrorResponse: {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        minItems: 1,
        items: {
          $ref: '#/components/schemas/JsTemplateErrorItem',
        },
      },
    },
  },
  JsTemplateExpectedHeadCommitId: {
    type: 'string',
    nullable: true,
    description:
      'Required optimistic-concurrency value from the workspace pull. Pass null only when the repository has no Head commit.',
    example: '93e5ce98-6ec0-4dc8-9fb8-035da1a83f18',
  },
  JsTemplateSourceOutdatedErrorResponse: {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'object',
          required: ['code', 'message', 'status', 'details'],
          properties: {
            code: {
              type: 'string',
              enum: ['JS_TEMPLATE_SOURCE_OUTDATED'],
            },
            message: {
              type: 'string',
            },
            status: {
              type: 'integer',
              enum: [409],
            },
            details: {
              type: 'object',
              required: ['projectId', 'expectedHeadCommitId', 'currentHeadCommitId'],
              properties: {
                projectId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  $ref: '#/components/schemas/JsTemplateExpectedHeadCommitId',
                },
                currentHeadCommitId: {
                  $ref: '#/components/schemas/JsTemplateExpectedHeadCommitId',
                },
              },
            },
          },
        },
      },
    },
  },
  JsTemplateProject: {
    type: 'object',
    required: ['id', 'name', 'normalizedName', 'lifecycleStatus', 'healthStatus', 'headCommitId'],
    properties: {
      id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      normalizedName: {
        type: 'string',
      },
      title: nullableString,
      description: nullableString,
      lifecycleStatus: {
        type: 'string',
        enum: ['enabled', 'disabled', 'archived'],
      },
      healthStatus: {
        type: 'string',
        enum: ['pending', 'ready'],
      },
      headCommitId: {
        $ref: '#/components/schemas/JsTemplateExpectedHeadCommitId',
      },
      lastCompiledAt: nullableDateTime,
      templateCount: {
        type: 'integer',
        minimum: 0,
      },
      templateKinds: {
        type: 'object',
        additionalProperties: {
          type: 'integer',
          minimum: 0,
        },
      },
      createdAt: nullableDateTime,
      updatedAt: nullableDateTime,
    },
  },
  JsTemplate: {
    type: 'object',
    required: [
      'id',
      'projectId',
      'target',
      'kind',
      'templateName',
      'entryPath',
      'descriptorPath',
      'healthStatus',
      'diagnostics',
    ],
    properties: {
      id: {
        type: 'string',
      },
      projectId: {
        type: 'string',
      },
      target: {
        type: 'string',
        enum: ['client'],
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      templateName: {
        type: 'string',
      },
      entryPath: {
        type: 'string',
      },
      descriptorPath: {
        type: 'string',
      },
      title: nullableString,
      description: nullableString,
      category: nullableString,
      icon: nullableString,
      tags: {
        type: 'array',
        nullable: true,
        items: {
          type: 'string',
        },
      },
      sort: {
        type: 'number',
        nullable: true,
      },
      settingsSchema: {
        type: 'object',
        nullable: true,
        additionalProperties: true,
      },
      settingsSchemaHash: nullableString,
      compiledCommitId: nullableString,
      compiledInputKey: nullableString,
      compilerBuildId: nullableString,
      runtimeVersion: nullableString,
      surfaceStyle: nullableString,
      runtimeCodeHash: nullableString,
      artifactHash: nullableString,
      filesHash: nullableString,
      settingsDefaultsHash: nullableString,
      compiledAt: nullableDateTime,
      healthStatus: {
        type: 'string',
        enum: ['ready', 'missing'],
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateDiagnostic',
        },
      },
      createdAt: nullableDateTime,
      updatedAt: nullableDateTime,
    },
  },
  JsTemplateCatalogEntry: {
    type: 'object',
    required: [
      'id',
      'projectId',
      'projectName',
      'projectTitle',
      'projectLifecycleStatus',
      'kind',
      'templateName',
      'title',
      'description',
      'healthStatus',
      'status',
      'usageCount',
    ],
    properties: {
      id: {
        type: 'string',
        description: 'Stable Template Entry id.',
      },
      projectId: {
        type: 'string',
        description: 'Source Project id.',
      },
      projectName: {
        type: 'string',
      },
      projectTitle: nullableString,
      projectLifecycleStatus: {
        type: 'string',
        enum: ['enabled', 'disabled', 'archived'],
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      templateName: {
        type: 'string',
      },
      title: nullableString,
      description: nullableString,
      healthStatus: {
        type: 'string',
        enum: ['ready', 'missing'],
      },
      status: {
        type: 'string',
        enum: ['ready', 'missing', 'disabled', 'archived'],
      },
      usageCount: {
        type: 'integer',
        minimum: 0,
      },
      createdAt: nullableDateTime,
      updatedAt: nullableDateTime,
    },
  },
  JsTemplateUsageOwnerLocator: {
    type: 'object',
    additionalProperties: true,
    properties: {
      kind: {
        type: 'string',
      },
      modelUid: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      stepPath: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      descriptor: {
        type: 'string',
      },
    },
  },
  JsTemplateUsage: {
    type: 'object',
    required: [
      'id',
      'projectId',
      'templateId',
      'kind',
      'ownerKind',
      'ownerLocator',
      'ownerLocatorHash',
      'settingsHash',
      'resolvedStatus',
    ],
    properties: {
      id: {
        type: 'string',
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
      ownerKind: {
        type: 'string',
      },
      ownerLocator: {
        $ref: '#/components/schemas/JsTemplateUsageOwnerLocator',
      },
      ownerLocatorHash: {
        type: 'string',
      },
      settingsHash: {
        type: 'string',
      },
      resolvedStatus: {
        type: 'string',
      },
      createdAt: nullableDateTime,
      updatedAt: nullableDateTime,
    },
  },
  JsTemplateCommit: {
    type: 'object',
    required: ['id', 'projectId', 'hash', 'seq', 'parentCommitId', 'treeHash', 'message', 'authorId', 'metadata'],
    properties: {
      id: {
        type: 'string',
      },
      projectId: {
        type: 'string',
      },
      hash: {
        type: 'string',
      },
      seq: {
        type: 'integer',
      },
      parentCommitId: nullableString,
      treeHash: {
        type: 'string',
      },
      message: {
        type: 'string',
      },
      authorId: nullableString,
      metadata: {
        type: 'object',
        additionalProperties: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  JsTemplateStoredTree: {
    type: 'object',
    required: ['hash', 'entryCount', 'byteSize'],
    properties: {
      hash: {
        type: 'string',
      },
      entryCount: {
        type: 'integer',
      },
      byteSize: {
        type: 'integer',
      },
    },
  },
  JsTemplatePulledFile: {
    type: 'object',
    required: ['path', 'pathHash', 'pathLowerHash', 'blobHash', 'size', 'language', 'mode'],
    properties: {
      path: {
        type: 'string',
      },
      pathHash: {
        type: 'string',
      },
      pathLowerHash: {
        type: 'string',
      },
      blobHash: {
        type: 'string',
      },
      size: {
        type: 'integer',
      },
      language: {
        type: 'string',
      },
      mode: {
        type: 'string',
      },
      content: {
        type: 'string',
      },
    },
  },
  JsTemplatePullResult: {
    type: 'object',
    required: ['project', 'commit', 'tree', 'unchanged'],
    properties: {
      project: {
        $ref: '#/components/schemas/JsTemplateProject',
      },
      commit: {
        allOf: [{ $ref: '#/components/schemas/JsTemplateCommit' }],
        nullable: true,
      },
      tree: {
        allOf: [{ $ref: '#/components/schemas/JsTemplateStoredTree' }],
        nullable: true,
      },
      unchanged: {
        type: 'boolean',
      },
      files: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplatePulledFile',
        },
      },
    },
  },
  JsTemplateFileResult: {
    allOf: [
      {
        $ref: '#/components/schemas/JsTemplatePulledFile',
      },
      {
        type: 'object',
        required: ['content'],
        properties: {
          content: {
            type: 'string',
          },
        },
      },
    ],
  },
  JsTemplateCompileTemplateResult: {
    type: 'object',
    required: [
      'templateId',
      'projectId',
      'target',
      'kind',
      'templateName',
      'entryPath',
      'status',
      'accepted',
      'diagnostics',
    ],
    properties: {
      templateId: nullableString,
      projectId: {
        type: 'string',
      },
      target: {
        type: 'string',
        enum: ['client'],
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      templateName: {
        type: 'string',
      },
      entryPath: nullableString,
      status: {
        type: 'string',
        enum: ['success', 'failed', 'skipped'],
      },
      accepted: {
        type: 'boolean',
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateDiagnostic',
        },
      },
      failureCode: {
        type: 'string',
      },
      artifact: {
        $ref: '#/components/schemas/JsTemplateCompileArtifactSummary',
      },
    },
  },
  CompiledJsTemplateArtifact: {
    type: 'object',
    required: ['code', 'version', 'entryPath'],
    properties: {
      code: {
        type: 'string',
      },
      sourceMap: {
        type: 'string',
      },
      version: {
        type: 'string',
      },
      entryPath: {
        type: 'string',
      },
      filesHash: {
        type: 'string',
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateDiagnostic',
        },
      },
      metadata: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  JsTemplateWorkspacePreviewResult: {
    type: 'object',
    required: ['accepted', 'httpStatus', 'diagnostics'],
    properties: {
      accepted: {
        type: 'boolean',
      },
      httpStatus: {
        type: 'integer',
        enum: [200, 207, 422],
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateDiagnostic',
        },
      },
      failureCode: {
        type: 'string',
      },
      artifact: {
        $ref: '#/components/schemas/CompiledJsTemplateArtifact',
      },
      templates: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateCompileTemplateResult',
        },
      },
    },
  },
  JsTemplateSaveSourceTemplateResult: {
    type: 'object',
    required: ['templateId', 'templateName', 'kind', 'entryPath', 'status', 'diagnostics'],
    properties: {
      templateId: {
        type: 'string',
      },
      templateName: {
        type: 'string',
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      entryPath: {
        type: 'string',
      },
      status: {
        type: 'string',
        enum: ['success', 'failed', 'skipped'],
      },
      execution: {
        type: 'string',
        enum: ['compiled', 'skipped'],
        description: 'Optional server execution detail without changing the compatible status enum.',
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateDiagnostic',
        },
      },
      artifact: {
        $ref: '#/components/schemas/JsTemplateCompileArtifactSummary',
      },
      failureCode: {
        type: 'string',
      },
    },
  },
  JsTemplateSaveSourceResult: {
    type: 'object',
    required: ['project', 'commit', 'tree', 'compile', 'diagnostics'],
    properties: {
      project: {
        $ref: '#/components/schemas/JsTemplateProject',
      },
      commit: {
        $ref: '#/components/schemas/JsTemplateCommit',
      },
      tree: {
        $ref: '#/components/schemas/JsTemplateStoredTree',
      },
      compile: {
        type: 'object',
        required: ['status', 'templates'],
        properties: {
          status: {
            type: 'string',
            enum: ['success', 'skipped'],
          },
          templates: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/JsTemplateSaveSourceTemplateResult',
            },
          },
        },
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateDiagnostic',
        },
      },
    },
  },
  SaveAsJsTemplateOriginBinding: {
    type: 'object',
    required: ['type', 'projectId', 'templateId', 'kind'],
    properties: {
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
    },
    additionalProperties: false,
  },
  SaveAsJsTemplateDestination: {
    oneOf: [
      {
        type: 'object',
        required: ['type', 'projectId'],
        properties: {
          type: {
            type: 'string',
            enum: ['existing'],
          },
          projectId: {
            type: 'string',
            description: 'Existing destination JS Template Project id.',
          },
        },
        additionalProperties: false,
      },
      {
        type: 'object',
        required: ['type', 'name'],
        properties: {
          type: {
            type: 'string',
            enum: ['new'],
          },
          name: {
            type: 'string',
            description: 'Unique slug for the new destination JS Template Project.',
          },
          title: nullableString,
          description: nullableString,
        },
        additionalProperties: false,
      },
    ],
    description: 'Destination selection: an existing JS Template Project or a new JS Template Project.',
  },
  SaveAsJsTemplateRequest: {
    type: 'object',
    required: [
      'locator',
      'expectedOwnerFingerprint',
      'sourceRepoId',
      'sourceHeadCommitId',
      'entryPath',
      'version',
      'files',
      'destination',
      'templateName',
    ],
    properties: {
      idempotencyKey: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Optional retry key. Reusing it with a different request returns an idempotency conflict.',
      },
      locator: {
        $ref: '#/components/schemas/RunJSSourceLocator',
      },
      expectedOwnerFingerprint: {
        type: 'string',
        minLength: 1,
        description: 'Owner fingerprint returned by the latest RunJS workspace open operation.',
      },
      sourceRepoId: {
        type: 'string',
        minLength: 1,
        description: 'RunJS workspace repository id returned by open/openLatest.',
      },
      sourceHeadCommitId: {
        type: 'string',
        nullable: true,
        description: 'Exact RunJS workspace Head commit, or null when the workspace has no Head.',
      },
      entryPath: {
        type: 'string',
        minLength: 1,
        description: 'Canonical entry path in the supplied RunJS workspace.',
      },
      version: {
        type: 'string',
        minLength: 1,
        description: 'RunJS source version from the opened workspace.',
      },
      files: {
        type: 'array',
        minItems: 1,
        description: 'Complete RunJS source workspace, including every file reachable from the entry.',
        items: {
          $ref: '#/components/schemas/JsTemplateWorkspaceFile',
        },
      },
      originBinding: {
        $ref: '#/components/schemas/SaveAsJsTemplateOriginBinding',
      },
      destination: {
        $ref: '#/components/schemas/SaveAsJsTemplateDestination',
      },
      templateName: {
        type: 'string',
        minLength: 1,
        description: 'Lowercase slug for the destination JS Template.',
      },
      templateTitle: nullableString,
    },
    additionalProperties: false,
  },
  SaveAsJsTemplateResult: {
    type: 'object',
    required: ['project', 'template', 'binding', 'ownerFingerprint'],
    properties: {
      project: {
        $ref: '#/components/schemas/JsTemplateProject',
      },
      template: {
        $ref: '#/components/schemas/JsTemplate',
      },
      binding: {
        $ref: '#/components/schemas/JsTemplateSourceBinding',
      },
      ownerFingerprint: {
        type: 'string',
      },
    },
  },
  DetachJsTemplateToInlineRequest: {
    type: 'object',
    required: ['idempotencyKey', 'locator', 'projectId', 'templateId', 'entryPath', 'kind', 'version', 'files'],
    properties: {
      idempotencyKey: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Required retry key. Reusing it with a different request returns an idempotency conflict.',
      },
      locator: {
        $ref: '#/components/schemas/RunJSSourceLocator',
      },
      projectId: {
        type: 'string',
        minLength: 1,
      },
      templateId: {
        type: 'string',
        minLength: 1,
      },
      entryPath: {
        type: 'string',
        minLength: 1,
        description: 'Canonical entry path for the bound JS Template source.',
      },
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      version: {
        type: 'string',
        minLength: 1,
        description: 'Compiled JS Template source version being moved inline.',
      },
      files: {
        type: 'array',
        minItems: 1,
        description: 'Complete source files reachable from the JS Template entry point.',
        items: {
          $ref: '#/components/schemas/JsTemplateWorkspaceFile',
        },
      },
    },
    additionalProperties: false,
  },
  DetachJsTemplateToInlineResult: {
    type: 'object',
    required: ['runJSRepoId', 'commitId', 'ownerFingerprint', 'code', 'version', 'entryPath', 'filesHash', 'sourceRef'],
    properties: {
      runJSRepoId: {
        type: 'string',
      },
      commitId: {
        type: 'string',
      },
      ownerFingerprint: {
        type: 'string',
      },
      code: {
        type: 'string',
      },
      version: {
        type: 'string',
      },
      entryPath: {
        type: 'string',
      },
      filesHash: {
        type: 'string',
        minLength: 1,
      },
      sourceRef: {
        type: 'object',
        required: ['type', 'repoId', 'commitId', 'entry'],
        properties: {
          type: {
            type: 'string',
            enum: ['vsc-file'],
          },
          repoId: {
            type: 'string',
          },
          commitId: {
            type: 'string',
          },
          entry: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    },
  },
  JsTemplateSelectableTemplate: {
    type: 'object',
    required: [
      'id',
      'projectId',
      'kind',
      'templateName',
      'entryPath',
      'title',
      'category',
      'settingsSchema',
      'settingsSchemaHash',
      'settingsDefaultsHash',
      'runtimeCodeHash',
      'runtimeAvailable',
    ],
    properties: {
      id: {
        type: 'string',
        description: 'Stable JS Template id used as sourceBinding.templateId.',
      },
      projectId: {
        type: 'string',
        description: 'Stable JS Template Project id used as sourceBinding.projectId.',
      },
      projectName: nullableString,
      projectTitle: nullableString,
      kind: {
        $ref: '#/components/schemas/JsTemplateKind',
      },
      templateName: {
        type: 'string',
      },
      entryPath: {
        type: 'string',
      },
      title: nullableString,
      category: nullableString,
      settingsSchema: {
        type: 'object',
        nullable: true,
        additionalProperties: true,
      },
      settingsSchemaHash: nullableString,
      settingsDefaultsHash: nullableString,
      artifactHash: {
        type: 'string',
      },
      runtimeCodeHash: {
        type: 'string',
      },
      runtimeAvailable: {
        type: 'boolean',
        enum: [true],
      },
    },
  },
  JsTemplateProjectEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/JsTemplateProject',
      },
    },
  },
  JsTemplateProjectListEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateProject',
        },
      },
    },
  },
  JsTemplateEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/JsTemplate',
      },
    },
  },
  JsTemplateCatalogEntryListEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateCatalogEntry',
        },
      },
    },
  },
  JsTemplateUsageListEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateUsage',
        },
      },
    },
  },
  JsTemplatePullEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/JsTemplatePullResult',
      },
    },
  },
  JsTemplateFileEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/JsTemplateFileResult',
      },
    },
  },
  JsTemplateWorkspacePreviewEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/JsTemplateWorkspacePreviewResult',
      },
    },
  },
  JsTemplateSaveSourceEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/JsTemplateSaveSourceResult',
      },
    },
  },
  SaveAsJsTemplateEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/SaveAsJsTemplateResult',
      },
    },
  },
  DetachJsTemplateToInlineEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/DetachJsTemplateToInlineResult',
      },
    },
  },
  JsTemplateSelectableTemplateListEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/JsTemplateSelectableTemplate',
        },
      },
    },
  },
};
