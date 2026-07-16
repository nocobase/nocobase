/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const nullableString = {
  type: 'string',
  nullable: true,
};

const nullableDateTime = {
  type: 'string',
  format: 'date-time',
  nullable: true,
};

export const lightExtensionSchemas = {
  LightExtensionKind: {
    type: 'string',
    enum: ['js-block', 'js-field', 'js-action', 'js-item', 'runjs'],
    description: 'Supported client-side light-extension authoring surface kind.',
  },
  LightExtensionWorkspaceFile: {
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
        description: 'Complete UTF-8 source content for this preview file.',
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
  LightExtensionFileChange: {
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
        description: 'UTF-8 source content for an upsert. Preserve newlines, Unicode, quotes, and template strings.',
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
    description: 'One incremental light-extension source patch item, not a complete workspace snapshot.',
  },
  LightExtensionSourceBinding: {
    type: 'object',
    required: ['type', 'repoId', 'entryId', 'kind'],
    properties: {
      type: {
        type: 'string',
        enum: ['light-extension-entry'],
      },
      repoId: {
        type: 'string',
      },
      repoTitle: nullableString,
      entryId: {
        type: 'string',
      },
      entryTitle: nullableString,
      entryName: nullableString,
      entryPath: nullableString,
      kind: {
        $ref: '#/components/schemas/LightExtensionKind',
      },
    },
    additionalProperties: true,
  },
  LightExtensionCompileArtifactSummary: {
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
  LightExtensionDiagnostic: {
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
        $ref: '#/components/schemas/LightExtensionKind',
      },
      entryName: {
        type: 'string',
      },
      details: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  LightExtensionErrorItem: {
    type: 'object',
    required: ['code', 'message', 'status'],
    properties: {
      code: {
        type: 'string',
        example: 'LIGHT_EXTENSION_VALIDATION_FAILED',
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
              $ref: '#/components/schemas/LightExtensionDiagnostic',
            },
          },
        },
      },
    },
  },
  LightExtensionErrorResponse: {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        minItems: 1,
        items: {
          $ref: '#/components/schemas/LightExtensionErrorItem',
        },
      },
    },
  },
  LightExtensionExpectedHeadCommitId: {
    type: 'string',
    nullable: true,
    description:
      'Required optimistic-concurrency value from the workspace pull. Pass null only when the repository has no Head commit.',
    example: '93e5ce98-6ec0-4dc8-9fb8-035da1a83f18',
  },
  LightExtensionSourceOutdatedErrorResponse: {
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
              enum: ['LIGHT_EXTENSION_SOURCE_OUTDATED'],
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
              required: ['repoId', 'expectedHeadCommitId', 'currentHeadCommitId'],
              properties: {
                repoId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
                },
                currentHeadCommitId: {
                  $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
                },
              },
            },
          },
        },
      },
    },
  },
  LightExtensionRepo: {
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
        $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
      },
      lastCompiledAt: nullableDateTime,
      entryCount: {
        type: 'integer',
        minimum: 0,
      },
      entryKinds: {
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
  LightExtensionEntry: {
    type: 'object',
    required: [
      'id',
      'repoId',
      'target',
      'kind',
      'entryName',
      'entryPath',
      'descriptorPath',
      'healthStatus',
      'diagnostics',
    ],
    properties: {
      id: {
        type: 'string',
      },
      repoId: {
        type: 'string',
      },
      target: {
        type: 'string',
        enum: ['client'],
      },
      kind: {
        $ref: '#/components/schemas/LightExtensionKind',
      },
      entryName: {
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
          $ref: '#/components/schemas/LightExtensionDiagnostic',
        },
      },
      createdAt: nullableDateTime,
      updatedAt: nullableDateTime,
    },
  },
  LightExtensionReferenceOwnerLocator: {
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
      hostPath: {
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
  LightExtensionReference: {
    type: 'object',
    required: [
      'id',
      'repoId',
      'entryId',
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
      repoId: {
        type: 'string',
      },
      entryId: {
        type: 'string',
      },
      kind: {
        $ref: '#/components/schemas/LightExtensionKind',
      },
      ownerKind: {
        type: 'string',
      },
      ownerLocator: {
        $ref: '#/components/schemas/LightExtensionReferenceOwnerLocator',
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
  LightExtensionCommit: {
    type: 'object',
    required: ['id', 'repoId', 'hash', 'seq', 'parentCommitId', 'treeHash', 'message', 'authorId', 'metadata'],
    properties: {
      id: {
        type: 'string',
      },
      repoId: {
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
  LightExtensionStoredTree: {
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
  LightExtensionPulledFile: {
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
  LightExtensionPullResult: {
    type: 'object',
    required: ['repo', 'commit', 'tree', 'unchanged'],
    properties: {
      repo: {
        $ref: '#/components/schemas/LightExtensionRepo',
      },
      commit: {
        allOf: [{ $ref: '#/components/schemas/LightExtensionCommit' }],
        nullable: true,
      },
      tree: {
        allOf: [{ $ref: '#/components/schemas/LightExtensionStoredTree' }],
        nullable: true,
      },
      unchanged: {
        type: 'boolean',
      },
      files: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LightExtensionPulledFile',
        },
      },
    },
  },
  LightExtensionFileResult: {
    allOf: [
      {
        $ref: '#/components/schemas/LightExtensionPulledFile',
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
  LightExtensionCompileEntryResult: {
    type: 'object',
    required: ['entryId', 'repoId', 'target', 'kind', 'entryName', 'entryPath', 'status', 'accepted', 'diagnostics'],
    properties: {
      entryId: nullableString,
      repoId: {
        type: 'string',
      },
      target: {
        type: 'string',
        enum: ['client'],
      },
      kind: {
        $ref: '#/components/schemas/LightExtensionKind',
      },
      entryName: {
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
          $ref: '#/components/schemas/LightExtensionDiagnostic',
        },
      },
      failureCode: {
        type: 'string',
      },
      artifact: {
        $ref: '#/components/schemas/LightExtensionCompileArtifactSummary',
      },
    },
  },
  LightExtensionRuntimeArtifact: {
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
          $ref: '#/components/schemas/LightExtensionDiagnostic',
        },
      },
      metadata: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  LightExtensionWorkspacePreviewResult: {
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
          $ref: '#/components/schemas/LightExtensionDiagnostic',
        },
      },
      failureCode: {
        type: 'string',
      },
      artifact: {
        $ref: '#/components/schemas/LightExtensionRuntimeArtifact',
      },
      entries: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LightExtensionCompileEntryResult',
        },
      },
    },
  },
  LightExtensionSaveSourceEntryResult: {
    type: 'object',
    required: ['entryId', 'entryName', 'kind', 'entryPath', 'status', 'diagnostics'],
    properties: {
      entryId: {
        type: 'string',
      },
      entryName: {
        type: 'string',
      },
      kind: {
        $ref: '#/components/schemas/LightExtensionKind',
      },
      entryPath: {
        type: 'string',
      },
      status: {
        type: 'string',
        enum: ['success', 'failed', 'skipped'],
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LightExtensionDiagnostic',
        },
      },
      artifact: {
        $ref: '#/components/schemas/LightExtensionCompileArtifactSummary',
      },
      failureCode: {
        type: 'string',
      },
    },
  },
  LightExtensionSaveSourceResult: {
    type: 'object',
    required: ['repo', 'commit', 'tree', 'compile', 'diagnostics'],
    properties: {
      repo: {
        $ref: '#/components/schemas/LightExtensionRepo',
      },
      commit: {
        $ref: '#/components/schemas/LightExtensionCommit',
      },
      tree: {
        $ref: '#/components/schemas/LightExtensionStoredTree',
      },
      compile: {
        type: 'object',
        required: ['status', 'entries'],
        properties: {
          status: {
            type: 'string',
            enum: ['success', 'skipped'],
          },
          entries: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/LightExtensionSaveSourceEntryResult',
            },
          },
        },
      },
      diagnostics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LightExtensionDiagnostic',
        },
      },
    },
  },
  LightExtensionRepoEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/LightExtensionRepo',
      },
    },
  },
  LightExtensionRepoListEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LightExtensionRepo',
        },
      },
    },
  },
  LightExtensionEntryEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/LightExtensionEntry',
      },
    },
  },
  LightExtensionReferenceListEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LightExtensionReference',
        },
      },
    },
  },
  LightExtensionPullEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/LightExtensionPullResult',
      },
    },
  },
  LightExtensionFileEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/LightExtensionFileResult',
      },
    },
  },
  LightExtensionWorkspacePreviewEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/LightExtensionWorkspacePreviewResult',
      },
    },
  },
  LightExtensionSaveSourceEnvelope: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        $ref: '#/components/schemas/LightExtensionSaveSourceResult',
      },
    },
  },
};
