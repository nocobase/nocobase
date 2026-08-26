/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type FlowSurfaceActionDocBuilder = (schemaName: string, example?: Record<string, any>, description?: string) => any;
type FlowSurfaceActionResponsesBuilder = (schemaName: string, includeValidationError?: boolean) => any;
type FlowSurfaceValuesCompatibilityNoteBuilder = (description: string) => string;

export function createFlowSurfaceTemplateActionDocs(options: {
  tag: string;
  readAclNote: string;
  requestBody: FlowSurfaceActionDocBuilder;
  responses: FlowSurfaceActionResponsesBuilder;
  valuesCompatibilityNote: FlowSurfaceValuesCompatibilityNoteBuilder;
}) {
  const { tag, readAclNote, requestBody, responses, valuesCompatibilityNote } = options;

  return {
    listTemplates: {
      tags: [tag],
      summary: 'Search saved flow surface templates for automation and CLI reuse',
      description: valuesCompatibilityNote(
        `Lists saved block / popup templates backed by FlowModel trees. Use \`search\` against \`name\` and required \`description\` to help humans and models choose the right template. ${readAclNote}`,
      ),
      requestBody: requestBody('FlowSurfaceListTemplatesRequest', {
        target: {
          uid: 'employee-table-block',
        },
        type: 'popup',
        actionType: 'view',
        actionScope: 'record',
        search: 'employee popup',
        page: 1,
        pageSize: 20,
      }),
      responses: responses('FlowSurfaceListTemplatesResult'),
    },
    getTemplate: {
      tags: [tag],
      summary: 'Read one saved flow surface template by uid',
      description: valuesCompatibilityNote(`Reads one saved template and its usage count. ${readAclNote}`),
      requestBody: requestBody('FlowSurfaceGetTemplateRequest', {
        uid: 'employee-form-template',
      }),
      responses: responses('FlowSurfaceTemplateRow'),
    },
    saveTemplate: {
      tags: [tag],
      summary: 'Save a block or popup source as a reusable template',
      description: valuesCompatibilityNote(
        'Saves the current source as a FlowModel-backed template. Only supported block sources plus supported popup action/field openers may be saved. `description` is required so API callers can search and choose templates accurately. `saveMode="duplicate"` only creates the template. `saveMode="convert"` additionally rewrites the current source into a template reference when the source kind supports it.',
      ),
      requestBody: requestBody('FlowSurfaceSaveTemplateRequest', {
        target: {
          uid: 'employee-create-form',
        },
        name: 'Employee create form',
        description: 'Reusable employee create form with common fields and popup behavior.',
        saveMode: 'duplicate',
      }),
      responses: responses('FlowSurfaceTemplateRow'),
    },
    updateTemplate: {
      tags: [tag],
      summary: 'Update template name and description',
      description: valuesCompatibilityNote(
        'Updates searchable template metadata only. Use this to refine template naming and required description without changing the stored FlowModel tree.',
      ),
      requestBody: requestBody('FlowSurfaceUpdateTemplateRequest', {
        uid: 'employee-form-template',
        name: 'Employee create form',
        description: 'Reusable employee create form with validated field order.',
      }),
      responses: responses('FlowSurfaceTemplateRow'),
    },
    destroyTemplate: {
      tags: [tag],
      summary: 'Delete an unused template and its stored target tree',
      description: valuesCompatibilityNote(
        'Deletes the template record and its stored FlowModel tree. The backend rejects deletion while `usageCount > 0` so callers do not break existing references accidentally.',
      ),
      requestBody: requestBody('FlowSurfaceDestroyTemplateRequest', {
        uid: 'employee-form-template',
      }),
      responses: responses('FlowSurfaceDestroyTemplateResult'),
    },
    convertTemplateToCopy: {
      tags: [tag],
      summary: 'Convert a referenced block, fields template, or popup template to copy mode',
      description: valuesCompatibilityNote(
        'Converts the current template reference into a detached copy. Block and field references can only move from reference to copy. Popup template references can also be reconfigured separately through action/field openView updates, but this action gives an explicit detach path.',
      ),
      requestBody: requestBody('FlowSurfaceConvertTemplateToCopyRequest', {
        target: {
          uid: 'employee-form-block',
        },
      }),
      responses: responses('FlowSurfaceConvertTemplateToCopyResult'),
    },
  };
}
