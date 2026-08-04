/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function jsonContent(name: string) {
  return {
    'application/json': {
      schema: {
        $ref: `#/components/schemas/${name}`,
      },
    },
  };
}

function errorResponse(description: string) {
  return {
    description,
    content: jsonContent('RunJSSourceErrorResponse'),
  };
}

const locatorProperty = {
  type: 'object',
  allOf: [{ $ref: '#/components/schemas/RunJSSourceLocator' }],
};

const openRequestBody = {
  required: true,
  description: 'Root runJSSources payload. Do not wrap it in values.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['locator'],
        properties: {
          locator: locatorProperty,
          initialSource: {
            $ref: '#/components/schemas/RunJSSourceInitialSource',
          },
        },
      },
    },
  },
};

const openResponses = {
  200: {
    description: 'The owner-aware RunJS workspace, source metadata, permissions, and history.',
    content: jsonContent('RunJSSourceOpenEnvelope'),
  },
  400: errorResponse('The locator or initial source is invalid.'),
  403: errorResponse('The current user cannot read this RunJS owner, or the repository belongs to another domain.'),
  404: errorResponse('The RunJS owner cannot be found.'),
  409: errorResponse('The owner runtime no longer matches the workspace Head.'),
};

const openLatestResponses = {
  200: openResponses[200],
  400: openResponses[400],
  403: openResponses[403],
  404: openResponses[404],
};

