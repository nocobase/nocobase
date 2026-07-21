/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function schemaRef(name: string) {
  return {
    $ref: `#/components/schemas/${name}`,
  };
}

function jsonContent(name: string) {
  return {
    'application/json': {
      schema: schemaRef(name),
    },
  };
}

function errorResponse(description: string) {
  return {
    description,
    content: jsonContent('LightExtensionErrorResponse'),
  };
}

export const lightExtensionPaths = {
  '/lightExtensionRepos:list': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionRepos'],
      summary: 'List light-extension source repositories',
      description: 'List existing light-extension repositories that the current author can manage.',
      responses: {
        200: {
          description: 'Repository list.',
          content: jsonContent('LightExtensionRepoListEnvelope'),
        },
        403: errorResponse('The current user cannot read light-extension repositories.'),
      },
    },
  },
  '/lightExtensionRepos:get': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionRepos'],
      summary: 'Get one light-extension source repository',
      description: 'Get repository metadata and the current Head commit used for optimistic source editing.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId'],
              properties: {
                repoId: {
                  type: 'string',
                  description: 'Light-extension repository id.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Repository metadata.',
          content: jsonContent('LightExtensionRepoEnvelope'),
        },
        403: errorResponse('The current user cannot read this repository.'),
        404: errorResponse('The repository does not exist.'),
      },
    },
  },
  '/lightExtensionEntries:get': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionEntries'],
      summary: 'Get one light-extension entry',
      description: 'Get the persisted entry descriptor, source identity, health, and compile metadata.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['entryId'],
              properties: {
                entryId: {
                  type: 'string',
                  description: 'Persisted light-extension entry id.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Entry metadata.',
          content: jsonContent('LightExtensionEntryEnvelope'),
        },
        403: errorResponse('The current user cannot read this entry.'),
        404: errorResponse('The entry does not exist.'),
      },
    },
  },
  '/lightExtensionReferences:readReferences': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionReferences'],
      summary: 'Read visible light-extension references',
      description:
        'Read reference-index rows filtered by repository, entry, or owner locator. References whose owners are not visible to the current user are omitted.',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                repoId: {
                  type: 'string',
                },
                entryId: {
                  type: 'string',
                },
                ownerLocator: {
                  $ref: '#/components/schemas/LightExtensionReferenceOwnerLocator',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Visible references.',
          content: jsonContent('LightExtensionReferenceListEnvelope'),
        },
        403: errorResponse('The current user cannot read light-extension references.'),
      },
    },
  },
  '/lightExtensionContexts:get': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionContexts'],
      summary: 'Get a binding-aware light-extension Context Pack',
      description:
        'Return an ACL-filtered Context Pack for one entry. Supply referenceId or ownerLocator for a precise binding; an unselected reusable entry remains generic or multiple.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId', 'entryId'],
              properties: {
                repoId: { type: 'string' },
                entryId: { type: 'string' },
                referenceId: { type: 'string' },
                ownerLocator: { $ref: '#/components/schemas/LightExtensionReferenceOwnerLocator' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Generic, multiple, or precise Context Pack.',
          content: jsonContent('LightExtensionContextPackEnvelope'),
        },
        403: errorResponse('The current user cannot read the entry references or owner context.'),
        404: errorResponse('The repository or entry does not exist.'),
      },
    },
  },
  '/lightExtensionFiles:pull': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionFiles'],
      summary: 'Pull a light-extension source workspace',
      description:
        'Read the repository Head, tree, and optionally file contents. Use the returned repo.headCommitId as expectedHeadCommitId for the next saveSource call.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId'],
              properties: {
                repoId: {
                  type: 'string',
                },
                ref: {
                  type: 'string',
                  enum: ['head'],
                },
                knownTreeHash: {
                  type: 'string',
                  description: 'Known tree hash used to return unchanged=true when source has not changed.',
                },
                includeContent: {
                  type: 'string',
                  enum: ['none', 'selected', 'all'],
                  default: 'none',
                },
                selectedPaths: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Current source workspace.',
          content: jsonContent('LightExtensionPullEnvelope'),
        },
        403: errorResponse('The current user cannot read repository source.'),
        404: errorResponse('The repository does not exist.'),
        409: errorResponse('The repository is archived or the source backend is unavailable.'),
      },
    },
  },
  '/lightExtensionFiles:getFile': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionFiles'],
      summary: 'Read one light-extension source file',
      description: 'Read the complete UTF-8 content and immutable metadata for one source path at repository Head.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId', 'path'],
              properties: {
                repoId: {
                  type: 'string',
                },
                ref: {
                  type: 'string',
                  enum: ['head'],
                },
                path: {
                  type: 'string',
                  description: 'Repository-relative POSIX source path.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Source file.',
          content: jsonContent('LightExtensionFileEnvelope'),
        },
        403: errorResponse('The current user cannot read repository source.'),
        404: errorResponse('The repository or source file does not exist.'),
        409: errorResponse('The repository is archived or the source backend is unavailable.'),
      },
    },
  },
  '/lightExtensionFiles:saveSource': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionFiles'],
      summary: 'Save and compile an incremental light-extension source patch',
      description: [
        'Apply files as an incremental patch. Ordinary source creates one source commit and compiles runtime artifacts; src/client/js-portals files are stored outside source history and replace the Portal storage snapshot.',
        'files is a delta: include only changed upserts and deletes, not an implicit complete-workspace replacement. expectedHeadCommitId is required and must exactly match the current repository Head; pass null only for a repository without a Head.',
        'Call this tool only after the user has reviewed and confirmed the intended Diff. Saving compiles source but does not publish or deploy the extension, and the tool must never publish automatically.',
        'Use --body-file for multi-file source payloads so newlines, Unicode, quotes, template strings, and expectedHeadCommitId: null are preserved exactly. HTTP 422 returns compiler or validator problems. HTTP 409 returns LIGHT_EXTENSION_SOURCE_OUTDATED with expected and current Head values. Failed saves do not advance Head.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root business payload consumed directly by lightExtensionFiles:saveSource; do not wrap it in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId', 'expectedHeadCommitId', 'message', 'files'],
              properties: {
                repoId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
                },
                message: {
                  type: 'string',
                  minLength: 1,
                  description: 'Source commit message.',
                },
                files: {
                  type: 'array',
                  description: 'Incremental source patch. Omitted existing paths remain unchanged.',
                  items: {
                    $ref: '#/components/schemas/LightExtensionFileChange',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Source committed and runtime compilation completed successfully.',
          content: jsonContent('LightExtensionSaveSourceEnvelope'),
        },
        403: errorResponse('The current user cannot write repository source.'),
        409: {
          description:
            'The source Head is stale (LIGHT_EXTENSION_SOURCE_OUTDATED), the repository is archived, or the source backend rejected the write.',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  schemaRef('LightExtensionSourceOutdatedErrorResponse'),
                  schemaRef('LightExtensionErrorResponse'),
                ],
              },
            },
          },
        },
        422: errorResponse(
          'The final workspace failed validation or compilation. Problems are preserved in the response body.',
        ),
      },
    },
  },
  '/lightExtensions:compileWorkspacePreview': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensions'],
      summary: 'Compile an unsaved light-extension workspace preview',
      description: [
        'Validate and compile the supplied complete unsaved workspace without creating a source commit or changing repository Head.',
        'Use --body-file for multi-file UTF-8 source payloads. HTTP 200 returns { data: LightExtensionWorkspaceCheckResult } only when every requested entry is accepted. If any entry is rejected, HTTP 422 returns the same CheckResult at errors[0].details. Problems use one-based original-source ranges.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root business payload consumed directly by lightExtensions:compileWorkspacePreview; files is the complete unsaved workspace and must not be wrapped in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId', 'expectedHeadCommitId', 'files'],
              properties: {
                repoId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
                },
                entryId: {
                  type: 'string',
                  nullable: true,
                  description: 'Optional persisted entry id for targeted preview audit context.',
                },
                kind: {
                  $ref: '#/components/schemas/LightExtensionKind',
                },
                entryPath: {
                  type: 'string',
                  description:
                    'Target entry path. entryId, kind, and entryPath must be supplied together for targeted preview.',
                },
                runtimeVersion: {
                  type: 'string',
                },
                files: {
                  type: 'array',
                  minItems: 1,
                  description: 'Complete current unsaved workspace used only for preview compilation.',
                  items: {
                    $ref: '#/components/schemas/LightExtensionWorkspaceFile',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Every requested preview entry was accepted.',
          content: jsonContent('LightExtensionWorkspaceCheckEnvelope'),
        },
        403: errorResponse('The current user cannot compile light-extension previews.'),
        409: {
          description: 'The supplied expectedHeadCommitId does not match the current repository Head.',
          content: jsonContent('LightExtensionSourceOutdatedErrorResponse'),
        },
        422: {
          description:
            'At least one targeted or whole-workspace entry was rejected. Inspect errors[0].details.problems.',
          content: jsonContent('LightExtensionWorkspaceRejectedErrorResponse'),
        },
      },
    },
  },
  '/lightExtensionPreviewProblems:open': {
    post: {
      'x-mcp': false,
      tags: ['lightExtensionPreviewProblems'],
      summary: 'Open a scoped preview problem session',
      requestBody: {
        required: true,
        content: jsonContent('LightExtensionPreviewProblemOpenInput'),
      },
      responses: {
        200: {
          description: 'Opened preview problem session.',
          content: jsonContent('LightExtensionPreviewProblemSessionEnvelope'),
        },
        403: errorResponse('The current user cannot open a preview problem session.'),
      },
    },
  },
  '/lightExtensionPreviewProblems:append': {
    post: {
      'x-mcp': false,
      tags: ['lightExtensionPreviewProblems'],
      summary: 'Append sanitized browser problems to a preview session',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                schemaRef('LightExtensionPreviewProblemSessionInput'),
                {
                  type: 'object',
                  required: ['problems'],
                  properties: {
                    problems: {
                      type: 'array',
                      items: schemaRef('LightExtensionProblem'),
                    },
                  },
                },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated preview problem session.',
          content: jsonContent('LightExtensionPreviewProblemSessionEnvelope'),
        },
        403: errorResponse('The preview problem session is outside the current user or role scope.'),
        404: errorResponse('The preview problem session does not exist.'),
        409: errorResponse('The preview problem session is no longer active.'),
      },
    },
  },
  '/lightExtensionPreviewProblems:list': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionPreviewProblems'],
      summary: 'List preview problems after a cursor',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                schemaRef('LightExtensionPreviewProblemSessionInput'),
                { type: 'object', properties: { cursor: { type: 'integer', minimum: 0 } } },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Problems after the supplied cursor and the next cursor.',
          content: jsonContent('LightExtensionPreviewProblemSessionEnvelope'),
        },
        403: errorResponse('The preview problem session is outside the current user or role scope.'),
        404: errorResponse('The preview problem session does not exist.'),
      },
    },
  },
  '/lightExtensionPreviewProblems:watch': {
    post: {
      'x-mcp': true,
      tags: ['lightExtensionPreviewProblems'],
      summary: 'Poll a preview problem session after a cursor',
      description: 'The first version uses ordinary cursor polling; clients may call this operation repeatedly.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                schemaRef('LightExtensionPreviewProblemSessionInput'),
                { type: 'object', properties: { cursor: { type: 'integer', minimum: 0 } } },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Current preview problem state and problems after the supplied cursor.',
          content: jsonContent('LightExtensionPreviewProblemSessionEnvelope'),
        },
        403: errorResponse('The preview problem session is outside the current user or role scope.'),
        404: errorResponse('The preview problem session does not exist.'),
      },
    },
  },
  '/lightExtensionPreviewProblems:close': {
    post: {
      'x-mcp': false,
      tags: ['lightExtensionPreviewProblems'],
      summary: 'Close or stale a preview problem session',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                schemaRef('LightExtensionPreviewProblemSessionInput'),
                {
                  type: 'object',
                  required: ['state'],
                  properties: { state: { type: 'string', enum: ['completed', 'stale'] } },
                },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Closed preview problem session.',
          content: jsonContent('LightExtensionPreviewProblemSessionEnvelope'),
        },
        403: errorResponse('The preview problem session is outside the current user or role scope.'),
        404: errorResponse('The preview problem session does not exist.'),
      },
    },
  },
};
