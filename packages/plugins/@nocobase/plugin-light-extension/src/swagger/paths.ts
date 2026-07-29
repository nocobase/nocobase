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
      tags: ['lightExtensionEntries'],
      summary: 'Get one light-extension entry',
      description: 'Get the entry descriptor, source identity, health, compile metadata, and diagnostics.',
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
  '/lightExtensionEntries:listSelectable': {
    post: {
      tags: ['lightExtensionEntries'],
      summary: 'List reusable light-extension entries',
      description: [
        'List compiled Entries that can be bound directly to a compatible RunJS Host.',
        'The root business payload accepts optional repoId and kind filters; do not wrap it in values. Use --body-file when filters are supplied from a JSON document. Each result includes the stable repoId, Entry id, kind, name, and path needed to write a source binding.',
      ].join('\n\n'),
      requestBody: {
        required: false,
        description: 'Optional root business payload consumed directly by lightExtensionEntries:listSelectable.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                repoId: {
                  type: 'string',
                  description: 'Return selectable Entries from this Repository only.',
                },
                kind: {
                  $ref: '#/components/schemas/LightExtensionKind',
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Selectable Entry binding identities.',
          content: jsonContent('LightExtensionSelectableEntryListEnvelope'),
        },
        400: errorResponse('The Repository or kind filter is invalid.'),
        403: errorResponse('The current user cannot list reusable light-extension Entries.'),
      },
    },
  },
  '/lightExtensionReferences:readReferences': {
    post: {
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
  '/lightExtensionFiles:pull': {
    post: {
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
      tags: ['lightExtensionFiles'],
      summary: 'Save and compile an incremental light-extension source patch',
      description: [
        'Apply files as an incremental patch. The source patch creates one source commit and compiles runtime artifacts.',
        'files is a delta: include only changed upserts and deletes, not an implicit complete-workspace replacement. expectedHeadCommitId is required and must exactly match the current repository Head; pass null only for a repository without a Head.',
        'Use --body-file for multi-file source payloads so newlines, Unicode, quotes, template strings, and expectedHeadCommitId: null are preserved exactly. HTTP 422 returns compiler or validator diagnostics. HTTP 409 returns LIGHT_EXTENSION_SOURCE_OUTDATED with expected and current Head values. Failed saves do not advance Head.',
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
          'The final workspace failed validation or compilation. diagnostics are preserved in the response body.',
        ),
      },
    },
  },
  '/lightExtensions:compileWorkspacePreview': {
    post: {
      tags: ['lightExtensions'],
      summary: 'Compile an unsaved light-extension workspace preview',
      description: [
        'Validate and compile the supplied complete unsaved workspace without creating a source commit or changing repository Head.',
        'Use --body-file for multi-file payloads. HTTP 200 means every requested entry was accepted. HTTP 207 means a whole-workspace preview compiled at least one entry and rejected at least one. HTTP 422 means the targeted entry or every workspace entry was rejected. All three statuses preserve diagnostics, including path, line, and column.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root business payload consumed directly by lightExtensions:compileWorkspacePreview; files is the complete unsaved workspace and must not be wrapped in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['repoId', 'files'],
              properties: {
                repoId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  type: 'string',
                  nullable: true,
                  description: 'Optional pulled Head used to reject a stale local workspace before compilation.',
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
                  description: 'Target entry path. kind and entryPath must be supplied together for targeted preview.',
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
          content: jsonContent('LightExtensionWorkspacePreviewEnvelope'),
        },
        207: {
          description: 'Some whole-workspace preview entries were accepted and some were rejected.',
          content: jsonContent('LightExtensionWorkspacePreviewEnvelope'),
        },
        403: errorResponse('The current user cannot compile light-extension previews.'),
        409: errorResponse('The supplied expected Head no longer matches the repository Head.'),
        422: {
          description:
            'The targeted entry or every whole-workspace entry was rejected. Inspect diagnostics before retrying.',
          content: jsonContent('LightExtensionWorkspacePreviewEnvelope'),
        },
      },
    },
  },
  '/lightExtensions:moveSource': {
    post: {
      tags: ['lightExtensions'],
      summary: 'Move an inline RunJS workspace to a light extension',
      description: [
        'Atomically compile and externalize a complete inline RunJS workspace into a Light Extension Entry, then bind its Host to that Entry.',
        'Pass the root business payload directly and use --body-file for multi-file source. destination must select an existing Repository or describe a new Repository. idempotencyKey can make retries stable. HTTP 409 reports stale owner/source Head, Entry, Repository, binding, or idempotency conflicts. HTTP 422 reports compile or validation failure. Failed compilation or conflict does not advance Repository or Host state.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description: 'Root business payload consumed directly by lightExtensions:moveSource; do not wrap it in values.',
        content: jsonContent('LightExtensionMoveSourceRequest'),
      },
      responses: {
        200: {
          description: 'Source was committed, compiled, and atomically bound to the Host.',
          content: jsonContent('LightExtensionMoveSourceEnvelope'),
        },
        400: errorResponse('The locator, workspace, destination, Entry identity, or idempotency key is invalid.'),
        403: errorResponse('The current user cannot write the RunJS Host or the selected Light Extension Repository.'),
        404: errorResponse(
          'The RunJS Host, source Repository, destination Repository, origin Entry, or created Entry was not found.',
        ),
        409: errorResponse(
          'The owner fingerprint or source Head is stale, or a Repository, Entry, binding, operation, or idempotency conflict prevents the move. No persistent state is advanced.',
        ),
        422: errorResponse(
          'The complete destination workspace failed validation or compilation. No persistent state is advanced.',
        ),
      },
    },
  },
  '/lightExtensions:moveToInline': {
    post: {
      tags: ['lightExtensions'],
      summary: 'Move a Light Extension Entry workspace back inline',
      description: [
        'Compile and relocate a complete reachable Light Extension Entry workspace into its bound RunJS Host, then remove that Host binding.',
        'Pass the root business payload directly and use --body-file for multi-file source. idempotencyKey is required: the same complete request replays its first result, while a different request with the same key returns a conflict. HTTP 409 reports stale binding, Repository, source, owner, or idempotency state. HTTP 422 reports compile or validation failure. Failed compilation or conflict does not advance RunJS or Host state.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root business payload consumed directly by lightExtensions:moveToInline; do not wrap it in values.',
        content: jsonContent('LightExtensionMoveToInlineRequest'),
      },
      responses: {
        200: {
          description: 'Reachable source files were committed to RunJS and the Host was atomically moved inline.',
          content: jsonContent('LightExtensionMoveToInlineEnvelope'),
        },
        400: errorResponse(
          'The idempotency key, locator, Entry binding identity, version, or reachable source workspace is invalid.',
        ),
        403: errorResponse('The current user cannot read the Entry or write the bound RunJS Host.'),
        404: errorResponse(
          'The bound RunJS Host, Repository, Entry, source commit, or required source file was not found.',
        ),
        409: errorResponse(
          'The binding, owner, Repository, Entry, source, operation, or idempotency state prevents the move. No persistent state is advanced.',
        ),
        422: errorResponse(
          'The relocated inline workspace failed validation or compilation. No persistent state is advanced.',
        ),
      },
    },
  },
};
