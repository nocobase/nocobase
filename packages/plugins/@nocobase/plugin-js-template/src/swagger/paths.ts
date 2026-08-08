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
    content: jsonContent('JsTemplateErrorResponse'),
  };
}

export const jsTemplatePaths = {
  '/jsTemplateProjects:list': {
    post: {
      tags: ['jsTemplateProjects'],
      summary: 'List Source Projects for JS Templates',
      description: 'List existing Source Projects for JS Templates that the current author can manage.',
      responses: {
        200: {
          description: 'Project list.',
          content: jsonContent('JsTemplateProjectListEnvelope'),
        },
        403: errorResponse('The current user cannot read Source Projects for JS Templates.'),
      },
    },
  },
  '/jsTemplateProjects:get': {
    post: {
      tags: ['jsTemplateProjects'],
      summary: 'Get one Source Project for JS Templates',
      description: 'Get project metadata and the current Head commit used for optimistic source editing.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId'],
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Source Project id.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Project metadata.',
          content: jsonContent('JsTemplateProjectEnvelope'),
        },
        403: errorResponse('The current user cannot read this project.'),
        404: errorResponse('The project does not exist.'),
      },
    },
  },
  '/jsTemplateProjects:addTemplate': {
    post: {
      tags: ['jsTemplateProjects'],
      summary: 'Add one JS Template to an existing Source Project',
      description: [
        'Create one starter JS Template in an existing enabled Source Project without replacing sibling Templates, shared source, Project metadata, or history.',
        'expectedHeadCommitId must exactly match the current Source Project Head. The server validates and compiles the complete candidate workspace before atomically committing source, reconcile state, runtime artifacts, Usage refreshes, and Audit records.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description: 'Root business payload; do not wrap it in values.',
        content: jsonContent('JsTemplateCatalogAddTemplateRequest'),
      },
      responses: {
        200: {
          description: 'The JS Template was added and the complete Source Project compiled successfully.',
          content: jsonContent('JsTemplateSaveSourceEnvelope'),
        },
        400: errorResponse('The destination, kind, name, title, or expected Head value is invalid.'),
        403: errorResponse('The current user cannot write this Source Project.'),
        404: errorResponse('The Source Project does not exist.'),
        409: {
          description:
            'The Source Project Head is stale, the destination is disabled or archived, or the JS Template already exists.',
          content: {
            'application/json': {
              schema: {
                oneOf: [schemaRef('JsTemplateSourceOutdatedErrorResponse'), schemaRef('JsTemplateErrorResponse')],
              },
            },
          },
        },
        422: errorResponse('The complete candidate workspace failed validation or compilation.'),
      },
    },
  },
  '/jsTemplates:listCatalog': {
    post: {
      tags: ['jsTemplates'],
      summary: 'List JS Templates in the catalog',
      description:
        'List one catalog row per reusable JS Template, including its Source Project, effective status, and aggregate usage count.',
      responses: {
        200: {
          description: 'JS Template catalog.',
          content: jsonContent('JsTemplateCatalogEntryListEnvelope'),
        },
        403: errorResponse('The current user cannot read the JS Template catalog.'),
      },
    },
  },
  '/jsTemplates:get': {
    post: {
      tags: ['jsTemplates'],
      summary: 'Get one JS Template',
      description: 'Get the Template descriptor, source identity, health, compile metadata, and diagnostics.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['templateId'],
              properties: {
                templateId: {
                  type: 'string',
                  description: 'Persisted JS Template id.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Template metadata.',
          content: jsonContent('JsTemplateEnvelope'),
        },
        403: errorResponse('The current user cannot read this Template.'),
        404: errorResponse('The Template does not exist.'),
      },
    },
  },
  '/jsTemplates:listSelectable': {
    post: {
      tags: ['jsTemplates'],
      summary: 'List reusable JS Templates',
      description: [
        'List compiled Templates that can be bound directly to a compatible RunJS Host.',
        'The root business payload accepts optional projectId and kind filters; do not wrap it in values. Use --body-file when filters are supplied from a JSON document. Each result includes the stable projectId, templateId, kind, name, and source path needed to write a source binding.',
      ].join('\n\n'),
      requestBody: {
        required: false,
        description: 'Optional root business payload consumed directly by jsTemplates:listSelectable.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Return selectable Templates from this Project only.',
                },
                kind: {
                  $ref: '#/components/schemas/JsTemplateKind',
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Selectable Template binding identities.',
          content: jsonContent('JsTemplateSelectableTemplateListEnvelope'),
        },
        400: errorResponse('The Project or kind filter is invalid.'),
        403: errorResponse('The current user cannot list reusable JS Templates.'),
      },
    },
  },
  '/jsTemplateUsages:listUsages': {
    post: {
      tags: ['jsTemplateUsages'],
      summary: 'List visible usage locations for one JS Template',
      description:
        'Return one paginated Template-level Usage list. owner_missing rows are excluded. Hidden owners are omitted from data and represented only by aggregate hiddenCount.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['templateId'],
              properties: {
                templateId: {
                  type: 'string',
                  minLength: 1,
                },
                page: {
                  type: 'integer',
                  minimum: 1,
                  default: 1,
                },
                pageSize: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  default: 20,
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Paginated visible usage locations and visibility-safe aggregate metadata.',
          content: jsonContent('JsTemplateUsageListEnvelope'),
        },
        400: errorResponse('templateId or pagination is invalid.'),
        403: errorResponse('The current user cannot read JS Template usages.'),
        404: errorResponse('The requested JS Template does not exist in the current application.'),
      },
    },
  },
  '/jsTemplateFiles:pull': {
    post: {
      tags: ['jsTemplateFiles'],
      summary: 'Pull a js-template source workspace',
      description:
        'Read the Project Head, tree, and optionally file contents. Use the returned project.headCommitId as expectedHeadCommitId for the next saveSource call.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId'],
              properties: {
                projectId: {
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
          content: jsonContent('JsTemplatePullEnvelope'),
        },
        403: errorResponse('The current user cannot read Project source.'),
        404: errorResponse('The Project does not exist.'),
        409: errorResponse('The Project is archived or the source backend is unavailable.'),
      },
    },
  },
  '/jsTemplateFiles:getFile': {
    post: {
      tags: ['jsTemplateFiles'],
      summary: 'Read one js-template source file',
      description: 'Read the complete UTF-8 content and immutable metadata for one source path at Project Head.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId', 'path'],
              properties: {
                projectId: {
                  type: 'string',
                },
                ref: {
                  type: 'string',
                  enum: ['head'],
                },
                path: {
                  type: 'string',
                  description: 'Project-relative POSIX source path.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Source file.',
          content: jsonContent('JsTemplateFileEnvelope'),
        },
        403: errorResponse('The current user cannot read Project source.'),
        404: errorResponse('The Project or source file does not exist.'),
        409: errorResponse('The Project is archived or the source backend is unavailable.'),
      },
    },
  },
  '/jsTemplateFiles:saveSource': {
    post: {
      tags: ['jsTemplateFiles'],
      summary: 'Save and compile an incremental js-template source patch',
      description: [
        'Apply files as an incremental patch. The source patch creates one source commit and compiles runtime artifacts.',
        'files is a delta: include only changed upserts and deletes, not an implicit complete-workspace replacement. expectedHeadCommitId is required and must exactly match the current Project Head; pass null only for a Project without a Head.',
        'Use --body-file for multi-file source payloads so newlines, Unicode, quotes, template strings, and expectedHeadCommitId: null are preserved exactly. HTTP 422 returns compiler or validator diagnostics. HTTP 409 returns JS_TEMPLATE_SOURCE_OUTDATED with expected and current Head values. Failed saves do not advance Head.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description: 'Root business payload consumed directly by jsTemplateFiles:saveSource; do not wrap it in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId', 'expectedHeadCommitId', 'message', 'files'],
              properties: {
                projectId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  $ref: '#/components/schemas/JsTemplateExpectedHeadCommitId',
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
                    $ref: '#/components/schemas/JsTemplateFileChange',
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
          content: jsonContent('JsTemplateSaveSourceEnvelope'),
        },
        403: errorResponse('The current user cannot write Project source.'),
        409: {
          description:
            'The source Head is stale (JS_TEMPLATE_SOURCE_OUTDATED), the Project is archived, or the source backend rejected the write.',
          content: {
            'application/json': {
              schema: {
                oneOf: [schemaRef('JsTemplateSourceOutdatedErrorResponse'), schemaRef('JsTemplateErrorResponse')],
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
  '/jsTemplates:compileWorkspacePreview': {
    post: {
      tags: ['jsTemplates'],
      summary: 'Compile an unsaved js-template workspace preview',
      description: [
        'Validate and compile the supplied complete unsaved workspace without creating a source commit or changing Project Head.',
        'Use --body-file for multi-file payloads. HTTP 200 means every requested Template was accepted. HTTP 207 means a whole-workspace preview compiled at least one Template and rejected at least one. HTTP 422 means the targeted Template or every workspace Template was rejected. All three statuses preserve diagnostics, including path, line, and column.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root business payload consumed directly by jsTemplates:compileWorkspacePreview; files is the complete unsaved workspace and must not be wrapped in values.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId', 'files'],
              properties: {
                projectId: {
                  type: 'string',
                },
                expectedHeadCommitId: {
                  type: 'string',
                  nullable: true,
                  description: 'Optional pulled Head used to reject a stale local workspace before compilation.',
                },
                templateId: {
                  type: 'string',
                  nullable: true,
                  description: 'Optional persisted Template id for targeted preview audit context.',
                },
                kind: {
                  $ref: '#/components/schemas/JsTemplateKind',
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
                    $ref: '#/components/schemas/JsTemplateWorkspaceFile',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Every requested preview Template was accepted.',
          content: jsonContent('JsTemplateWorkspacePreviewEnvelope'),
        },
        207: {
          description: 'Some whole-workspace preview Templates were accepted and some were rejected.',
          content: jsonContent('JsTemplateWorkspacePreviewEnvelope'),
        },
        403: errorResponse('The current user cannot compile js-template previews.'),
        409: errorResponse('The supplied expected Head no longer matches the Project Head.'),
        422: {
          description:
            'The targeted Template or every whole-workspace Template was rejected. Inspect diagnostics before retrying.',
          content: jsonContent('JsTemplateWorkspacePreviewEnvelope'),
        },
      },
    },
  },
  '/jsTemplates:saveAsJsTemplate': {
    post: {
      tags: ['jsTemplates'],
      summary: 'Save an inline RunJS workspace as a JS Template',
      description: [
        'Save an inline RunJS workspace as a JS Template.',
        'Atomically compile and save a complete inline RunJS workspace as a reusable JS Template, then bind its Host to that JS Template.',
        'Pass the root business payload directly and use --body-file for multi-file source. destination must select an existing Source Project or describe a new Source Project. idempotencyKey is required: the same complete request replays its durable result, while a different request with the same key returns a conflict. HTTP 409 reports stale owner/source Head, Template, Source Project, binding, or idempotency conflicts. HTTP 422 reports compile or validation failure. Failed compilation or conflict does not advance the Source Project or Host state.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description:
          'Root business payload consumed directly by jsTemplates:saveAsJsTemplate; do not wrap it in values.',
        content: jsonContent('SaveAsJsTemplateRequest'),
      },
      responses: {
        200: {
          description: 'The JS Template was committed, compiled, and atomically bound to the Host.',
          content: jsonContent('SaveAsJsTemplateEnvelope'),
        },
        400: errorResponse('The locator, workspace, destination, Template identity, or idempotency key is invalid.'),
        403: errorResponse('The current user cannot write the RunJS Host or the selected Source Project.'),
        404: errorResponse(
          'The RunJS Host, source Repository, destination Source Project, origin Template, or created Template was not found.',
        ),
        409: errorResponse(
          'The owner fingerprint or source Head is stale, or a Source Project, Template, binding, operation, or idempotency conflict prevents the save. No persistent state is advanced.',
        ),
        422: errorResponse(
          'The complete destination workspace failed validation or compilation. No persistent state is advanced.',
        ),
      },
    },
  },
  '/jsTemplates:detachToInline': {
    post: {
      tags: ['jsTemplates'],
      summary: 'Detach a JS Template workspace to Inline',
      description: [
        'Detach a JS Template workspace to Inline.',
        'Compile and copy the server-owned JS Template source at expectedProjectHeadCommitId into its bound RunJS Host, then remove that Host binding.',
        'Pass the five identity and CAS fields directly. idempotencyKey and expectedProjectHeadCommitId are required: the same request replays its first result, while a different request with the same key returns a conflict. HTTP 409 reports stale binding, Source Project Head, source, owner, or idempotency state. HTTP 422 reports compile or validation failure. Failed compilation or conflict does not advance RunJS or Host state.',
      ].join('\n\n'),
      requestBody: {
        required: true,
        description: 'Root business payload consumed directly by jsTemplates:detachToInline; do not wrap it in values.',
        content: jsonContent('DetachJsTemplateToInlineRequest'),
      },
      responses: {
        200: {
          description: 'Reachable source files were committed to RunJS and the Host was atomically detached to Inline.',
          content: jsonContent('DetachJsTemplateToInlineEnvelope'),
        },
        400: errorResponse(
          'The idempotency key, locator, Template binding identity, or expected Source Project Head is invalid.',
        ),
        403: errorResponse('The current user cannot read the Template or write the bound RunJS Host.'),
        404: errorResponse(
          'The bound RunJS Host, Source Project, Template, source commit, or required source file was not found.',
        ),
        409: errorResponse(
          'The binding, owner, Source Project Head, Template, source, operation, or idempotency state prevents the detach. No persistent state is advanced.',
        ),
        422: errorResponse(
          'The relocated inline workspace failed validation or compilation. No persistent state is advanced.',
        ),
      },
    },
  },
  '/jsTemplates:delete': {
    post: {
      tags: ['jsTemplates'],
      summary: 'Delete one JS Template',
      description:
        'Delete only the selected JS Template source and unreferenced artifact data. Effective usages block deletion; owner_missing usages do not. Source Project deletion remains a separate operation.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['templateId'],
              properties: {
                templateId: {
                  type: 'string',
                  minLength: 1,
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The JS Template and only its unreferenced records were deleted.',
          content: jsonContent('DeleteJsTemplateEnvelope'),
        },
        400: errorResponse('templateId is invalid.'),
        403: errorResponse('The current user cannot delete this JS Template.'),
        404: errorResponse('The JS Template or Source Project was not found.'),
        409: errorResponse('The Template has effective usages, its Source Project is archived, or source changed.'),
        422: errorResponse('The remaining Source Project failed validation or compilation.'),
      },
    },
  },
};