export const runJSSourcePaths = {
  '/runJSSources:open': {
    post: {
      tags: ['runJSSources'],
      summary: 'Open a RunJS Studio workspace with owner consistency checks',
      description: [
        'Open the workspace bound to one RunJS owner. When no repository exists and the caller can save, the server initializes one from the current owner code and its generated manifest.',
        'This action verifies that the current owner fingerprint still matches repository Head. Use openLatest to recover the latest repository snapshot after an owner-outdated response.',
      ].join('\n\n'),
      requestBody: openRequestBody,
      responses: openResponses,
    },
  },
  '/runJSSources:openLatest': {
    post: {
      tags: ['runJSSources'],
      summary: 'Open the latest RunJS Studio workspace snapshot',
      description: [
        'Open the latest workspace bound to one RunJS owner without rejecting a repository Head whose stored owner fingerprint is older than the live owner.',
        'Unlike open, this action does not create a missing repository. When no persisted workspace exists, it returns a virtual repository with repoId/id empty and headCommitId null plus files materialized from the live owner; continue with the inline path unless the user explicitly chooses the open/restore workflow.',
      ].join('\n\n'),
      requestBody: openRequestBody,
      responses: openLatestResponses,
    },
  },
  '/runJSSources:compilePreview': {
    post: {
      tags: ['runJSSources'],
      summary: 'Compile a RunJS workspace preview without saving',
      description: [
        'Compile the supplied owner-aware workspace without creating a commit or writing the runtime artifact back to the owner.',
        'For reliable Agent authoring, send the complete current workspace returned by open/openLatest after applying edits. When repoId is supplied, baseCommitId optionally selects the repository commit used to materialize file changes; this field belongs only to preview and is not a save concurrency token.',
        'Use --body-file for multi-file source so Unicode, newlines, quotes, and template strings are preserved exactly.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description: 'Root preview payload consumed directly by runJSSources:compilePreview.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['locator', 'files'],
              properties: {
                locator: locatorProperty,
                repoId: {
                  type: 'string',
                  description: 'Repository id returned by open/openLatest.',
                },
                baseCommitId: {
                  type: 'string',
                  nullable: true,
                  description: 'Optional repository commit used only as the base for preview materialization.',
                },
                files: {
                  type: 'array',
                  minItems: 1,
                  description:
                    'RunJS workspace files to compile. Send the complete edited workspace for Agent authoring.',
                  items: {
                    $ref: '#/components/schemas/RunJSSourceFileChange',
                  },
                },
                entryPath: {
                  type: 'string',
                  description: 'Preferred workspace entry path. The legacy alias entry is also accepted by the server.',
                },
                version: {
                  type: 'string',
                  description: 'Optional runtime version; defaults to the live owner version.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Preview compilation result. Inspect artifact.diagnostics before saving.',
          content: jsonContent('RunJSSourceCompilePreviewEnvelope'),
        },
        400: errorResponse('The locator, workspace path, or request shape is invalid.'),
        403: errorResponse('The current user cannot read this owner or the repository belongs to another domain.'),
        404: errorResponse('The owner, repository, or selected base commit cannot be found.'),
        413: errorResponse('The workspace exceeds RunJS repository limits.'),
      },
    },
  },
  '/runJSSources:save': {
    post: {
      tags: ['runJSSources'],
      summary: 'Save a complete RunJS workspace snapshot and update its owner runtime',
      description: [
        'Compile files, replace the repository workspace with that complete target snapshot, create the next commit, and write the compiled runtime artifact back to the bound owner in one transaction.',
        'files is a complete snapshot, not an incremental patch: every existing path omitted from files is deleted. Preserve the manifest, entry source, runtimeVersion, and every unchanged source file. Preview the same complete snapshot before saving.',
        'Pass baseCommitId and baseOwnerFingerprint from the same open/openLatest response. The server locks the repository and returns HTTP 409 when either the Head or owner fingerprint changed. There is no expectedHeadCommitId field.',
        'Use --body-file for multi-file source so Unicode, newlines, quotes, and template strings are preserved exactly.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description: 'Root save payload consumed directly by runJSSources:save. Do not wrap it in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['locator', 'baseCommitId', 'baseOwnerFingerprint', 'message', 'files'],
              properties: {
                locator: locatorProperty,
                repoId: {
                  type: 'string',
                  description:
                    'Repository id returned by open/openLatest. If omitted, the server resolves or creates it by owner identity.',
                },
                baseCommitId: {
                  type: 'string',
                  nullable: true,
                  description:
                    'Exact repository headCommitId returned by open/openLatest. Pass null only for a virtual workspace without a Head.',
                },
                baseOwnerFingerprint: {
                  type: 'string',
                  minLength: 1,
                  description: 'Exact ownerFingerprint returned by the same open/openLatest response.',
                },
                message: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 200,
                  description: 'Source commit message.',
                },
                files: {
                  type: 'array',
                  minItems: 1,
                  description: 'Complete target workspace snapshot. Omitted existing paths are deleted.',
                  items: {
                    $ref: '#/components/schemas/RunJSSourceFileChange',
                  },
                },
                entryPath: {
                  type: 'string',
                  description: 'Preferred workspace entry path. Defaults to the manifest or src/client/index.*.',
                },
                version: {
                  type: 'string',
                  description: 'Optional runtime version; defaults to the live owner version.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Workspace committed and the owner runtime artifact updated.',
          content: jsonContent('RunJSSourceSaveEnvelope'),
        },
        400: errorResponse(
          'The locator, workspace path, commit message, request shape, or complete workspace compilation is invalid. Compile errors include diagnostics in details.',
        ),
        403: errorResponse('The current user cannot write this owner or the repository belongs to another domain.'),
        404: errorResponse('The owner or repository cannot be found.'),
        409: errorResponse(
          'The owner fingerprint changed, the repository is archived, or the snapshot has no changes.',
        ),
        413: errorResponse('The workspace exceeds RunJS repository limits.'),
      },
    },
  },
  '/runJSSources:saveChanges': {
    post: {
      tags: ['runJSSources'],
      summary: 'Save explicit RunJS file changes and update the owner runtime atomically',
      description: [
        'Apply only the paths listed in changes. Every omitted workspace path remains unchanged, and a file is deleted only by an explicit operation: "delete" change.',
        'Each upsert contains the complete UTF-8 content of that changed file only. The server materializes the base tree plus changes, generates the managed manifest update, compiles the complete candidate workspace, and commits source/runtime/owner state atomically.',
        'Use expectedBlobHash from open/openLatest for every update or delete. A new path must use expectedBlobHash: null and must not already exist. A mismatch returns RUNJS_FILE_CONFLICT with the conflicting path and hashes.',
        '.nocobase/runjs-source.json is server-managed and cannot be upserted or deleted through ordinary changes.',
        'Pass repoId, baseCommitId, and baseOwnerFingerprint from the same open/openLatest response. Use --body-file for multi-file source so Unicode, newlines, quotes, and template strings are preserved exactly.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root incremental save payload consumed directly by runJSSources:saveChanges. Do not wrap it in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['locator', 'repoId', 'baseCommitId', 'baseOwnerFingerprint', 'message', 'changes'],
              properties: {
                locator: locatorProperty,
                repoId: {
                  type: 'string',
                  minLength: 1,
                  description: 'Repository id returned by open/openLatest.',
                },
                baseCommitId: {
                  type: 'string',
                  nullable: true,
                  description: 'Exact repository headCommitId returned by the same open/openLatest response.',
                },
                baseOwnerFingerprint: {
                  type: 'string',
                  minLength: 1,
                  description: 'Exact ownerFingerprint returned by the same open/openLatest response.',
                },
                message: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 200,
                  description: 'Source commit message.',
                },
                changes: {
                  type: 'array',
                  minItems: 1,
                  description:
                    'Explicit changed paths only. Omitted paths remain unchanged; deletion requires operation: "delete".',
                  items: {
                    $ref: '#/components/schemas/RunJSSourceIncrementalFileChange',
                  },
                },
                entryPath: {
                  type: 'string',
                  description:
                    'Preferred workspace entry path. Defaults to the managed manifest or src/client/index.*.',
                },
                version: {
                  type: 'string',
                  description: 'Optional runtime version; defaults to the live owner version.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Changes committed and the owner runtime artifact updated.',
          content: jsonContent('RunJSSourceSaveEnvelope'),
        },
        400: errorResponse(
          'The locator, changed path, commit message, request shape, or materialized workspace compilation is invalid.',
        ),
        403: errorResponse(
          'The current user cannot write this owner, the repository belongs to another domain, or a managed file was changed directly.',
        ),
        404: errorResponse('The owner or repository cannot be found.'),
        409: errorResponse(
          'The repository Head or owner fingerprint changed, an expectedBlobHash conflicts, the repository is archived, or the changes have no effect.',
        ),
        413: errorResponse('The materialized workspace exceeds RunJS repository limits.'),
      },
    },
  },
};

const rawVscFileActions = {
  createRepository: ['ownerType', 'ownerId', 'name'],
  getRepository: ['repoId'],
  archiveRepository: ['repoId'],
  pull: ['repoId'],
  getFile: ['repoId', 'path'],
  push: ['repoId', 'baseCommitId', 'message', 'files'],
  listCommits: ['repoId'],
  getCommit: ['repoId', 'commitId'],
  diff: ['repoId', 'fromCommitId', 'toCommitId'],
  diffFile: ['repoId'],
  restoreFile: ['repoId', 'sourceCommitId', 'path'],
  restoreCommit: ['repoId', 'sourceCommitId'],
  listRefs: ['repoId'],
  updateRef: ['repoId', 'name', 'targetCommitId'],
} as const;

export const rawVscFilePaths = Object.fromEntries(
  Object.entries(rawVscFileActions).map(([action, required]) => [
    `/vscFile:${action}`,
    {
      post: {
        tags: ['vscFile'],
        summary: `${action} through the raw VSC compatibility resource`,
        description:
          'Compatibility transport for generic VSC repositories. Owner permission hooks reject direct access to protected RunJS and js-template repositories.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required,
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Raw VSC action completed successfully.',
            content: jsonContent('RawVscFileResponseEnvelope'),
          },
          400: errorResponse('The raw VSC action payload is invalid.'),
          403: errorResponse('The repository is protected or the current user lacks permission.'),
          404: errorResponse('The requested repository, commit, ref, or file does not exist.'),
          409: errorResponse('The repository state changed or rejected the requested mutation.'),
          413: errorResponse('The repository or file exceeds VSC limits.'),
        },
      },
    },
  ]),
);
