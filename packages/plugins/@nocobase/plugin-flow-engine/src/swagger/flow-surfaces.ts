/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FLOW_SURFACE_MUTATE_OP_TYPES,
  FLOW_SURFACES_ACTION_METHODS,
  FLOW_SURFACES_ACTION_NAMES,
} from '../server/flow-surfaces/constants';
import {
  APPROVAL_ACTION_PUBLIC_KEYS,
  APPROVAL_BLOCK_PUBLIC_KEYS,
} from '../server/flow-surfaces/approval/catalog-specs';
import { flowSurfaceExamples as examples } from './flow-surfaces.examples';
import { createFlowSurfaceTemplateActionDocs } from './flow-surfaces.template-action-docs';
import { createFlowSurfaceTemplateSchemas } from './flow-surfaces.template-schemas';

const FLOW_SURFACES_TAG = 'flowSurfaces';
const ANY_OBJECT_SCHEMA = {
  type: 'object',
  additionalProperties: true,
};
const FILTER_GROUP_EXAMPLE = {
  logic: '$and',
  items: [],
};
const PUBLIC_DATA_SURFACE_BLOCK_DEFAULT_FILTER_DESCRIPTION =
  'Supported only on direct `table`, `list`, `gridCard`, `calendar`, or `kanban` blocks. The backend runtime keeps this input optional and compatibility-tolerant: omitted, `{}`, `null`, or `{ logic: "$and", items: [] }` normalize to the empty filter group. When a non-empty value is provided, it backfills the default `filter` action `settings.defaultFilter` when that action exists or is auto-created. If the filter action already provides `settings.defaultFilter`, the action-level value wins.';
const APPLY_BLUEPRINT_DATA_SURFACE_BLOCK_DEFAULT_FILTER_DESCRIPTION =
  'Supported only on direct `table`, `list`, `gridCard`, `calendar`, or `kanban` blocks, and must contain at least one concrete filter item. Backfills the default `filter` action `settings.defaultFilter` when that action exists or is auto-created. If the filter action already provides `settings.defaultFilter`, the action-level value wins.';
const DIRECT_ADD_DEFAULT_FILTER_COMPAT_DESCRIPTION =
  'Public block-level `defaultFilter` is supported on direct `table` / `list` / `gridCard` / `calendar` / `kanban` creates. Backend runtime compatibility is preserved: omitted or empty values remain accepted and normalize to the empty filter group. Legacy `defaultActionSettings.filter.defaultFilter` remains supported for compatibility and wins when both are provided.';
const STRING_OR_INTEGER_SCHEMA = {
  oneOf: [{ type: 'string' }, { type: 'integer' }],
};
const BASE_ACTION_TYPE_ENUM = [
  'filter',
  'addNew',
  'popup',
  'refresh',
  'expandCollapse',
  'bulkDelete',
  'bulkEdit',
  'bulkUpdate',
  'export',
  'exportAttachments',
  'import',
  'link',
  'upload',
  'js',
  'jsItem',
  'composeEmail',
  'templatePrint',
  'triggerWorkflow',
  'duplicate',
  'addChild',
  'view',
  'edit',
  'delete',
  'updateRecord',
  'submit',
  'reset',
  'collapse',
];
const ACTION_TYPE_ENUM = [...BASE_ACTION_TYPE_ENUM, ...APPROVAL_ACTION_PUBLIC_KEYS];
const APPLY_BLUEPRINT_ACTION_TYPE_ENUM = BASE_ACTION_TYPE_ENUM.filter((item) => item !== 'addChild');
const APPROVAL_BLUEPRINT_ACTION_TYPE_ENUM = [...APPROVAL_ACTION_PUBLIC_KEYS];
const BASE_NON_RECORD_ACTION_TYPE_ENUM = [
  'filter',
  'addNew',
  'popup',
  'refresh',
  'expandCollapse',
  'bulkDelete',
  'bulkEdit',
  'bulkUpdate',
  'export',
  'exportAttachments',
  'import',
  'link',
  'upload',
  'js',
  'jsItem',
  'composeEmail',
  'templatePrint',
  'triggerWorkflow',
  'submit',
  'reset',
  'collapse',
];
const NON_RECORD_ACTION_TYPE_ENUM = [...BASE_NON_RECORD_ACTION_TYPE_ENUM, ...APPROVAL_ACTION_PUBLIC_KEYS];
const RECORD_ACTION_TYPE_ENUM = [
  'popup',
  'js',
  'composeEmail',
  'templatePrint',
  'triggerWorkflow',
  'duplicate',
  'addChild',
  'view',
  'edit',
  'delete',
  'updateRecord',
];
const APPLY_BLUEPRINT_BLOCK_TYPE_ENUM = [
  'table',
  'calendar',
  'kanban',
  'createForm',
  'editForm',
  'details',
  'filterForm',
  'list',
  'gridCard',
  'markdown',
  'iframe',
  'chart',
  'actionPanel',
  'jsBlock',
  'tree',
];
const APPROVAL_BLUEPRINT_BLOCK_TYPE_ENUM = [...APPROVAL_BLOCK_PUBLIC_KEYS];
const COMPOSE_BLOCK_TYPE_ENUM = [...APPLY_BLUEPRINT_BLOCK_TYPE_ENUM, ...APPROVAL_BLOCK_PUBLIC_KEYS];
const RELATION_FIELD_TYPE_ENUM = [
  'text',
  'select',
  'picker',
  'subForm',
  'subFormList',
  'subDetails',
  'subDetailsList',
  'subTable',
  'popupSubTable',
];
const RELATION_FIELD_TYPE_SCHEMA = {
  type: 'string',
  enum: RELATION_FIELD_TYPE_ENUM,
  description: 'Public relation field UI presentation type. This is not the collection field data type/interface.',
};
const RELATION_TARGET_FIELDS_SCHEMA = {
  type: 'array',
  items: { type: 'string' },
  description:
    'Relation target record fields. For picker fields, these become selector table columns; for nested relation fields, these become sub-table columns or embedded sub-form/detail fields.',
};
const ADD_CHILD_TREE_TABLE_NOTE =
  '`addChild` is only valid when the live target `catalog.recordActions` exposes it, which normally means a table bound to a tree collection with `treeTable` enabled.';
const APPLY_BLUEPRINT_ADD_CHILD_NOTE =
  '`addChild` is not auto-promoted from `actions`; author it only under `recordActions`, and only when the live target `catalog.recordActions` exposes it for a tree table.';
const REACTION_FINGERPRINT_DESCRIPTION =
  'Optional optimistic-concurrency fingerprint from `getReactionMeta.capabilities[].fingerprint`. When provided, the write fails with HTTP 409 if the current slot fingerprint no longer matches.';
const REACTION_RULES_REPLACE_DESCRIPTION =
  'Full replacement payload for the resolved reaction slot. Pass `[]` to clear all rules from that slot.';
const REACTION_LOCALIZED_FORM_TARGET_DESCRIPTION =
  'Reaction write target. Use the live block/action uid for localized edits. For form field-value and form field-linkage writes, keep passing the outer form block uid; the backend resolves the inner form-grid slot automatically.';
const REACTION_OUTER_FORM_TARGET_NOTE = 'Pass the outer form block uid, not the inner form-grid uid.';
const REQUEST_POPUP_TRY_TEMPLATE_DESCRIPTION =
  'When true and no explicit popup.template is provided, the backend tries to auto-select one compatible popup template. Non-relation scenes only match non-relation templates. Relation scenes prefer same-relation templates first, then compatible non-relation templates. When no candidate matches, the request falls back to local/default popup behavior. If popup.saveAsTemplate is also provided, a hit reuses the matched template directly, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved as a template.';
const REQUEST_POPUP_SAVE_AS_TEMPLATE_DESCRIPTION =
  'Immediately saves explicit local popup blocks as a popup template and converts the created popup to that template reference. It cannot be combined with `popup.template`. When combined with `popup.tryTemplate`, a hit binds the matched template without creating a new one, and `popup.saveAsTemplate.local` resolves to that final bound template uid. When `popup.tryTemplate` misses, explicit local `popup.blocks` are required so the fallback popup can be saved. Later `popup.template.local` references in the same compose/applyBlueprint call reuse that final bound template uid.';
const APPLY_BLUEPRINT_POPUP_TRY_TEMPLATE_DESCRIPTION =
  'When true and no explicit popup.template is provided, applyBlueprint asks the backend to auto-select one compatible popup template. Non-relation scenes only match non-relation templates. Relation scenes prefer same-relation templates first, then compatible non-relation templates. When no candidate matches, inline popup blocks/layout still act as the fallback if present. If popup.saveAsTemplate is also provided, a hit reuses the matched template directly, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved as a template.';
const APPLY_BLUEPRINT_POPUP_SAVE_AS_TEMPLATE_DESCRIPTION =
  'Immediately saves explicit local popup blocks as a popup template and converts the created popup to that template reference. It cannot be combined with `popup.template`. When combined with `popup.tryTemplate`, a hit binds the matched template without creating a new one, and `popup.saveAsTemplate.local` resolves to that final bound template uid. When `popup.tryTemplate` misses, explicit local `popup.blocks` are required so the fallback popup can be saved. Later `popup.template.local` references in the same blueprint reuse that final bound template uid.';
function ref(name: string) {
  return {
    $ref: `#/components/schemas/${name}`,
  };
}

function parameterRef(name: string) {
  return {
    $ref: `#/components/parameters/${name}`,
  };
}

function dataEnvelope(schema: Record<string, any>) {
  return {
    type: 'object',
    required: ['data'],
    properties: {
      data: schema,
    },
  };
}

function jsonContent(schema: Record<string, any>, example?: Record<string, any>) {
  return {
    'application/json': {
      schema,
      ...(example ? { example } : {}),
    },
  };
}

function requestBody(schemaName: string, example?: Record<string, any>, description?: string) {
  return {
    required: true,
    ...(description ? { description } : {}),
    content: jsonContent(ref(schemaName), example),
  };
}

function responses(schemaName: string, includeValidationError = true) {
  return {
    200: {
      description: 'OK',
      content: jsonContent(dataEnvelope(ref(schemaName))),
    },
    ...(includeValidationError
      ? {
          400: {
            description: 'Invalid public request parameters or semantics',
            content: jsonContent(ref('FlowSurfaceErrorResponse')),
          },
          403: {
            description: 'Current role is not allowed to call this action',
            content: jsonContent(ref('FlowSurfaceErrorResponse')),
          },
          409: {
            description: 'Current FlowSurface state conflicts with the requested operation',
            content: jsonContent(ref('FlowSurfaceErrorResponse')),
          },
          500: {
            description: 'Unexpected internal server error',
            content: jsonContent(ref('FlowSurfaceErrorResponse')),
          },
        }
      : {}),
  };
}

function valuesCompatibilityNote(description: string) {
  return [
    description,
    '',
    'SDK compatibility note: `resource("flowSurfaces").action({ values: payload })` is still supported.',
    'The request schema in this Swagger document describes the final business payload, not the outer SDK `values` wrapper.',
  ].join('\n');
}

function buildReactionWriteRequestSchema(ruleSchemaName: string) {
  return {
    type: 'object',
    required: ['target', 'rules'],
    properties: {
      target: {
        allOf: [ref('FlowSurfaceWriteTarget')],
        description: REACTION_LOCALIZED_FORM_TARGET_DESCRIPTION,
      },
      rules: {
        type: 'array',
        items: ref(ruleSchemaName),
        description: REACTION_RULES_REPLACE_DESCRIPTION,
      },
      expectedFingerprint: {
        type: 'string',
        description: REACTION_FINGERPRINT_DESCRIPTION,
      },
      verify: {
        type: 'boolean',
        description:
          'Reserved compatibility flag. Current v1 writes are full replace and return normalized output directly.',
      },
    },
    additionalProperties: false,
  };
}

function buildFlowSurfaceRequestPopupSchema() {
  return {
    type: 'object',
    anyOf: [
      {
        required: ['template'],
      },
      {
        required: ['tryTemplate'],
      },
      {
        required: ['defaultType'],
      },
      {
        anyOf: [{ required: ['title'] }, { required: ['mode'] }, { required: ['blocks'] }, { required: ['layout'] }],
      },
    ],
    properties: {
      title: {
        type: 'string',
      },
      template: ref('FlowSurfaceRequestPopupTemplateRef'),
      tryTemplate: {
        type: 'boolean',
        description: REQUEST_POPUP_TRY_TEMPLATE_DESCRIPTION,
      },
      defaultType: {
        type: 'string',
        enum: ['view', 'edit'],
        description:
          'When popup content is omitted, asks the backend to prefer a compatible popup template first and otherwise auto-generate a default relation popup. Defaults to `view` for field popups.',
      },
      saveAsTemplate: {
        allOf: [ref('FlowSurfaceRequestPopupSaveAsTemplate')],
        description: REQUEST_POPUP_SAVE_AS_TEMPLATE_DESCRIPTION,
      },
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockSpec'),
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  };
}

function buildReactionWriteResultSchema(ruleSchemaName: string) {
  return {
    type: 'object',
    required: ['target', 'resolvedScene', 'resolvedSlot', 'fingerprint', 'normalizedRules', 'canonicalRules'],
    properties: {
      target: {
        allOf: [ref('FlowSurfaceReactionTargetSummary')],
        description: 'Resolved public reaction target after target normalization.',
      },
      resolvedScene: {
        allOf: [ref('FlowSurfaceReactionScene')],
        description:
          'Concrete reaction scene that the backend resolved for this write, such as `form`, `details`, `subForm`, `block`, or `action`.',
      },
      resolvedSlot: {
        allOf: [ref('FlowSurfaceReactionSlot')],
        description: 'Concrete persisted slot selected by the backend for this write.',
      },
      fingerprint: {
        type: 'string',
        description: 'Fresh slot fingerprint after the write completes.',
      },
      normalizedRules: {
        type: 'array',
        items: ref(ruleSchemaName),
        description: 'Normalized public rules persisted by the write.',
      },
      canonicalRules: {
        type: 'array',
        items: ANY_OBJECT_SCHEMA,
        description: 'Canonical internal rules compiled from the normalized public rules.',
      },
      updateAssociationValues: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  };
}

function buildReactionCapabilitySchema(
  kind: 'fieldValue' | 'blockLinkage' | 'fieldLinkage' | 'actionLinkage',
  ruleSchemaName: string,
  extraProperties: Record<string, any> = {},
) {
  return {
    type: 'object',
    required: ['kind', 'resolvedScene', 'resolvedSlot', 'fingerprint', 'normalizedRules', 'canonicalRules', 'context'],
    properties: {
      kind: {
        type: 'string',
        enum: [kind],
      },
      resolvedScene: ref('FlowSurfaceReactionScene'),
      resolvedSlot: ref('FlowSurfaceReactionSlot'),
      fingerprint: {
        type: 'string',
      },
      normalizedRules: {
        type: 'array',
        items: ref(ruleSchemaName),
      },
      canonicalRules: {
        type: 'array',
        items: ANY_OBJECT_SCHEMA,
      },
      context: ref('FlowSurfaceContextResponse'),
      ...extraProperties,
    },
    additionalProperties: false,
  };
}

const FLOW_SURFACES_READ_ACL_NOTE =
  'Read actions (`get` / `describeSurface` / `catalog` / `context` / `getReactionMeta` / `listTemplates` / `getTemplate`) are open to `loggedIn` by default. Write actions still require the `ui.flowSurfaces` snippet.';

const templateActionDocs = createFlowSurfaceTemplateActionDocs({
  tag: FLOW_SURFACES_TAG,
  readAclNote: FLOW_SURFACES_READ_ACL_NOTE,
  requestBody,
  responses,
  valuesCompatibilityNote,
});

const templateSchemas = createFlowSurfaceTemplateSchemas({
  ref,
  stringOrIntegerSchema: STRING_OR_INTEGER_SCHEMA,
  actionTypeEnum: ACTION_TYPE_ENUM,
});

const actionDocs: Record<string, any> = {
  catalog: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'List capabilities available in the current surface context',
    description: valuesCompatibilityNote(
      `Returns the block / field / action capabilities that can be created under the current target context, together with the recommended \`configureOptions\`, the underlying settings contract, event capabilities, and layout capabilities for the current node. The returned \`blocks[] / actions[] / recordActions[]\` only represent the truly available public capabilities under plugins enabled in the current instance. When \`sections\` is omitted, the server smart-selects the sections for the current target scenario, and clients should treat \`selectedSections\` in the response as the final authoritative result. For advanced field-value or linkage authoring, prefer \`getReactionMeta\` + \`set*Rules\` instead of guessing raw \`configureOptions\` keys. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceCatalogRequest', examples.catalog),
    responses: responses('FlowSurfaceCatalogResponse'),
  },
  context: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Read ctx variable tree available under the current target',
    description: valuesCompatibilityNote(
      `Returns the low-level \`ctx\` variable tree available under the current target. \`path\` only accepts bare paths such as \`record\`, \`popup.record\`, and \`item.parentItem.value\`. Do not pass \`ctx.record\` or \`{{ ctx.record }}\`. For reaction authoring, use \`getReactionMeta\` as the main discovery endpoint first and use \`context\` only as a lower-level supplement when you need to inspect raw variable paths. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceContextRequest', examples.context),
    responses: responses('FlowSurfaceContextResponse'),
  },
  getReactionMeta: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Read reaction capabilities, current rules, and contextual authoring metadata',
    description: valuesCompatibilityNote(
      `Returns the current advanced reaction capabilities for the target, including resolved scene/slot, normalized rules, canonical rules, available \`targetFields\`, \`supportedActions\`, and \`conditionMeta\` / \`valueExprMeta\` authoring metadata. This is the main discovery endpoint for CLI or AI callers before configuring field values or linkage rules. For form \`fieldValue\` / \`fieldLinkage\` authoring, callers still pass the outer form block uid; the backend resolves the concrete form-grid slot automatically. Use \`context\` only as a supplement when you need to inspect the raw variable tree behind the returned metadata. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceGetReactionMetaRequest', examples.getReactionMeta),
    responses: responses('FlowSurfaceGetReactionMetaResult'),
  },
  setFieldValueRules: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace field value rules on a create/edit form block',
    description: valuesCompatibilityNote(
      `Fully replaces the field-value slot on the target form block. ${REACTION_OUTER_FORM_TARGET_NOTE} \`rules: []\` clears the slot. \`expectedFingerprint\` should usually come from \`getReactionMeta.capabilities[].fingerprint\` and enables optimistic concurrency against the current slot state.`,
    ),
    requestBody: requestBody('FlowSurfaceSetFieldValueRulesRequest', examples.setFieldValueRules),
    responses: responses('FlowSurfaceSetFieldValueRulesResult'),
  },
  setBlockLinkageRules: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace block-level linkage rules on a supported block',
    description: valuesCompatibilityNote(
      'Fully replaces the block-linkage slot on the target block. `rules: []` clears the slot. `expectedFingerprint` should usually come from `getReactionMeta.capabilities[].fingerprint` and enables optimistic concurrency against the current slot state.',
    ),
    requestBody: requestBody('FlowSurfaceSetBlockLinkageRulesRequest', examples.setBlockLinkageRules),
    responses: responses('FlowSurfaceSetBlockLinkageRulesResult'),
  },
  setFieldLinkageRules: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace field-level linkage rules on a supported form/details/sub-form target',
    description: valuesCompatibilityNote(
      'Fully replaces the field-linkage slot on the target. The backend resolves the concrete scene automatically (`form`, `details`, or `subForm`) and returns it in `resolvedScene` / `resolvedSlot`. Supported actions are surfaced by `getReactionMeta`, commonly including `setFieldState`, `assignField`, and scene-specific defaults. For form scenes, keep passing the outer form block uid and let the backend resolve the inner grid slot. `expectedFingerprint` should usually come from `getReactionMeta.capabilities[].fingerprint`.',
    ),
    requestBody: requestBody('FlowSurfaceSetFieldLinkageRulesRequest', examples.setFieldLinkageRules),
    responses: responses('FlowSurfaceSetFieldLinkageRulesResult'),
  },
  setActionLinkageRules: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace action-level linkage rules on a supported action',
    description: valuesCompatibilityNote(
      'Fully replaces the action-linkage slot on the target action. `rules: []` clears the slot. `expectedFingerprint` should usually come from `getReactionMeta.capabilities[].fingerprint` and enables optimistic concurrency against the current slot state.',
    ),
    requestBody: requestBody('FlowSurfaceSetActionLinkageRulesRequest', examples.setActionLinkageRules),
    responses: responses('FlowSurfaceSetActionLinkageRulesResult'),
  },
  get: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Read normalized surface tree and route metadata',
    description: [
      'Reads the normalized Flow surface readback result as the stable read endpoint for CLI and orchestration tools.',
      '',
      'Only root-level locator fields are accepted. Exactly one of the following four fields must be used as the locator.',
      'Do not wrap the payload with `{ target: { ... } }`.',
      'Do not wrap the payload with `{ values: { ... } }`.',
      FLOW_SURFACES_READ_ACL_NOTE,
      'The `target` in the response only keeps lightweight locator information. Read the full node tree from `tree`.',
      'Tabs for route-backed pages are always read from `tree.subModels.tabs`. Top-level `tabs` / `tabTrees` are no longer returned separately.',
      '',
      `Example: GET /api/flowSurfaces:get?uid=${examples.getPopupQuery.uid}`,
      `Example: GET /api/flowSurfaces:get?pageSchemaUid=${examples.getPageQuery.pageSchemaUid}`,
    ].join('\n'),
    parameters: [
      parameterRef('flowSurfaceTargetUid'),
      parameterRef('flowSurfaceTargetPageSchemaUid'),
      parameterRef('flowSurfaceTargetTabSchemaUid'),
      parameterRef('flowSurfaceTargetRouteId'),
    ],
    responses: responses('FlowSurfaceGetResponse'),
  },
  describeSurface: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Read surface tree with stable keys and fingerprint',
    description: valuesCompatibilityNote(
      `Reads the current surface together with request-scoped bind keys, persisted declared keys, and an optimistic-concurrency fingerprint. The fingerprint is computed from the public surface tree together with the resolved key bindings and ignores key source differences such as \`request\` vs \`declared\`. The public readback strips the internal declared-key metadata path from node.stepParams. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceDescribeSurfaceRequest', examples.describeSurface),
    responses: responses('FlowSurfaceDescribeSurfaceResponse'),
  },
  applyBlueprint: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Apply a page blueprint to create or replace one Modern page',
    description: valuesCompatibilityNote(
      'Accepts one simplified JSON page blueprint and compiles it to internal flow-surface operations. The public blueprint describes page structure (`create` or `replace`, page metadata, ordered tabs, blocks, fields, actions, inline popups, optional reusable assets) and optional top-level `reaction.items[]` for whole-page interaction authoring. Each reaction item targets an explicit local key / bind key produced by the same blueprint run. Only explicitly listed reaction items are written. `rules: []` clears the targeted slot. Repeating the same `(type, target)` reaction slot in one blueprint is invalid. In `replace`, reaction targets always bind to the newly produced blueprint result, not historical nodes from the previous page version; if a slot must exist in the resulting surface, include it explicitly instead of relying on omission. Localized reaction edits on an existing surface should use `getReactionMeta` + `set*Rules` instead of applying a whole page blueprint again. The request body is that page-document JSON object itself and must not be JSON-stringified. Wrong: `{ "requestBody": "{\\"version\\":\\"1\\"}" }`. Internal planning details stay hidden. In `create`, `navigation.group.routeId` is the preferred way to target an existing menu group. It is exact-targeting only and cannot be mixed with existing-group metadata such as `icon`, `tooltip`, or `hideInMenu`; applyBlueprint create mode does not mutate existing group metadata, so callers should use `updateMenu` separately when that is required. When only `navigation.group.title` is provided, applyBlueprint reuses one existing same-title group when it is unique, creates a new group when none exists, and rejects ambiguous multi-match cases. Same-title reuse is title-only; if an existing group\'s metadata must change, use low-level `updateMenu` instead of applyBlueprint create. `replace` uses `target.pageSchemaUid`, updates only the explicit page-level fields provided in `page`, maps blueprint tabs to existing route-backed tab slots by index, rewrites each slot in order, removes trailing old tabs, and appends extra new tabs when needed. Tab and block keys are optional in the public blueprint; omit them unless custom layout or cross-block targeting needs a stable in-document identifier. `layout` is only allowed on tabs and inline popup documents; blocks themselves do not accept a `layout` property. Public applyBlueprint blocks do not support generic `form`; use `editForm` or `createForm`. Direct `table` / `list` / `gridCard` / `calendar` / `kanban` blocks may also provide non-empty block-level `defaultFilter`, which backfills the default `filter` action `settings.defaultFilter`; explicit filter-action `settings.defaultFilter` still wins. Inline popup documents may set `popup.tryTemplate=true` to ask the backend for the best compatible popup template before falling back to local popup content. Inline popup documents may also combine `popup.tryTemplate` with `popup.saveAsTemplate={ name, description, local? }`: a hit binds the matched template immediately and lets later inline popups in the same blueprint reuse that final bound template through `popup.template={ local, mode }`, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved and reused. Custom `edit` popups that provide `popup.blocks` must include exactly one `editForm` block; that `editForm` may omit `resource` and then inherits the opener\'s current-record context. When layout is omitted, applyBlueprint auto-generates a simple top-to-bottom layout. When a `replace` run expands a page to multiple tabs while the current page still has `enableTabs=false`, callers must set `page.enableTabs=true` explicitly. The response hides execution internals and returns only the resolved page target and final surface readback.',
    ),
    requestBody: {
      required: true,
      description:
        'The JSON request body. Send the page document object itself under requestBody as an object; do not JSON.stringify it and do not wrap it in { values: ... }.',
      content: {
        'application/json': {
          schema: ref('FlowSurfaceApplyBlueprintRequest'),
          examples: {
            createPage: {
              summary: 'Create one Modern page from a page blueprint',
              value: examples.applyBlueprint,
            },
            replacePage: {
              summary: 'Replace one existing Modern page by pageSchemaUid',
              value: examples.applyBlueprintReplace,
            },
            calendarPage: {
              summary: 'Create a direct calendar block with block-level defaultFilter',
              value: examples.applyBlueprintCalendar,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceApplyBlueprintResponse'),
  },
  applyApprovalBlueprint: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Apply an approval blueprint to initiator, approver, or task-card surfaces',
    description: valuesCompatibilityNote(
      "Builds workflow-approval configuration surfaces through the existing flowSurfaces orchestration layer instead of a separate approval resource. This is the preferred whole-surface bootstrap / replace entry for approval initiator, approver, and task-card UIs. Unlike route-backed `applyBlueprint`, this action targets approval-bound FlowModel roots stored on approval workflow trigger config (`workflow.config.approvalUid` / `workflow.config.taskCardUid`) or approval node config (`node.config.approvalUid` / `node.config.taskCardUid`). The backend creates or reuses the correct approval root automatically, rewrites the binding uid, applies a `replace` blueprint to that root, and reconciles approval runtime config derived from approval actions such as withdraw / approve / reject / return / delegate / add-assignee. `surface='initiator'` requires `workflowId` and writes page-like `blocks + layout` into `TriggerChildPageModel -> TriggerChildPageTabModel -> TriggerBlockGridModel`. `surface='approver'` requires `nodeId` and writes page-like `blocks + layout` into `ApprovalChildPageModel -> ApprovalChildPageTabModel -> ApprovalBlockGridModel`. Page-like `blocks[]` may either declare a concrete `type` or reuse a saved block template through `template: { uid, mode }`. `surface='taskCard'` requires exactly one of `workflowId` or `nodeId` and writes `fields + layout` into `ApplyTaskCardDetailsModel` or `ApprovalTaskCardDetailsModel`. This v1 action does not cover legacy schema-config wiring; it focuses on approval FlowModel construction, binding persistence, and approval runtime-config synchronization. When `layout` is omitted, the backend generates a simple top-to-bottom layout for the resulting blocks or fields.",
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceApplyApprovalBlueprintRequest'),
          examples: {
            initiator: {
              summary: 'Replace an approval initiator surface on the workflow trigger',
              value: examples.applyApprovalBlueprintInitiator,
            },
            approver: {
              summary: 'Replace an approval approver surface on one approval node',
              value: examples.applyApprovalBlueprintApprover,
            },
            taskCard: {
              summary: 'Replace an approval task-card surface on one approval node',
              value: examples.applyApprovalBlueprintTaskCard,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceApplyApprovalBlueprintResponse'),
  },
  ...templateActionDocs,
  compose: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Compose blocks, fields, actions and simple layout under an existing surface',
    description: valuesCompatibilityNote(
      'Organizes content under an existing page/tab/grid/popup using the public block/action/field semantics as a low-level building primitive. The caller does not need to pass raw `use`, `fieldUse`, or `stepParams`. Blocks, fields, and actions can declare stable `key` values, and the compose result returns the same keys so later orchestration can reference nested popup or form nodes deterministically. Direct `table` / `list` / `gridCard` / `calendar` / `kanban` blocks may provide block-level `defaultFilter`; backend runtime compatibility remains compatibility-tolerant for omitted or empty values, and any provided value backfills the default `filter` action `settings.defaultFilter`. Explicit filter-action `settings.defaultFilter` still wins. Blocks may be created from `template`, and form templates can set `template.usage="fields"` to import only their grid fields. Popup-capable actions and fields may reuse `popup.template`, set `popup.tryTemplate=true` to ask the backend for one compatible popup template before falling back to local/default popup behavior, or combine `popup.tryTemplate` with `popup.saveAsTemplate={ name, description, local? }`: a hit binds the matched template immediately and lets later popup-capable fields/actions in the same compose call reuse that final bound template through `popup.template={ local, mode }`, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved and reused. For collection blocks under a popup, check `catalog.blocks[].resourceBindings` first. The `select / subForm / bulkEditForm` scene is currently recognized only, and popup collection block creation is not supported in that scene. For approval surfaces, use `applyApprovalBlueprint` first to bootstrap or replace the bound approval root; use `compose` only after that root already exists.',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceComposeRequest'),
          examples: {
            filterTable: {
              summary: 'Compose a filter-form and table with block actions, record actions and a simple 3:7 row layout',
              value: examples.compose,
            },
            popupCurrentRecord: {
              summary: 'Compose a current-record details block under a record popup surface',
              value: examples.composePopupCurrentRecord,
            },
            popupAssociatedRecords: {
              summary: 'Compose an associated-records table under an association-field popup surface',
              value: examples.composePopupAssociatedRecords,
            },
            staticBlocks: {
              summary: 'Compose markdown, iframe and action-panel blocks with simple settings',
              value: examples.composeStatic,
            },
            listRich: {
              summary: 'Compose a list block with item fields, block actions and record actions',
              value: examples.composeListRich,
            },
            gridCardRich: {
              summary: 'Compose a grid-card block with item fields, block actions and record actions',
              value: examples.composeGridCardRich,
            },
            jsBlock: {
              summary: 'Compose a JS block with simple code/version/title settings',
              value: examples.composeJsBlock,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceComposeResult'),
  },
  configure: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Apply simple semantic changes to a page, tab, block, field or action',
    description: valuesCompatibilityNote(
      'Uses simple `changes` to update high-frequency settings such as page/tab titles, table pageSize, field clickToOpen, and action openView/confirm without requiring the caller to know internal paths. For advanced reaction authoring, prefer `getReactionMeta` + `set*Rules`; the raw `assignRules` / `linkageRules` examples here are compatibility-only. Check `catalog.node.configureOptions` together with the relevant catalog item `configureOptions` before calling this action. On approval action nodes, this route also accepts approval-specific keys such as `confirm`, `assignValues`, `commentFormUid`, `approvalReturn`, and `assigneesScope`, and flowSurfaces persists the matching approval runtime config. It does not replace `applyApprovalBlueprint` for whole-surface approval bootstrap.',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceConfigureRequest'),
          examples: {
            fieldOpenView: {
              summary: 'Configure a field to click and open a popup view',
              value: examples.configure,
            },
            associationFieldPopup: {
              summary: 'Configure a to-many association display field to open the clicked associated record in a popup',
              value: examples.configureAssociationPopup,
            },
            blockSettings: {
              summary: 'Configure a list block with simple pageSize/dataScope/sorting/layout changes',
              value: examples.configureBlock,
            },
            actionSettings: {
              summary: 'Configure an action with button appearance, confirm dialog and assign values',
              value: examples.configureAction,
            },
            jsBlockSettings: {
              summary: 'Configure a JS block with decorator props and runJs code/version',
              value: examples.configureJsBlock,
            },
            jsActionSettings: {
              summary: 'Configure a JS action with button text and runJs code/version',
              value: examples.configureJsAction,
            },
            jsItemActionSettings: {
              summary: 'Configure a form JS item action with button text and runJs code/version',
              value: examples.configureJsItemAction,
            },
            jsFieldSettings: {
              summary: 'Configure a JS field wrapper and inner JS field with code/version',
              value: examples.configureJsField,
            },
            jsColumnSettings: {
              summary: 'Configure a JS column with width/fixed/code/version',
              value: examples.configureJsColumn,
            },
            jsItemSettings: {
              summary: 'Configure a JS item with label and runJs code/version',
              value: examples.configureJsItem,
            },
            pageHeaderSettings: {
              summary: 'Configure page icon and enableHeader using configureOptions',
              value: examples.configurePage,
            },
            tableAdvancedSettings: {
              summary: 'Configure advanced table simple keys such as quickEdit/treeTable/dragSort',
              value: examples.configureTableAdvanced,
            },
            editFormSettings: {
              summary: 'Configure edit form colon and dataScope with a FilterGroup',
              value: examples.configureEditForm,
            },
            detailsCompatibilitySettings: {
              summary: 'Configure details colon and raw low-level linkageRules compatibility payload',
              value: examples.configureDetailsCompatibility,
            },
            actionBehaviorCompatibilitySettings: {
              summary:
                'Configure action edit/update/duplicate modes plus raw low-level linkageRules compatibility payload',
              value: examples.configureActionModesCompatibility,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceConfigureResult'),
  },
  createMenu: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Create a group menu or a bindable V2 menu item',
    description: valuesCompatibilityNote(
      'Creates a FlowSurfaces menu node. `type="group"` creates a menu group. `type="item"` creates a menu item that can be bound to a modern page (v2), and automatically fills in the flowPage route, the default hidden tab route, and the RootPageModel anchor.',
    ),
    requestBody: requestBody('FlowSurfaceCreateMenuRequest', examples.createMenu),
    responses: responses('FlowSurfaceCreateMenuResult'),
  },
  updateMenu: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Update menu title/icon/tooltip or move it under another group',
    description: valuesCompatibilityNote(
      'Updates menu display information, or moves a group / item to the top level or under another group. Only `group` and `flowPage` menu nodes are supported.',
    ),
    requestBody: requestBody('FlowSurfaceUpdateMenuRequest', examples.updateMenu),
    responses: responses('FlowSurfaceUpdateMenuResult'),
  },
  createPage: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Initialize a modern page for an existing bindable menu item',
    description: valuesCompatibilityNote(
      'Initializes a modern page (v2) for an existing bindable menu item through `menuRouteId` first, and fills in the default BlockGridModel. In compatibility mode, if `menuRouteId` is omitted, the old behavior still applies and a top-level menu plus page will be created automatically. Before initialization, do not call page/tab lifecycle actions such as `addTab`, `updateTab`, `moveTab`, `removeTab`, or `destroyPage`.',
    ),
    requestBody: requestBody('FlowSurfaceCreatePageRequest', examples.createPage),
    responses: responses('FlowSurfaceCreatePageResult'),
  },
  destroyPage: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Destroy a modern page and its anchors',
    description: valuesCompatibilityNote(
      'Removes the page route, tab route, and the corresponding FlowModel subtree. Only a root-level `uid` is accepted. If you only have `pageSchemaUid` or `routeId`, call `flowSurfaces:get` first. For menu-first pages, `createPage(menuRouteId=...)` must finish initialization before this action can be called.',
    ),
    requestBody: requestBody('FlowSurfaceDestroyPageRequest', {
      uid: 'employees-page-uid',
    }),
    responses: responses('FlowSurfaceDestroyPageResult'),
  },
  addTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a tab under a page',
    description: valuesCompatibilityNote(
      'Adds a route-backed tab under a page and fills in the corresponding grid anchor. Only `target.uid` is accepted, and it must be the canonical uid of the page. For menu-first pages, `createPage(menuRouteId=...)` must finish initialization first.',
    ),
    requestBody: requestBody('FlowSurfaceAddTabRequest', examples.addTab),
    responses: responses('FlowSurfaceAddTabResult'),
  },
  updateTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Update tab title, icon, document title and flow registry',
    description: valuesCompatibilityNote(
      'Updates the route-backed fields on the tab route and its matching synthetic RootPageTabModel. Only `target.uid` is accepted, and it must be a tab uid. Pre-created tabs under uninitialized pages are not supported by this action.',
    ),
    requestBody: requestBody('FlowSurfaceUpdateTabRequest', examples.updateTab),
    responses: responses('FlowSurfaceUpdateTabResult'),
  },
  moveTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Reorder sibling tabs under the same page',
    description: valuesCompatibilityNote(
      'Reorders sibling tabs under the same page. Only root-level `sourceUid` / `targetUid` are accepted. Pre-created tabs under uninitialized pages are not supported by this action.',
    ),
    requestBody: requestBody('FlowSurfaceMoveTabRequest', {
      sourceUid: 'details-tab',
      targetUid: 'overview-tab',
      position: 'before',
    }),
    responses: responses('FlowSurfaceMoveTabResult'),
  },
  removeTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Remove a tab route and its anchor tree',
    description: valuesCompatibilityNote(
      'Removes the tab route and its matching FlowModel subtree. Only a root-level `uid` is accepted. The canonical uid of the current outer route-backed tab is the `tabSchemaUid` in the response. The last outer tab cannot be removed. Use `destroyPage` to remove the whole page. Pre-created tabs under uninitialized pages are not supported by this action.',
    ),
    requestBody: requestBody('FlowSurfaceRemoveTabRequest', {
      uid: 'details-tab',
    }),
    responses: responses('FlowSurfaceRemoveTabResult'),
  },
  addPopupTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a popup child tab under an existing popup page',
    description: valuesCompatibilityNote(
      'Adds a persisted child-tab subtree under an existing popup page (`ChildPageModel`). It only works on `ChildPageModel / ChildPageTabModel`, does not read or write `desktopRoutes`, and does not auto-create a popup page.',
    ),
    requestBody: requestBody('FlowSurfaceAddPopupTabRequest', examples.addPopupTab),
    responses: responses('FlowSurfaceAddPopupTabResult'),
  },
  updatePopupTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Update popup child tab title, icon, document title and flow registry',
    description: valuesCompatibilityNote(
      'Updates the props / stepParams / flowRegistry of a popup child tab (`ChildPageTabModel`) itself. Route-backed tab semantics are not involved.',
    ),
    requestBody: requestBody('FlowSurfaceUpdatePopupTabRequest', examples.updatePopupTab),
    responses: responses('FlowSurfaceUpdatePopupTabResult'),
  },
  movePopupTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Reorder sibling popup child tabs under the same popup page',
    description: valuesCompatibilityNote(
      'Reorders `subModels.tabs` under the same popup page. Only root-level `sourceUid` / `targetUid` are accepted, and both must be sibling popup-tab uids.',
    ),
    requestBody: requestBody('FlowSurfaceMovePopupTabRequest', examples.movePopupTab),
    responses: responses('FlowSurfaceMovePopupTabResult'),
  },
  removePopupTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Remove a popup child tab subtree',
    description: valuesCompatibilityNote(
      'Removes the specified popup child-tab subtree. It is valid for the popup to end with 0 tabs. `removePopup` is not provided in this iteration, and the popup page is not required to keep at least one tab.',
    ),
    requestBody: requestBody('FlowSurfaceRemovePopupTabRequest', examples.removePopupTab),
    responses: responses('FlowSurfaceRemovePopupTabResult'),
  },
  addBlock: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a block under a surface or grid container',
    description: valuesCompatibilityNote(
      'Creates a block by catalog key or an explicitly supported block use. It can also create from `template`, using `mode="reference"` or `mode="copy"`. Form templates may set `template.usage="fields"` to create a fresh host block and import only its grid fields. Popup-capable host nodes automatically receive the popup shell. For collection blocks under a popup, check `catalog.blocks[].resourceBindings` first, then pass the semantic `resource.binding`. The lower-level `resourceInit` is still accepted for compatibility, but the server validates it against popup semantics. `resource` and `resourceInit` are mutually exclusive. Direct `table` / `list` / `gridCard` / `calendar` / `kanban` creation may also provide block-level `defaultFilter`; backend runtime compatibility remains tolerant of omitted or empty values, and any provided value backfills the auto-created default filter action. Legacy `defaultActionSettings.filter.defaultFilter` is still supported for compatibility and wins when both are provided. The `select / subForm / bulkEditForm` scene is currently recognized only, and popup collection block creation is not supported in that scene. Direct add does not accept raw `props` / `decoratorProps` / `stepParams` / `flowRegistry`. Use `settings` and reuse the public configuration semantics from `configure.changes` plus the catalog item/node `configureOptions`. Approval block keys are only exposed under approval grids and do not auto-create an approval root; bootstrap approval surfaces with `applyApprovalBlueprint` first.',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddBlockRequest'),
          examples: {
            popupCurrentRecord: {
              summary: 'Create a current-record details block under a popup-capable host node',
              value: examples.addBlock,
            },
            popupAssociatedRecords: {
              summary: 'Create an associated-records table block under an association-field popup host node',
              value: examples.addPopupAssociatedBlock,
            },
            popupOtherRecords: {
              summary: 'Create a table bound to another collection explicitly under a popup host node',
              value: examples.addPopupOtherRecordsBlock,
            },
            jsBlock: {
              summary: 'Create a JS block directly under a page/tab/grid container',
              value: examples.addJsBlock,
            },
            tableDefaultFilters: {
              summary: 'Create a table and configure the auto-created default filter action',
              value: examples.addTableBlockWithDefaultFilters,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddBlockResult'),
  },
  addField: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a field wrapper and inner field under a field container',
    description: valuesCompatibilityNote(
      'Automatically derives the wrapper/inner-field combination from the container use and the field interface. Relation fields can request a public `fieldType` such as `picker`, `subTable`, or `popupSubTable`, with optional flat `fields` and `titleField`. For picker fields, `fields` configures selector table columns; for nested relation fields, `fields` configures nested fields/columns. Direct add does not accept raw `wrapperProps` / `fieldProps` / `props` / `decoratorProps` / `stepParams` / `flowRegistry` or internal field model keys. Use `settings` and reuse the public configuration semantics from `configure.changes` plus the catalog item/node `configureOptions`. Popup-capable fields can also pass `popup` directly to append a local popup subtree or `popup.template` to reuse a saved popup template in `reference` / `copy` mode. `popup.tryTemplate=true` asks the backend to auto-select a compatible popup template first, preferring the same relation when one exists and otherwise falling back to a compatible non-relation template. It may be combined with `popup.saveAsTemplate={ name, description }`: a hit reuses the matched template directly, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved as a template reference. When `popup.template` is present, `popup.title` still applies, while local `popup.mode` / `popup.blocks` / `popup.layout` are accepted but ignored. If local openView is enabled but no popup content is provided, the server fills in the popup page/tab/grid shell automatically. Under approval forms, direct field creation preserves the `PatternFormFieldModel` inner node semantics and does not allow standalone `jsItem`.',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddFieldRequest'),
          examples: {
            directField: {
              summary: 'Create a JS renderer bound field under a create form',
              value: examples.addField,
            },
            associationField: {
              summary: 'Create an association-path field under a table block',
              value: examples.addAssociationField,
            },
            jsColumn: {
              summary: 'Create a standalone JS column under a table field container',
              value: examples.addJsColumn,
            },
            jsItem: {
              summary: 'Create a standalone JS item under a form field container',
              value: examples.addJsItem,
            },
            popupTemplate: {
              summary: 'Create a bound field that reuses a saved popup template',
              value: examples.addFieldPopupTemplate,
            },
            autoPopupTemplate: {
              summary: 'Create a bound field and let the backend auto-select a compatible popup template',
              value: examples.addFieldAutoPopupTemplate,
            },
            defaultEditPopup: {
              summary:
                'Create a relation field and let the backend auto-complete a default edit popup when no explicit popup content is provided',
              value: examples.addFieldDefaultEditPopup,
            },
            savePopupTemplate: {
              summary: 'Create a bound field and immediately save its explicit local popup as a popup template',
              value: examples.addFieldSavePopupTemplate,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddFieldResult'),
  },
  addAction: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a non-record action under an allowed block/form/filter-form/action-panel container',
    description: valuesCompatibilityNote(
      'Only non-record actions that are public in the catalog and visible in the current container may be created. Typical cases include table block actions, form submit, filter-form reset, and action-panel actions. Use `addRecordAction` for record actions. Direct add does not accept raw `props` / `decoratorProps` / `stepParams` / `flowRegistry`. Use `settings` and reuse `configure.changes` plus the catalog item/node `configureOptions`. Popup-capable actions may also include `popup` directly to append a popup subtree or `popup.template` to reuse a saved popup template in `reference` / `copy` mode. `popup.tryTemplate=true` asks the backend to auto-select a compatible popup template first, preferring the same relation when one exists and otherwise falling back to a compatible non-relation template. It may be combined with `popup.saveAsTemplate={ name, description }`: a hit reuses the matched template directly, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved as a template reference. When `popup.template` is present, `popup.title` still applies, while local `popup.mode` / `popup.blocks` / `popup.layout` are accepted but ignored. Approval action keys are singleton within one approval form or process form, and flowSurfaces reconciles the related workflow/node runtime config after successful writes.',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddActionRequest'),
          examples: {
            submit: {
              summary: 'Create a submit action under a filter-form action container',
              value: examples.addAction,
            },
            link: {
              summary: 'Create a link action under a table block action container',
              value: examples.addLinkAction,
            },
            js: {
              summary: 'Create a JS action under an action-panel container',
              value: examples.addJsAction,
            },
            jsItem: {
              summary: 'Create a form JS item action under a create/edit/form action container',
              value: examples.addJsItemAction,
            },
            autoPopupTemplate: {
              summary: 'Create a popup-capable action and let the backend auto-select a compatible popup template',
              value: examples.addAutoPopupAction,
            },
            savePopupTemplate: {
              summary:
                'Create a popup-capable action and immediately save its explicit local popup as a popup template',
              value: examples.addSavePopupAction,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddActionResult'),
  },
  addRecordAction: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a record action under a record-capable owner target',
    description: valuesCompatibilityNote(
      `Only record actions that are public in the catalog and visible in the current container may be created. The public target must be a record-capable owner target such as table/details/list/gridCard. Do not pass internal container uids such as a table actions column or a list/gridCard item. ${ADD_CHILD_TREE_TABLE_NOTE} Direct add does not accept raw \`props\` / \`decoratorProps\` / \`stepParams\` / \`flowRegistry\`. Use \`settings\` and reuse \`configure.changes\` plus the catalog item/node \`configureOptions\`. Popup-capable actions may also include \`popup\` directly to append a popup subtree or \`popup.template\` to reuse a saved popup template in \`reference\` / \`copy\` mode. \`popup.tryTemplate=true\` asks the backend to auto-select a compatible popup template first, preferring the same relation when one exists and otherwise falling back to a compatible non-relation template. It may be combined with \`popup.saveAsTemplate={ name, description }\`: a hit reuses the matched template directly, while a miss requires explicit local \`popup.blocks\` so the fallback popup can be saved as a template reference. When \`popup.template\` is present, \`popup.title\` still applies, while local \`popup.mode\` / \`popup.blocks\` / \`popup.layout\` are accepted but ignored.`,
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddRecordActionRequest'),
          examples: {
            view: {
              summary: 'Create a view action under a table record-action owner target',
              value: examples.addRecordAction,
            },
            addChild: {
              summary: 'Create an addChild record action on a tree table target',
              value: examples.addRecordAddChildAction,
            },
            js: {
              summary: 'Create a JS record action under a details block owner target',
              value: examples.addRecordJsAction,
            },
            autoPopupTemplate: {
              summary:
                'Create a view/edit-like record action and let the backend auto-select a compatible popup template',
              value: examples.addRecordAutoPopupTemplate,
            },
            savePopupTemplate: {
              summary:
                'Create a view/edit-like record action and immediately save its explicit local popup as a popup template',
              value: examples.addRecordSavePopupTemplate,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddRecordActionResult'),
  },
  addBlocks: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple blocks sequentially under the same target',
    description: valuesCompatibilityNote(
      'Creates multiple blocks sequentially under the same target. Each item may include `settings`, `defaultFilter`, `defaultActionSettings`, `template`, or inline `fields` / `fieldsLayout`, but raw `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Inline fields use the same public field semantics as compose/addField, including relation `fieldType`. Direct `table` / `list` / `gridCard` / `calendar` / `kanban` items may use block-level `defaultFilter` to backfill the auto-created default filter action; backend runtime compatibility remains tolerant of omitted or empty values. Legacy `defaultActionSettings.filter.defaultFilter` is still supported for compatibility and wins when both are provided. Partial-success semantics apply: a failure in one item does not roll back the others. Results are returned in input order as `index/key/ok/result/error`, and each `error` always includes `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddBlocksRequest', examples.addBlocks),
    responses: responses('FlowSurfaceAddBlocksResult'),
  },
  addFields: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple fields sequentially under the same target',
    description: valuesCompatibilityNote(
      'Creates multiple fields sequentially under the same target. The request may either import one shared `template` or create explicit `fields[]`. Each item may include `settings`, and popup-capable fields may also include `popup` directly for local popup content or `popup.template` to reuse a saved popup template in `reference` / `copy` mode. `popup.tryTemplate=true` asks the backend to auto-select a compatible popup template first, preferring the same relation when one exists and otherwise falling back to a compatible non-relation template. It may be combined with `popup.saveAsTemplate={ name, description }`: a hit reuses the matched template directly, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved as a template reference. When `popup.template` is present, `popup.title` still applies, while local `popup.mode` / `popup.blocks` / `popup.layout` are accepted but ignored. Raw `wrapperProps` / `fieldProps` / `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Partial-success semantics apply: a failure in one item does not roll back the others. Results are returned in input order as `index/key/ok/result/error`, and each `error` always includes `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddFieldsRequest', examples.addFields),
    responses: responses('FlowSurfaceAddFieldsResult'),
  },
  addActions: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple non-record actions sequentially under the same target',
    description: valuesCompatibilityNote(
      'Creates multiple non-record actions sequentially under the same target. Each item may include `settings`, and popup-capable actions may also include `popup` directly for local popup content or `popup.template` to reuse a saved popup template in `reference` / `copy` mode. `popup.tryTemplate=true` asks the backend to auto-select a compatible popup template first, preferring the same relation when one exists and otherwise falling back to a compatible non-relation template. It may be combined with `popup.saveAsTemplate={ name, description }`: a hit reuses the matched template directly, while a miss requires explicit local `popup.blocks` so the fallback popup can be saved as a template reference. When `popup.template` is present, `popup.title` still applies, while local `popup.mode` / `popup.blocks` / `popup.layout` are accepted but ignored. Raw `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Partial-success semantics apply. Record actions do not belong to this entry and should use `addRecordActions` instead. Each failed item always returns an `error` with `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddActionsRequest', examples.addActions),
    responses: responses('FlowSurfaceAddActionsResult'),
  },
  addRecordActions: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple record actions sequentially under the same record-capable owner target',
    description: valuesCompatibilityNote(
      `Creates multiple record actions sequentially under the same target. The target must be a record-capable owner target, and the server resolves the canonical record-action container automatically. Do not pass internal container uids such as a table actions column or a list/gridCard item. ${ADD_CHILD_TREE_TABLE_NOTE} Each item may include \`settings\`, and popup-capable actions may also include \`popup\` directly for local popup content or \`popup.template\` to reuse a saved popup template in \`reference\` / \`copy\` mode. \`popup.tryTemplate=true\` asks the backend to auto-select a compatible popup template first, preferring the same relation when one exists and otherwise falling back to a compatible non-relation template. It may be combined with \`popup.saveAsTemplate={ name, description }\`: a hit reuses the matched template directly, while a miss requires explicit local \`popup.blocks\` so the fallback popup can be saved as a template reference. When \`popup.template\` is present, \`popup.title\` still applies, while local \`popup.mode\` / \`popup.blocks\` / \`popup.layout\` are accepted but ignored. Raw \`props\` / \`decoratorProps\` / \`stepParams\` / \`flowRegistry\` are not accepted. Partial-success semantics apply: a failure in one item does not roll back the others. Each failed item always returns an \`error\` with \`message/type/code/status\`.`,
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddRecordActionsRequest'),
          examples: {
            basic: {
              summary: 'Create multiple standard record actions under a table owner target',
              value: examples.addRecordActions,
            },
            addChild: {
              summary: 'Create addChild under a tree table owner target',
              value: examples.addRecordAddChildActions,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddRecordActionsResult'),
  },
  updateSettings: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Update controlled props, decoratorProps, stepParams or flowRegistry',
    description: valuesCompatibilityNote(
      'Updates the specified domain according to the path-level contract exposed by the catalog. Arbitrary raw tree-field patches are not accepted.',
    ),
    requestBody: requestBody('FlowSurfaceUpdateSettingsRequest', examples.updateSettings),
    responses: responses('FlowSurfaceUpdateSettingsResult'),
  },
  setEventFlows: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace instance-level event flow definitions on a node',
    description: valuesCompatibilityNote(
      'Fully replaces the instance-level event flows on the current node. The server validates whether eventName, flowKey, stepKey, and the node context are all valid.',
    ),
    requestBody: requestBody('FlowSurfaceSetEventFlowsRequest', examples.setEventFlows),
    responses: responses('FlowSurfaceSetEventFlowsResult'),
  },
  setLayout: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Write rows, sizes and rowOrder for a grid',
    description: valuesCompatibilityNote(
      'Fully writes the grid layout. The server strictly validates that every child is covered completely and exactly once.',
    ),
    requestBody: requestBody('FlowSurfaceSetLayoutRequest', examples.setLayout),
    responses: responses('FlowSurfaceSetLayoutResult'),
  },
  moveNode: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Move a node before or after a sibling under the same parent',
    description: valuesCompatibilityNote('Only sibling-node reordering under the same parent/subKey is supported.'),
    requestBody: requestBody('FlowSurfaceMoveNodeRequest', examples.moveNode),
    responses: responses('FlowSurfaceMoveNodeResult'),
  },
  removeNode: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Remove a block, field wrapper, action or nested popup node',
    description: valuesCompatibilityNote(
      'Removes the specified normal node and its subtree. Only `target.uid` is accepted. If you only have `pageSchemaUid / tabSchemaUid / routeId`, call `flowSurfaces:get` first. `removeNode` is not used for page/tab deletion. Use `destroyPage` for pages and `removeTab` for tabs.',
    ),
    requestBody: requestBody('FlowSurfaceRemoveNodeRequest', examples.removeNode),
    responses: responses('FlowSurfaceRemoveNodeResult'),
  },
  mutate: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Execute multiple operations atomically',
    description: valuesCompatibilityNote(
      'Executes `ops[]` in order and supports `opId` plus `{ step: "<opId>", path: "<field>" }` references to earlier results. `{ key: "<opId>" }` reads the whole previous result object. V1 only supports `atomic=true`.',
    ),
    requestBody: requestBody('FlowSurfaceMutateRequest', examples.mutate),
    responses: responses('FlowSurfaceMutationResponse'),
  },
  apply: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace the target subtree from a complete spec',
    description: valuesCompatibilityNote(
      'Accepts a complete subtree spec and compiles it into an operation sequence isomorphic to `mutate`. V1 only supports `mode="replace"`.',
    ),
    requestBody: requestBody('FlowSurfaceApplyRequest', examples.apply),
    responses: responses('FlowSurfaceMutationResponse'),
  },
};

const parameters = {
  flowSurfaceTargetUid: {
    name: 'uid',
    in: 'query',
    description: 'Target node uid',
    required: false,
    schema: {
      type: 'string',
    },
    example: examples.getPopupQuery.uid,
  },
  flowSurfaceTargetPageSchemaUid: {
    name: 'pageSchemaUid',
    in: 'query',
    description: 'Top-level page schema uid',
    required: false,
    schema: {
      type: 'string',
    },
    example: 'employees-page-schema',
  },
  flowSurfaceTargetTabSchemaUid: {
    name: 'tabSchemaUid',
    in: 'query',
    description: 'Tab schema uid',
    required: false,
    schema: {
      type: 'string',
    },
    example: 'details-tab-schema',
  },
  flowSurfaceTargetRouteId: {
    name: 'routeId',
    in: 'query',
    description: 'Desktop route id',
    required: false,
    schema: {
      type: 'string',
    },
    example: '101',
  },
};

const schemas = {
  FlowSurfaceMutateKey: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        description: 'Reference to a previously created runtime key, for example a prior mutate `opId`.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceResolvableString: {
    oneOf: [{ type: 'string' }, ref('FlowSurfaceMutateKey'), ref('FlowSurfacePlanSelectorByStep')],
  },
  FlowSurfaceResolvableIdentifier: {
    oneOf: [{ type: 'string' }, { type: 'integer' }, ref('FlowSurfaceMutateKey'), ref('FlowSurfacePlanSelectorByStep')],
  },
  FlowSurfaceWriteTarget: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReadLocator: {
    type: 'object',
    minProperties: 1,
    properties: {
      uid: {
        type: 'string',
      },
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      routeId: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateWriteTarget: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: ref('FlowSurfaceResolvableString'),
    },
    additionalProperties: false,
  },
  FlowSurfaceResolvedTarget: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      kind: {
        type: 'string',
        enum: ['page', 'tab', 'grid', 'block', 'node'],
      },
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      routeId: {
        type: 'string',
      },
      route: ref('FlowSurfaceRouteMeta'),
      pageRoute: ref('FlowSurfaceRouteMeta'),
      tabRoute: ref('FlowSurfaceRouteMeta'),
    },
    additionalProperties: true,
  },
  FlowSurfaceReadTarget: {
    type: 'object',
    properties: {
      locator: ref('FlowSurfaceReadLocator'),
      uid: {
        type: 'string',
      },
      kind: {
        type: 'string',
        enum: ['page', 'tab', 'grid', 'block', 'node'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfacePlanSelectorByStep: {
    type: 'object',
    required: ['step'],
    properties: {
      step: {
        type: 'string',
      },
      path: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceBindKey: {
    type: 'object',
    required: ['key', 'locator'],
    properties: {
      key: {
        type: 'string',
      },
      locator: ref('FlowSurfaceReadLocator'),
      expectedKind: {
        type: 'string',
        enum: ['page', 'tab', 'grid', 'block', 'fieldHost', 'action', 'popupHost', 'popupPage', 'popupTab', 'node'],
      },
      rebind: {
        type: 'boolean',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceKeyInfo: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      kind: {
        type: 'string',
      },
      source: {
        type: 'string',
        enum: ['declared', 'request', 'system'],
      },
      locator: ref('FlowSurfaceReadLocator'),
    },
    additionalProperties: false,
  },
  FlowSurfaceKeysMap: {
    type: 'object',
    additionalProperties: ref('FlowSurfaceKeyInfo'),
  },
  FlowSurfaceResolvedSelectorSummary: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      kind: {
        type: 'string',
      },
      key: {
        type: 'string',
      },
      source: {
        type: 'string',
        enum: ['declared', 'request', 'system', 'step'],
      },
      step: {
        type: 'string',
      },
      path: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceConfigureOption: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['string', 'number', 'boolean', 'object', 'array'],
      },
      description: {
        type: 'string',
      },
      enum: {
        type: 'array',
        items: {
          oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
        },
      },
      example: {},
      supportsFlowContext: {
        type: 'boolean',
      },
    },
    required: ['type'],
    additionalProperties: false,
  },
  FlowSurfaceConfigureOptions: {
    type: 'object',
    additionalProperties: ref('FlowSurfaceConfigureOption'),
  },
  FlowSurfaceNodeDomain: {
    type: 'string',
    enum: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  },
  FlowSurfaceMergeStrategy: {
    type: 'string',
    enum: ['deep', 'replace'],
  },
  FlowSurfaceFilterCondition: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
      },
      operator: {
        type: 'string',
      },
      value: {},
    },
    required: ['path', 'operator'],
    additionalProperties: true,
  },
  FlowSurfaceFilterGroup: {
    type: 'object',
    properties: {
      logic: {
        type: 'string',
        enum: ['$and', '$or'],
      },
      items: {
        type: 'array',
        items: {
          oneOf: [ref('FlowSurfaceFilterCondition'), ref('FlowSurfaceFilterGroup')],
        },
      },
    },
    required: ['logic', 'items'],
    additionalProperties: false,
    example: FILTER_GROUP_EXAMPLE,
  },
  FlowSurfaceDefaultFilterActionSettings: {
    type: 'object',
    properties: {
      filterableFieldNames: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      defaultFilter: ref('FlowSurfaceFilterGroup'),
    },
    additionalProperties: true,
  },
  FlowSurfaceDefaultActionSettings: {
    type: 'object',
    description: DIRECT_ADD_DEFAULT_FILTER_COMPAT_DESCRIPTION,
    properties: {
      filter: ref('FlowSurfaceDefaultFilterActionSettings'),
    },
    additionalProperties: false,
  },
  FlowSurfaceEventCapabilities: {
    type: 'object',
    properties: {
      direct: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      object: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceLayoutCapabilities: {
    type: 'object',
    properties: {
      supported: {
        type: 'boolean',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDomainGroupContract: {
    type: 'object',
    properties: {
      allowedPaths: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      clearable: {
        type: 'boolean',
      },
      mergeStrategy: ref('FlowSurfaceMergeStrategy'),
      schema: ANY_OBJECT_SCHEMA,
      eventBindingSteps: {
        oneOf: [
          {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          {
            type: 'string',
            enum: ['*'],
          },
        ],
      },
      pathSchemas: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceDomainContract: {
    type: 'object',
    properties: {
      allowedKeys: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      wildcard: {
        type: 'boolean',
      },
      mergeStrategy: ref('FlowSurfaceMergeStrategy'),
      schema: ANY_OBJECT_SCHEMA,
      groups: {
        type: 'object',
        additionalProperties: ref('FlowSurfaceDomainGroupContract'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceNodeContract: {
    type: 'object',
    properties: {
      editableDomains: {
        type: 'array',
        items: ref('FlowSurfaceNodeDomain'),
      },
      domains: {
        type: 'object',
        properties: {
          props: ref('FlowSurfaceDomainContract'),
          decoratorProps: ref('FlowSurfaceDomainContract'),
          stepParams: ref('FlowSurfaceDomainContract'),
          flowRegistry: ref('FlowSurfaceDomainContract'),
        },
        additionalProperties: false,
      },
      eventCapabilities: ref('FlowSurfaceEventCapabilities'),
      layoutCapabilities: ref('FlowSurfaceLayoutCapabilities'),
      eventBindings: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogItem: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      label: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      kind: {
        type: 'string',
        enum: ['page', 'tab', 'block', 'field', 'action'],
      },
      scope: {
        type: 'string',
        enum: ['block', 'record', 'form', 'filterForm', 'actionPanel'],
      },
      scene: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
      },
      wrapperUse: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
        nullable: true,
      },
      defaultTargetUid: {
        type: 'string',
      },
      targetBlockUid: {
        type: 'string',
      },
      requiredInitParams: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      allowedContainerUses: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      editableDomains: {
        type: 'array',
        items: ref('FlowSurfaceNodeDomain'),
      },
      configureOptions: ref('FlowSurfaceConfigureOptions'),
      resourceBindings: {
        type: 'array',
        items: ref('FlowSurfaceResourceBindingOption'),
      },
      settingsSchema: ANY_OBJECT_SCHEMA,
      settingsContract: {
        type: 'object',
        properties: {
          props: ref('FlowSurfaceDomainContract'),
          decoratorProps: ref('FlowSurfaceDomainContract'),
          stepParams: ref('FlowSurfaceDomainContract'),
          flowRegistry: ref('FlowSurfaceDomainContract'),
        },
        additionalProperties: false,
      },
      eventCapabilities: ref('FlowSurfaceEventCapabilities'),
      layoutCapabilities: ref('FlowSurfaceLayoutCapabilities'),
      createSupported: {
        type: 'boolean',
      },
    },
    additionalProperties: true,
  },
  FlowSurfaceCatalogSection: {
    type: 'string',
    enum: ['blocks', 'fields', 'actions', 'recordActions', 'node'],
  },
  FlowSurfaceCatalogExpand: {
    type: 'string',
    enum: ['item.configureOptions', 'item.contracts', 'item.allowedContainerUses', 'node.contracts'],
  },
  FlowSurfaceCatalogPopupScenario: {
    type: 'object',
    required: ['kind', 'scene', 'hasCurrentRecord', 'hasAssociationContext'],
    properties: {
      kind: {
        type: 'string',
        enum: ['plainPopup', 'recordPopup', 'associationPopup'],
      },
      scene: {
        type: 'string',
        enum: ['new', 'one', 'many', 'select', 'subForm', 'bulkEditForm', 'generic'],
      },
      hasCurrentRecord: {
        type: 'boolean',
      },
      hasAssociationContext: {
        type: 'boolean',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogFieldContainerScenario: {
    type: 'object',
    required: ['kind'],
    properties: {
      kind: {
        type: 'string',
        enum: ['form', 'details', 'table', 'filter-form'],
      },
      targetMode: {
        type: 'string',
        enum: ['single', 'multiple'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogActionContainerScenario: {
    type: 'object',
    required: ['scope'],
    properties: {
      scope: {
        type: 'string',
        enum: ['block', 'record', 'form', 'filterForm', 'actionPanel'],
      },
      ownerUse: {
        type: 'string',
      },
      recordActionContainerUse: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogScenario: {
    type: 'object',
    required: ['surfaceKind'],
    properties: {
      surfaceKind: {
        type: 'string',
        enum: ['global', 'page', 'tab', 'grid', 'block', 'node'],
      },
      popup: ref('FlowSurfaceCatalogPopupScenario'),
      fieldContainer: ref('FlowSurfaceCatalogFieldContainerScenario'),
      actionContainer: ref('FlowSurfaceCatalogActionContainerScenario'),
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogNodeInfo: {
    type: 'object',
    required: ['editableDomains', 'configureOptions'],
    properties: {
      editableDomains: {
        type: 'array',
        items: ref('FlowSurfaceNodeDomain'),
      },
      configureOptions: ref('FlowSurfaceConfigureOptions'),
      settingsSchema: ANY_OBJECT_SCHEMA,
      settingsContract: {
        type: 'object',
        properties: {
          props: ref('FlowSurfaceDomainContract'),
          decoratorProps: ref('FlowSurfaceDomainContract'),
          stepParams: ref('FlowSurfaceDomainContract'),
          flowRegistry: ref('FlowSurfaceDomainContract'),
        },
        additionalProperties: false,
      },
      eventCapabilities: ref('FlowSurfaceEventCapabilities'),
      layoutCapabilities: ref('FlowSurfaceLayoutCapabilities'),
    },
    additionalProperties: false,
  },
  FlowSurfaceGetTreeNode: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      subType: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
      },
      schemaUid: {
        type: 'string',
      },
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
      template: ref('FlowSurfaceBlockTemplateRef'),
      fieldsTemplate: ref('FlowSurfaceTemplateRef'),
      popup: ref('FlowSurfacePopupSummary'),
      subModels: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            ref('FlowSurfaceGetTreeNode'),
            {
              type: 'array',
              items: ref('FlowSurfaceGetTreeNode'),
            },
          ],
        },
      },
    },
    additionalProperties: true,
  },
  FlowSurfaceNodeMap: {
    type: 'object',
    additionalProperties: ref('FlowSurfaceGetTreeNode'),
  },
  FlowSurfaceRouteMeta: {
    type: 'object',
    properties: {
      id: STRING_OR_INTEGER_SCHEMA,
      type: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
        nullable: true,
      },
      schemaUid: {
        type: 'string',
      },
      tabSchemaName: {
        type: 'string',
      },
      enableTabs: {
        type: 'boolean',
      },
      hidden: {
        type: 'boolean',
      },
      displayTitle: {
        type: 'boolean',
      },
      sort: {
        type: 'number',
      },
      options: ANY_OBJECT_SCHEMA,
      children: {
        type: 'array',
        items: ref('FlowSurfaceRouteMeta'),
      },
    },
    additionalProperties: true,
  },
  FlowSurfaceNodeSpec: {
    type: 'object',
    required: ['use'],
    properties: {
      uid: {
        type: 'string',
      },
      clientKey: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      popup: ref('FlowSurfaceApplyNodePopup'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
      subModels: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            ref('FlowSurfaceNodeSpec'),
            {
              type: 'array',
              items: ref('FlowSurfaceNodeSpec'),
            },
          ],
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyNodePopup: {
    type: 'object',
    properties: {
      template: ref('FlowSurfacePopupTemplateRef'),
      tryTemplate: {
        type: 'boolean',
        description:
          'Apply-only popup shortcut for popup-capable field/action child nodes. When true and no explicit template is provided, the backend tries the same auto-selection rule as add/compose popup inputs.',
      },
      defaultType: {
        type: 'string',
        enum: ['view', 'edit'],
        description:
          'When popup content is omitted, asks the backend to prefer a compatible popup template first and otherwise auto-generate a default relation popup of the requested type.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplySpec: {
    type: 'object',
    properties: {
      popup: ref('FlowSurfaceApplyNodePopup'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
      subModels: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            ref('FlowSurfaceNodeSpec'),
            {
              type: 'array',
              items: ref('FlowSurfaceNodeSpec'),
            },
          ],
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceClientKeyMap: {
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  },
  FlowSurfaceResourceInit: {
    type: 'object',
    properties: {
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      associationName: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
      },
      sourceId: STRING_OR_INTEGER_SCHEMA,
      filterByTk: STRING_OR_INTEGER_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceResourceBindingAssociationField: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      label: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      associationName: {
        type: 'string',
      },
    },
    required: ['key', 'label', 'collectionName'],
    additionalProperties: false,
  },
  FlowSurfaceResourceBindingOption: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        enum: ['currentCollection', 'currentRecord', 'associatedRecords', 'otherRecords'],
      },
      label: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      requires: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      associationFields: {
        type: 'array',
        items: ref('FlowSurfaceResourceBindingAssociationField'),
      },
    },
    required: ['key', 'label'],
    additionalProperties: false,
  },
  FlowSurfaceSemanticResourceInput: {
    type: 'object',
    required: ['binding'],
    properties: {
      binding: {
        type: 'string',
        enum: ['currentCollection', 'currentRecord', 'associatedRecords', 'otherRecords'],
      },
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      associationField: {
        type: 'string',
        description:
          'Canonical association field name for popup `associatedRecords` binding. In applyBlueprint authoring, prefer `associationField`; `associationPathName` is only normalized to this field for convenience when it is a single association field name.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceBlockResourceInput: {
    oneOf: [ref('FlowSurfaceSemanticResourceInput'), ref('FlowSurfaceResourceInit')],
  },
  FlowSurfaceMutateResourceInit: {
    type: 'object',
    properties: {
      dataSourceKey: ref('FlowSurfaceResolvableString'),
      collectionName: ref('FlowSurfaceResolvableString'),
      associationName: ref('FlowSurfaceResolvableString'),
      associationPathName: ref('FlowSurfaceResolvableString'),
      sourceId: ref('FlowSurfaceResolvableIdentifier'),
      filterByTk: ref('FlowSurfaceResolvableIdentifier'),
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogRequest: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      sections: {
        type: 'array',
        items: ref('FlowSurfaceCatalogSection'),
      },
      expand: {
        type: 'array',
        items: ref('FlowSurfaceCatalogExpand'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogResponse: {
    type: 'object',
    properties: {
      target: {
        allOf: [ref('FlowSurfaceResolvedTarget')],
        nullable: true,
      },
      scenario: ref('FlowSurfaceCatalogScenario'),
      selectedSections: {
        type: 'array',
        description:
          'Final sections returned by the server. When `sections` is omitted from the request, the server smart-selects sections for the current target scenario and clients should treat this field as authoritative.',
        items: ref('FlowSurfaceCatalogSection'),
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceCatalogItem'),
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceCatalogItem'),
      },
      actions: {
        type: 'array',
        description: 'Public block/form/filter-form/action-panel actions available under the resolved target.',
        items: ref('FlowSurfaceCatalogItem'),
      },
      recordActions: {
        type: 'array',
        description:
          'Public record/item-level actions exposed for record-capable targets such as table/details/list/gridCard.',
        items: ref('FlowSurfaceCatalogItem'),
      },
      node: ref('FlowSurfaceCatalogNodeInfo'),
    },
    additionalProperties: false,
  },
  FlowSurfaceContextVarInfo: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
      type: {
        type: 'string',
      },
      interface: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      disabled: {
        type: 'boolean',
      },
      disabledReason: {
        type: 'string',
      },
      properties: {
        type: 'object',
        additionalProperties: ref('FlowSurfaceContextVarInfo'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceContextRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      path: {
        type: 'string',
        description: "Bare path only, for example 'record', 'popup.record' or 'item.parentItem.value'.",
      },
      maxDepth: {
        type: 'integer',
        minimum: 1,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceContextResponse: {
    type: 'object',
    properties: {
      vars: {
        type: 'object',
        additionalProperties: ref('FlowSurfaceContextVarInfo'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDescribeSurfaceRequest: {
    type: 'object',
    required: ['locator'],
    properties: {
      locator: ref('FlowSurfaceReadLocator'),
      bindKeys: {
        type: 'array',
        items: ref('FlowSurfaceBindKey'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceGetResponse: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceReadTarget'),
      tree: ref('FlowSurfaceGetTreeNode'),
      nodeMap: ref('FlowSurfaceNodeMap'),
      pageRoute: ref('FlowSurfaceRouteMeta'),
      route: ref('FlowSurfaceRouteMeta'),
    },
    additionalProperties: false,
  },
  FlowSurfaceDescribeSurfaceResponse: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceReadTarget'),
      tree: ref('FlowSurfaceGetTreeNode'),
      nodeMap: ref('FlowSurfaceNodeMap'),
      pageRoute: ref('FlowSurfaceRouteMeta'),
      route: ref('FlowSurfaceRouteMeta'),
      fingerprint: {
        type: 'string',
      },
      keys: ref('FlowSurfaceKeysMap'),
    },
    additionalProperties: false,
  },
  FlowSurfacePopupSummary: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['local', 'copy'],
      },
      pageUid: {
        type: 'string',
      },
      tabUid: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
      template: ref('FlowSurfacePopupTemplateRef'),
    },
    additionalProperties: false,
  },
  ...templateSchemas,
  FlowSurfaceComposeLayoutCell: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        anyOf: [{ required: ['key'] }, { required: ['uid'] }],
        properties: {
          key: {
            type: 'string',
          },
          uid: {
            type: 'string',
          },
          span: {
            type: 'number',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceComposeLayout: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'array',
          items: ref('FlowSurfaceComposeLayoutCell'),
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeFieldSpec: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        required: ['fieldPath'],
        properties: {
          key: {
            type: 'string',
            description: 'Optional stable field key returned in compose results.',
          },
          fieldPath: {
            type: 'string',
          },
          fieldType: RELATION_FIELD_TYPE_SCHEMA,
          fields: RELATION_TARGET_FIELDS_SCHEMA,
          titleField: { type: 'string' },
          openMode: { type: 'string', example: 'drawer' },
          popupSize: { type: 'string', example: 'medium' },
          pageSize: { type: 'number', example: 10 },
          showIndex: { type: 'boolean', example: true },
          renderer: {
            type: 'string',
            enum: ['js'],
            description: 'Optional public renderer variant for a bound field.',
          },
          associationPathName: {
            type: 'string',
          },
          target: {
            type: 'string',
            description: 'Reference to another compose block key, typically used by filter-form fields.',
          },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceComposeRequestFieldPopup'),
        },
        additionalProperties: false,
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: {
            type: 'string',
            description: 'Optional stable field key returned in compose results.',
          },
          type: {
            type: 'string',
            enum: ['jsColumn', 'jsItem'],
            description: 'Standalone synthetic public field capability. Does not accept fieldPath.',
          },
          settings: ANY_OBJECT_SCHEMA,
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceTemplateRef: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
        description: 'Saved template uid.',
      },
      mode: {
        type: 'string',
        enum: ['reference', 'copy'],
        default: 'reference',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceBlockTemplateRef: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
      },
      mode: {
        type: 'string',
        enum: ['reference', 'copy'],
        default: 'reference',
      },
      usage: {
        type: 'string',
        enum: ['block', 'fields'],
        description: 'For form templates, choose whether to create the whole block or only import its fields.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfacePopupTemplateRef: {
    allOf: [ref('FlowSurfaceTemplateRef')],
  },
  FlowSurfacePopupSaveAsTemplate: {
    type: 'object',
    required: ['name', 'description'],
    properties: {
      name: {
        type: 'string',
        description: 'Template name saved immediately from explicit local popup content.',
      },
      description: {
        type: 'string',
        description: 'Template description saved immediately from explicit local popup content.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRequestPopupTemplateRef: {
    type: 'object',
    oneOf: [{ required: ['uid'] }, { required: ['local'] }],
    properties: {
      uid: {
        type: 'string',
        description: 'Saved template uid.',
      },
      local: {
        type: 'string',
        description:
          'Request-scoped popup template alias produced earlier by `popup.saveAsTemplate.local` in the same compose/applyBlueprint call. The alias itself is not persisted.',
      },
      mode: {
        type: 'string',
        enum: ['reference', 'copy'],
        default: 'reference',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRequestPopupSaveAsTemplate: {
    type: 'object',
    required: ['name', 'description'],
    properties: {
      name: {
        type: 'string',
        description: 'Template name saved immediately from explicit local popup content.',
      },
      description: {
        type: 'string',
        description: 'Template description saved immediately from explicit local popup content.',
      },
      local: {
        type: 'string',
        description:
          'Optional request-scoped alias that later `popup.template.local` references can consume within the same compose/applyBlueprint call. The alias itself is not persisted.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeRequestActionPopup: buildFlowSurfaceRequestPopupSchema(),
  FlowSurfaceComposeRequestFieldPopup: buildFlowSurfaceRequestPopupSchema(),
  FlowSurfaceComposeActionPopup: {
    type: 'object',
    anyOf: [
      {
        required: ['template'],
      },
      {
        required: ['tryTemplate'],
      },
      {
        anyOf: [{ required: ['title'] }, { required: ['mode'] }, { required: ['blocks'] }, { required: ['layout'] }],
      },
    ],
    properties: {
      title: {
        type: 'string',
      },
      template: ref('FlowSurfacePopupTemplateRef'),
      tryTemplate: {
        type: 'boolean',
        description: REQUEST_POPUP_TRY_TEMPLATE_DESCRIPTION,
      },
      saveAsTemplate: {
        allOf: [ref('FlowSurfacePopupSaveAsTemplate')],
        description: REQUEST_POPUP_SAVE_AS_TEMPLATE_DESCRIPTION,
      },
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockSpec'),
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeFieldPopup: {
    type: 'object',
    anyOf: [
      {
        required: ['template'],
      },
      {
        required: ['tryTemplate'],
      },
      {
        required: ['defaultType'],
      },
      {
        anyOf: [{ required: ['title'] }, { required: ['mode'] }, { required: ['blocks'] }, { required: ['layout'] }],
      },
    ],
    properties: {
      title: {
        type: 'string',
      },
      template: ref('FlowSurfacePopupTemplateRef'),
      tryTemplate: {
        type: 'boolean',
        description: REQUEST_POPUP_TRY_TEMPLATE_DESCRIPTION,
      },
      defaultType: {
        type: 'string',
        enum: ['view', 'edit'],
        description:
          'When popup content is omitted, the backend prefers a compatible popup template first and otherwise auto-generates a default relation popup of the requested type.',
      },
      saveAsTemplate: {
        allOf: [ref('FlowSurfacePopupSaveAsTemplate')],
        description: REQUEST_POPUP_SAVE_AS_TEMPLATE_DESCRIPTION,
      },
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockSpec'),
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeActionSpec: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: NON_RECORD_ACTION_TYPE_ENUM,
          },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceComposeRequestActionPopup'),
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceApprovalBlueprintActionSpec: {
    oneOf: [
      {
        type: 'string',
        enum: APPROVAL_BLUEPRINT_ACTION_TYPE_ENUM,
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: APPROVAL_BLUEPRINT_ACTION_TYPE_ENUM,
          },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceComposeActionPopup'),
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceComposeRecordActionSpec: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: RECORD_ACTION_TYPE_ENUM,
          },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceComposeRequestActionPopup'),
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceComposeBlockSpec: {
    type: 'object',
    required: ['key'],
    anyOf: [{ required: ['type'] }, { required: ['template'] }],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: COMPOSE_BLOCK_TYPE_ENUM,
      },
      template: ref('FlowSurfaceBlockTemplateRef'),
      resource: ref('FlowSurfaceBlockResourceInput'),
      settings: ANY_OBJECT_SCHEMA,
      defaultFilter: {
        allOf: [ref('FlowSurfaceFilterGroup')],
        description: PUBLIC_DATA_SURFACE_BLOCK_DEFAULT_FILTER_DESCRIPTION,
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldSpec'),
      },
      fieldsLayout: {
        allOf: [ref('FlowSurfaceComposeLayout')],
        description:
          'Optional inner field-grid layout for `createForm`, `editForm`, `details`, or `filterForm`. Uses the same public `{ rows: [[...]] }` shape as top-level layout, but references field keys inside the current block and must place every created field exactly once.',
      },
      actions: {
        type: 'array',
        description:
          'Block-level actions. For table/list/gridCard/calendar/kanban, prefer block-wide collection actions here.',
        items: ref('FlowSurfaceComposeActionSpec'),
      },
      recordActions: {
        type: 'array',
        description:
          'Public semantic group for record/item-level actions on record-capable blocks such as table/details/list/gridCard.',
        items: ref('FlowSurfaceComposeRecordActionSpec'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApprovalBlueprintBlockSpec: {
    type: 'object',
    required: ['key'],
    anyOf: [{ required: ['type'] }, { required: ['template'] }],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: APPROVAL_BLUEPRINT_BLOCK_TYPE_ENUM,
      },
      template: ref('FlowSurfaceBlockTemplateRef'),
      resource: ref('FlowSurfaceBlockResourceInput'),
      settings: ANY_OBJECT_SCHEMA,
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldSpec'),
      },
      actions: {
        type: 'array',
        items: ref('FlowSurfaceApprovalBlueprintActionSpec'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
        default: 'append',
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockSpec'),
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeFieldResult: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      fieldPath: {
        type: 'string',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
      },
      uid: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
        nullable: true,
      },
      target: {
        type: 'string',
      },
      wrapperUid: {
        type: 'string',
      },
      fieldUid: {
        type: 'string',
      },
      innerFieldUid: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeActionResult: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ACTION_TYPE_ENUM,
      },
      scope: {
        type: 'string',
      },
      uid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      assignFormUid: {
        type: 'string',
      },
      assignFormGridUid: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeBlockResult: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: COMPOSE_BLOCK_TYPE_ENUM,
      },
      uid: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
      itemUid: {
        type: 'string',
      },
      itemGridUid: {
        type: 'string',
      },
      actionsColumnUid: {
        type: 'string',
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldResult'),
      },
      actions: {
        type: 'array',
        items: ref('FlowSurfaceComposeActionResult'),
      },
      recordActions: {
        type: 'array',
        description:
          'Returned record/item-level action results for record-capable public compose semantics such as table/details/list/gridCard.',
        items: ref('FlowSurfaceComposeActionResult'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeResult: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockResult'),
      },
      layout: ref('FlowSurfaceSetLayoutResult'),
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionKind: {
    type: 'string',
    enum: ['fieldValue', 'blockLinkage', 'fieldLinkage', 'actionLinkage'],
  },
  FlowSurfaceReactionScene: {
    type: 'string',
    enum: ['form', 'block', 'action', 'details', 'subForm'],
  },
  FlowSurfaceReactionSlot: {
    type: 'object',
    required: ['flowKey', 'stepKey'],
    properties: {
      flowKey: {
        type: 'string',
        description: 'Resolved flow-settings namespace that owns this reaction slot.',
      },
      stepKey: {
        type: 'string',
        description: 'Resolved step key inside the flow-settings namespace.',
      },
      valuePath: {
        type: 'string',
        nullable: true,
        description: 'Optional nested value path when the actual rules array is stored below the step root.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionTargetSummary: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
        description: 'Resolved live target uid.',
      },
      publicPath: {
        type: 'string',
        description: 'Resolved public path or bind-key style path when available.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionFilter: {
    type: 'object',
    description:
      'Recursive public reaction filter object. Paths must use bare ctx-style paths such as `formValues.status` or `record.id`.',
    additionalProperties: true,
    example: FILTER_GROUP_EXAMPLE,
  },
  FlowSurfaceReactionLiteralValueExpr: {
    type: 'object',
    required: ['source', 'value'],
    properties: {
      source: {
        type: 'string',
        enum: ['literal'],
      },
      value: {},
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionPathValueExpr: {
    type: 'object',
    required: ['source', 'path'],
    properties: {
      source: {
        type: 'string',
        enum: ['path'],
      },
      path: {
        type: 'string',
        description: 'Bare reaction context path such as `formValues.status` or `record.id`.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionRunJsValueExpr: {
    type: 'object',
    required: ['source', 'code'],
    properties: {
      source: {
        type: 'string',
        enum: ['runjs'],
      },
      code: {
        type: 'string',
      },
      version: {
        type: 'string',
        enum: ['v1', 'v2'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionValueExpr: {
    oneOf: [
      ref('FlowSurfaceReactionLiteralValueExpr'),
      ref('FlowSurfaceReactionPathValueExpr'),
      ref('FlowSurfaceReactionRunJsValueExpr'),
    ],
  },
  FlowSurfaceReactionValueExprMeta: {
    type: 'object',
    required: ['supportedSources', 'runjsScene'],
    properties: {
      supportedSources: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['literal', 'path', 'runjs'],
        },
      },
      runjsScene: {
        type: 'string',
        enum: ['fieldValue', 'linkage'],
        description: 'RunJS evaluation scene used by this capability when `source: "runjs"` is allowed.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionConditionMeta: {
    type: 'object',
    required: ['operatorsByPath'],
    properties: {
      operatorsByPath: {
        type: 'object',
        description:
          'Allowed operators keyed by bare reaction context path. Use this to drive condition builders instead of guessing path/operator pairs.',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionSupportedAction: {
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        description: 'Public reaction action type available in the resolved scene.',
      },
      states: {
        type: 'array',
        description: 'Supported state names when the action type is state-based.',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionUnavailableCapability: {
    type: 'object',
    required: ['kind', 'code', 'reason'],
    properties: {
      kind: ref('FlowSurfaceReactionKind'),
      code: {
        type: 'string',
      },
      reason: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldOption: {
    type: 'object',
    required: ['path', 'label'],
    properties: {
      path: {
        type: 'string',
        description: 'Targetable field path in the resolved scene.',
      },
      label: {
        type: 'string',
      },
      interface: {
        type: 'string',
      },
      type: {
        type: 'string',
      },
      supportsDefault: {
        type: 'boolean',
        description: 'Whether this field can be targeted by default-value semantics.',
      },
      supportsAssign: {
        type: 'boolean',
        description: 'Whether this field can be targeted by assignment semantics.',
      },
      supportsState: {
        type: 'array',
        description: 'Field-state transitions supported for this field in the resolved scene.',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldValueRule: {
    type: 'object',
    required: ['targetPath', 'value'],
    properties: {
      key: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      targetPath: {
        type: 'string',
        description: 'Field path that receives the computed/default value.',
      },
      mode: {
        type: 'string',
        enum: ['default', 'assign'],
        description:
          '`default` writes default-value semantics, while `assign` writes reactive assignment semantics for the target field.',
      },
      when: ref('FlowSurfaceReactionFilter'),
      value: ref('FlowSurfaceReactionValueExpr'),
    },
    additionalProperties: false,
  },
  FlowSurfaceReactionRunJsAction: {
    type: 'object',
    required: ['type', 'code'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['runjs'],
      },
      code: {
        type: 'string',
      },
      version: {
        type: 'string',
        enum: ['v1', 'v2'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceBlockLinkageActionSetBlockState: {
    type: 'object',
    required: ['type', 'state'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['setBlockState'],
      },
      state: {
        type: 'string',
        enum: ['visible', 'hidden'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceBlockLinkageAction: {
    oneOf: [ref('FlowSurfaceBlockLinkageActionSetBlockState'), ref('FlowSurfaceReactionRunJsAction')],
  },
  FlowSurfaceBlockLinkageRule: {
    type: 'object',
    required: ['then'],
    properties: {
      key: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      when: ref('FlowSurfaceReactionFilter'),
      then: {
        type: 'array',
        items: ref('FlowSurfaceBlockLinkageAction'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceActionLinkageActionSetActionState: {
    type: 'object',
    required: ['type', 'state'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['setActionState'],
      },
      state: {
        type: 'string',
        enum: ['visible', 'hidden', 'hiddenText', 'enabled', 'disabled'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceActionLinkageAction: {
    oneOf: [ref('FlowSurfaceActionLinkageActionSetActionState'), ref('FlowSurfaceReactionRunJsAction')],
  },
  FlowSurfaceActionLinkageRule: {
    type: 'object',
    required: ['then'],
    properties: {
      key: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      when: ref('FlowSurfaceReactionFilter'),
      then: {
        type: 'array',
        items: ref('FlowSurfaceActionLinkageAction'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldLinkageAssignItem: {
    type: 'object',
    required: ['targetPath', 'value'],
    properties: {
      key: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      targetPath: {
        type: 'string',
      },
      when: ref('FlowSurfaceReactionFilter'),
      value: ref('FlowSurfaceReactionValueExpr'),
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldLinkageActionSetFieldState: {
    type: 'object',
    required: ['type', 'fieldPaths', 'state'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['setFieldState'],
      },
      fieldPaths: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      state: {
        type: 'string',
        enum: ['visible', 'hidden', 'hiddenReservedValue', 'required', 'notRequired', 'disabled', 'enabled'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldLinkageActionAssignField: {
    type: 'object',
    required: ['type', 'items'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['assignField'],
      },
      items: {
        type: 'array',
        items: ref('FlowSurfaceFieldLinkageAssignItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldLinkageActionSetFieldDefaultValue: {
    type: 'object',
    required: ['type', 'items'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['setFieldDefaultValue'],
      },
      items: {
        type: 'array',
        items: ref('FlowSurfaceFieldLinkageAssignItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldLinkageAction: {
    oneOf: [
      ref('FlowSurfaceFieldLinkageActionSetFieldState'),
      ref('FlowSurfaceFieldLinkageActionAssignField'),
      ref('FlowSurfaceFieldLinkageActionSetFieldDefaultValue'),
      ref('FlowSurfaceReactionRunJsAction'),
    ],
  },
  FlowSurfaceFieldLinkageRule: {
    type: 'object',
    required: ['then'],
    properties: {
      key: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      when: ref('FlowSurfaceReactionFilter'),
      then: {
        type: 'array',
        items: ref('FlowSurfaceFieldLinkageAction'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceFieldValueCapability: buildReactionCapabilitySchema('fieldValue', 'FlowSurfaceFieldValueRule', {
    targetFields: {
      type: 'array',
      description: 'Fields that can receive field-value writes in the resolved scene.',
      items: ref('FlowSurfaceFieldOption'),
    },
    valueExprMeta: {
      allOf: [ref('FlowSurfaceReactionValueExprMeta')],
      description: 'Allowed value-expression sources for this capability.',
    },
  }),
  FlowSurfaceBlockLinkageCapability: buildReactionCapabilitySchema('blockLinkage', 'FlowSurfaceBlockLinkageRule', {
    supportedActions: {
      type: 'array',
      description: 'Block-level reaction actions supported in the resolved scene.',
      items: ref('FlowSurfaceReactionSupportedAction'),
    },
    conditionMeta: {
      allOf: [ref('FlowSurfaceReactionConditionMeta')],
      description: 'Condition-authoring metadata for this capability.',
    },
  }),
  FlowSurfaceFieldLinkageCapability: buildReactionCapabilitySchema('fieldLinkage', 'FlowSurfaceFieldLinkageRule', {
    supportedActions: {
      type: 'array',
      description: 'Field-linkage actions supported in the resolved scene.',
      items: ref('FlowSurfaceReactionSupportedAction'),
    },
    targetFields: {
      type: 'array',
      description: 'Fields that can be targeted by field-linkage actions in the resolved scene.',
      items: ref('FlowSurfaceFieldOption'),
    },
    conditionMeta: {
      allOf: [ref('FlowSurfaceReactionConditionMeta')],
      description: 'Condition-authoring metadata for this capability.',
    },
    valueExprMeta: {
      allOf: [ref('FlowSurfaceReactionValueExprMeta')],
      description: 'Allowed value-expression sources for assignment/default actions in this capability.',
    },
  }),
  FlowSurfaceActionLinkageCapability: buildReactionCapabilitySchema('actionLinkage', 'FlowSurfaceActionLinkageRule', {
    supportedActions: {
      type: 'array',
      description: 'Action-linkage actions supported in the resolved scene.',
      items: ref('FlowSurfaceReactionSupportedAction'),
    },
    conditionMeta: {
      allOf: [ref('FlowSurfaceReactionConditionMeta')],
      description: 'Condition-authoring metadata for this capability.',
    },
  }),
  FlowSurfaceReactionCapability: {
    oneOf: [
      ref('FlowSurfaceFieldValueCapability'),
      ref('FlowSurfaceBlockLinkageCapability'),
      ref('FlowSurfaceFieldLinkageCapability'),
      ref('FlowSurfaceActionLinkageCapability'),
    ],
  },
  FlowSurfaceGetReactionMetaRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
    },
    additionalProperties: false,
  },
  FlowSurfaceGetReactionMetaResult: {
    type: 'object',
    required: ['target', 'capabilities', 'unavailable'],
    properties: {
      target: ref('FlowSurfaceReactionTargetSummary'),
      capabilities: {
        type: 'array',
        items: ref('FlowSurfaceReactionCapability'),
      },
      unavailable: {
        type: 'array',
        items: ref('FlowSurfaceReactionUnavailableCapability'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceSetFieldValueRulesRequest: buildReactionWriteRequestSchema('FlowSurfaceFieldValueRule'),
  FlowSurfaceSetFieldValueRulesResult: buildReactionWriteResultSchema('FlowSurfaceFieldValueRule'),
  FlowSurfaceSetBlockLinkageRulesRequest: buildReactionWriteRequestSchema('FlowSurfaceBlockLinkageRule'),
  FlowSurfaceSetBlockLinkageRulesResult: buildReactionWriteResultSchema('FlowSurfaceBlockLinkageRule'),
  FlowSurfaceSetFieldLinkageRulesRequest: buildReactionWriteRequestSchema('FlowSurfaceFieldLinkageRule'),
  FlowSurfaceSetFieldLinkageRulesResult: buildReactionWriteResultSchema('FlowSurfaceFieldLinkageRule'),
  FlowSurfaceSetActionLinkageRulesRequest: buildReactionWriteRequestSchema('FlowSurfaceActionLinkageRule'),
  FlowSurfaceSetActionLinkageRulesResult: buildReactionWriteResultSchema('FlowSurfaceActionLinkageRule'),
  FlowSurfaceApplyBlueprintReactionItemSetFieldValueRules: {
    type: 'object',
    required: ['type', 'target', 'rules'],
    properties: {
      type: {
        type: 'string',
        enum: ['setFieldValueRules'],
      },
      target: {
        type: 'string',
        description:
          'Bind key or local key of the reaction target resolved from the same blueprint run. The referenced node must have an explicit key/bind key in that blueprint result. For form field-value writes, point to the form block key/path, not the inner grid node.',
      },
      rules: {
        type: 'array',
        items: ref('FlowSurfaceFieldValueRule'),
      },
      expectedFingerprint: {
        type: 'string',
        description:
          'Optional optimistic-concurrency fingerprint from a prior `getReactionMeta` read of the same slot.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintReactionItemSetBlockLinkageRules: {
    type: 'object',
    required: ['type', 'target', 'rules'],
    properties: {
      type: {
        type: 'string',
        enum: ['setBlockLinkageRules'],
      },
      target: {
        type: 'string',
        description:
          'Bind key or local key of the reaction target resolved from the same blueprint run. The referenced node must have an explicit key/bind key in that blueprint result.',
      },
      rules: {
        type: 'array',
        items: ref('FlowSurfaceBlockLinkageRule'),
      },
      expectedFingerprint: {
        type: 'string',
        description:
          'Optional optimistic-concurrency fingerprint from a prior `getReactionMeta` read of the same slot.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintReactionItemSetFieldLinkageRules: {
    type: 'object',
    required: ['type', 'target', 'rules'],
    properties: {
      type: {
        type: 'string',
        enum: ['setFieldLinkageRules'],
      },
      target: {
        type: 'string',
        description:
          'Bind key or local key of the reaction target resolved from the same blueprint run. The referenced node must have an explicit key/bind key in that blueprint result. Form-scene field linkage still targets the form block key/path, and the backend resolves the concrete grid slot.',
      },
      rules: {
        type: 'array',
        items: ref('FlowSurfaceFieldLinkageRule'),
      },
      expectedFingerprint: {
        type: 'string',
        description:
          'Optional optimistic-concurrency fingerprint from a prior `getReactionMeta` read of the same slot.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintReactionItemSetActionLinkageRules: {
    type: 'object',
    required: ['type', 'target', 'rules'],
    properties: {
      type: {
        type: 'string',
        enum: ['setActionLinkageRules'],
      },
      target: {
        type: 'string',
        description:
          'Bind key or local key of the reaction target resolved from the same blueprint run. The referenced node must have an explicit key/bind key in that blueprint result.',
      },
      rules: {
        type: 'array',
        items: ref('FlowSurfaceActionLinkageRule'),
      },
      expectedFingerprint: {
        type: 'string',
        description:
          'Optional optimistic-concurrency fingerprint from a prior `getReactionMeta` read of the same slot.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintReactionItem: {
    oneOf: [
      ref('FlowSurfaceApplyBlueprintReactionItemSetFieldValueRules'),
      ref('FlowSurfaceApplyBlueprintReactionItemSetBlockLinkageRules'),
      ref('FlowSurfaceApplyBlueprintReactionItemSetFieldLinkageRules'),
      ref('FlowSurfaceApplyBlueprintReactionItemSetActionLinkageRules'),
    ],
  },
  FlowSurfaceApplyBlueprintReaction: {
    type: 'object',
    required: ['items'],
    description:
      'Optional whole-page reaction authoring section for blueprint-driven interaction logic. Each item must target an explicit same-run local key / bind key. Only explicitly listed items are written. Repeating the same `(type, target)` slot is invalid. In `replace`, include every slot that must exist in the resulting surface instead of relying on omission. Use localized `getReactionMeta` + `set*Rules` for edits on existing live surfaces.',
    properties: {
      items: {
        type: 'array',
        items: ref('FlowSurfaceApplyBlueprintReactionItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintAssets: {
    type: 'object',
    properties: {
      scripts: {
        type: 'object',
        additionalProperties: ANY_OBJECT_SCHEMA,
      },
      charts: {
        type: 'object',
        additionalProperties: ANY_OBJECT_SCHEMA,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintLayoutCell: {
    oneOf: [
      {
        type: 'string',
        description: 'Local block key string in the current tab or popup scope.',
      },
      {
        type: 'object',
        description:
          'Layout cell object in the public applyBlueprint contract. Use only { key, span } to reference a local block key.',
        required: ['key'],
        properties: {
          key: {
            type: 'string',
            description: 'Local block key in the current tab or popup scope.',
          },
          span: {
            type: 'number',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceApplyBlueprintLayout: {
    type: 'object',
    description:
      'Layout object used by tab/popup `layout` and field-grid-block `fieldsLayout`. Block-level `layout` is still not allowed; use `fieldsLayout` only on `createForm`, `editForm`, `details`, or `filterForm`.',
    properties: {
      rows: {
        type: 'array',
        description: 'Two-dimensional layout grid. Each cell is either a block key string or an object { key, span }.',
        items: {
          type: 'array',
          items: ref('FlowSurfaceApplyBlueprintLayoutCell'),
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintPopup: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      template: ref('FlowSurfaceRequestPopupTemplateRef'),
      tryTemplate: {
        type: 'boolean',
        description: APPLY_BLUEPRINT_POPUP_TRY_TEMPLATE_DESCRIPTION,
      },
      defaultType: {
        type: 'string',
        enum: ['view', 'edit'],
        description:
          'When popup content is omitted, applyBlueprint prefers a compatible popup template first and otherwise auto-generates a default relation popup of the requested type.',
      },
      saveAsTemplate: {
        allOf: [ref('FlowSurfaceRequestPopupSaveAsTemplate')],
        description: APPLY_BLUEPRINT_POPUP_SAVE_AS_TEMPLATE_DESCRIPTION,
      },
      blocks: {
        type: 'array',
        description:
          'Inline popup blocks. For custom `edit` popups, provide exactly one `editForm` block plus any optional sibling blocks.',
        items: ref('FlowSurfaceApplyBlueprintBlockSpec'),
      },
      layout: {
        allOf: [ref('FlowSurfaceApplyBlueprintLayout')],
        description:
          'Popup-scoped layout. Layout is only allowed on tabs and popup documents, not on individual blocks.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintFieldSpec: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        properties: {
          key: { type: 'string' },
          field: { type: 'string' },
          associationPathName: { type: 'string' },
          renderer: { type: 'string' },
          type: { type: 'string' },
          fieldType: RELATION_FIELD_TYPE_SCHEMA,
          fields: RELATION_TARGET_FIELDS_SCHEMA,
          titleField: { type: 'string' },
          openMode: { type: 'string', example: 'drawer' },
          popupSize: { type: 'string', example: 'medium' },
          pageSize: { type: 'number', example: 10 },
          showIndex: { type: 'boolean', example: true },
          label: { type: 'string' },
          target: {
            type: 'string',
            description: 'String block key on the same tab or popup scope, typically used by filter-form fields.',
          },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceApplyBlueprintPopup'),
          script: { type: 'string' },
          chart: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceApplyBlueprintActionSpec: {
    oneOf: [
      {
        type: 'string',
        enum: APPLY_BLUEPRINT_ACTION_TYPE_ENUM,
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: { type: 'string' },
          type: {
            type: 'string',
            enum: APPLY_BLUEPRINT_ACTION_TYPE_ENUM,
            description: `Action type. On record-capable blocks (\`table\`, \`details\`, \`list\`, \`gridCard\`), record actions such as \`view\`, \`edit\`, \`updateRecord\`, \`delete\`, and \`duplicate\` should normally be authored under \`recordActions\`; applyBlueprint also auto-promotes those common record actions from \`actions\` for convenience. ${APPLY_BLUEPRINT_ADD_CHILD_NOTE} For custom \`edit\` popups, include exactly one \`editForm\` block inside popup.blocks.`,
          },
          title: { type: 'string' },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceApplyBlueprintPopup'),
          script: { type: 'string' },
          chart: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceApplyBlueprintRecordActionSpec: {
    oneOf: [
      {
        type: 'string',
        enum: RECORD_ACTION_TYPE_ENUM,
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: { type: 'string' },
          type: {
            type: 'string',
            enum: RECORD_ACTION_TYPE_ENUM,
            description: `Record-action type for record-capable blocks such as \`table\`, \`details\`, \`list\`, and \`gridCard\`. ${ADD_CHILD_TREE_TABLE_NOTE} For custom \`edit\` popups, include exactly one \`editForm\` block inside popup.blocks.`,
          },
          title: { type: 'string' },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceApplyBlueprintPopup'),
          script: { type: 'string' },
          chart: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceApplyBlueprintBlockSpec: {
    type: 'object',
    description:
      'Public applyBlueprint block spec. Blocks do not accept a `layout` property; use tab.layout or popup.layout instead. `fieldsLayout` is available only on `createForm`, `editForm`, `details`, and `filterForm`. Generic `form` is not supported here; use `editForm` or `createForm`.',
    anyOf: [{ required: ['type'] }, { required: ['template'] }],
    properties: {
      key: { type: 'string' },
      type: {
        type: 'string',
        enum: APPLY_BLUEPRINT_BLOCK_TYPE_ENUM,
        description:
          'Public applyBlueprint block type. Generic `form` is not supported; use `editForm` or `createForm`.',
      },
      title: { type: 'string' },
      collection: {
        type: 'string',
        description:
          'Block-level shorthand collection name. When using the nested resource object instead, use resource.collectionName there.',
      },
      dataSourceKey: { type: 'string' },
      associationPathName: {
        type: 'string',
        description:
          "Association field path used by raw resource-init shorthand. For popup association tables, prefer `resource.binding='associatedRecords'` with `associationField`; applyBlueprint only normalizes `currentRecord|associatedRecords + associationPathName` to that canonical form when `associationPathName` is a single association field name.",
      },
      binding: {
        type: 'string',
        enum: ['currentCollection', 'currentRecord', 'associatedRecords', 'otherRecords'],
      },
      associationField: {
        type: 'string',
        description:
          'Canonical association field name for popup `associatedRecords` binding. Prefer this over `associationPathName` when authoring relation tables inside record popups.',
      },
      resource: ref('FlowSurfaceBlockResourceInput'),
      template: ref('FlowSurfaceBlockTemplateRef'),
      settings: ANY_OBJECT_SCHEMA,
      defaultFilter: {
        allOf: [ref('FlowSurfaceFilterGroup')],
        description: APPLY_BLUEPRINT_DATA_SURFACE_BLOCK_DEFAULT_FILTER_DESCRIPTION,
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceApplyBlueprintFieldSpec'),
      },
      fieldsLayout: {
        allOf: [ref('FlowSurfaceApplyBlueprintLayout')],
        description:
          'Optional inner field-grid layout for `createForm`, `editForm`, `details`, or `filterForm`. Uses the same public `{ rows: [[...]] }` shape as tab/popup layout, but references field keys inside the current block and must place every created field exactly once.',
      },
      actions: {
        type: 'array',
        description: `Block-level actions. On record-capable blocks, \`view\`, \`edit\`, \`updateRecord\`, \`delete\`, and \`duplicate\` should normally go to \`recordActions\`; applyBlueprint auto-promotes those common record actions when they are written here. ${APPLY_BLUEPRINT_ADD_CHILD_NOTE}`,
        items: ref('FlowSurfaceApplyBlueprintActionSpec'),
      },
      recordActions: {
        type: 'array',
        items: ref('FlowSurfaceApplyBlueprintRecordActionSpec'),
      },
      script: { type: 'string' },
      chart: { type: 'string' },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintTab: {
    type: 'object',
    required: ['blocks'],
    properties: {
      key: {
        type: 'string',
        description:
          'Optional local tab key used only inside the current applyBlueprint document for layout or in-document references. It is not used to match existing route-backed tabs in replace mode. When omitted, the server generates one.',
      },
      title: { type: 'string' },
      icon: { type: 'string' },
      documentTitle: { type: 'string' },
      blocks: {
        type: 'array',
        minItems: 1,
        items: ref('FlowSurfaceApplyBlueprintBlockSpec'),
      },
      layout: {
        allOf: [ref('FlowSurfaceApplyBlueprintLayout')],
        description: 'Tab-scoped layout. Layout is allowed here and on popup documents, not on individual blocks.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintNavigationGroup: {
    type: 'object',
    properties: {
      routeId: {
        ...STRING_OR_INTEGER_SCHEMA,
        description:
          'Preferred existing menu-group route id for exact targeting. Do not mix it with title/icon/tooltip/hideInMenu. applyBlueprint create mode does not mutate existing group metadata; use low-level updateMenu separately when needed.',
      },
      title: {
        type: 'string',
        description:
          "Group title for create mode. When `routeId` is omitted, applyBlueprint reuses a same-title group if the match is unique, creates one when no group exists, and rejects ambiguous multi-match cases. Same-title reuse is title-only; if an existing group's metadata must change, use low-level updateMenu instead of applyBlueprint create.",
      },
      icon: {
        type: 'string',
        description:
          'Group icon used only when create mode actually creates a new menu group. Not allowed together with routeId.',
      },
      tooltip: {
        type: 'string',
        description:
          'Group tooltip used only when create mode actually creates a new menu group. Not allowed together with routeId.',
      },
      hideInMenu: {
        type: 'boolean',
        description:
          'Group hidden-state used only when create mode actually creates a new menu group. Not allowed together with routeId.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintNavigation: {
    type: 'object',
    properties: {
      group: ref('FlowSurfaceApplyBlueprintNavigationGroup'),
      item: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          icon: { type: 'string' },
          tooltip: { type: 'string' },
          hideInMenu: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintPage: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      icon: { type: 'string' },
      documentTitle: { type: 'string' },
      enableHeader: { type: 'boolean' },
      enableTabs: { type: 'boolean' },
      displayTitle: { type: 'boolean' },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintTarget: {
    type: 'object',
    required: ['pageSchemaUid'],
    properties: {
      pageSchemaUid: { type: 'string' },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintDefaultFieldGroup: {
    type: 'object',
    required: ['title', 'fields'],
    description:
      'Collection-level candidate field group used only for backend-generated default popup content. Scenario-specific filtering may remove fields or whole groups.',
    properties: {
      key: { type: 'string' },
      title: { type: 'string' },
      fields: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintDefaultPopupName: {
    type: 'object',
    required: ['name', 'description'],
    description:
      'Default popup metadata with required `name` and `description`. Do not place blocks, fields, fieldGroups, layout, or other content here.',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintDefaultPopupActionMap: {
    type: 'object',
    properties: {
      view: ref('FlowSurfaceApplyBlueprintDefaultPopupName'),
      addNew: ref('FlowSurfaceApplyBlueprintDefaultPopupName'),
      edit: ref('FlowSurfaceApplyBlueprintDefaultPopupName'),
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintDefaultPopups: {
    type: 'object',
    description:
      'Popup defaults with required `name` and `description` metadata. Use `associations`, not `relations`, for source-collection association field popup names.',
    properties: {
      view: ref('FlowSurfaceApplyBlueprintDefaultPopupName'),
      addNew: ref('FlowSurfaceApplyBlueprintDefaultPopupName'),
      edit: ref('FlowSurfaceApplyBlueprintDefaultPopupName'),
      associations: {
        type: 'object',
        additionalProperties: ref('FlowSurfaceApplyBlueprintDefaultPopupActionMap'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintDefaultCollection: {
    type: 'object',
    description:
      'v1 collection-level defaults. Only `fieldGroups` and `popups` with required `name` and `description` metadata are supported; block-specific defaults are not supported.',
    properties: {
      fieldGroups: {
        type: 'array',
        minItems: 1,
        items: ref('FlowSurfaceApplyBlueprintDefaultFieldGroup'),
      },
      popups: ref('FlowSurfaceApplyBlueprintDefaultPopups'),
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintDefaults: {
    type: 'object',
    description: 'Optional v1 applyBlueprint defaults. Supports only `collections`; do not send `defaults.blocks`.',
    properties: {
      collections: {
        type: 'object',
        additionalProperties: ref('FlowSurfaceApplyBlueprintDefaultCollection'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintRequest: {
    type: 'object',
    required: ['mode', 'tabs'],
    description:
      "Simplified page-structure request object for applyBlueprint. `version` may be omitted and defaults to '1'. Runtime validation enforces mode-specific rules: create does not accept target, while replace requires target.pageSchemaUid and does not use navigation. `defaults.collections` may provide collection-level fieldGroups and popup metadata with required `name` and `description` for generated default popups; v1 does not support `defaults.blocks`.",
    properties: {
      version: {
        type: 'string',
        enum: ['1'],
      },
      mode: {
        type: 'string',
        enum: ['create', 'replace'],
      },
      target: ref('FlowSurfaceApplyBlueprintTarget'),
      navigation: ref('FlowSurfaceApplyBlueprintNavigation'),
      page: ref('FlowSurfaceApplyBlueprintPage'),
      defaults: ref('FlowSurfaceApplyBlueprintDefaults'),
      tabs: {
        type: 'array',
        minItems: 1,
        items: ref('FlowSurfaceApplyBlueprintTab'),
      },
      assets: ref('FlowSurfaceApplyBlueprintAssets'),
      reaction: ref('FlowSurfaceApplyBlueprintReaction'),
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintResponseTarget: {
    type: 'object',
    properties: {
      pageSchemaUid: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyBlueprintResponse: {
    type: 'object',
    required: ['version', 'mode', 'target', 'surface'],
    properties: {
      version: {
        type: 'string',
        enum: ['1'],
      },
      mode: {
        type: 'string',
        enum: ['create', 'replace'],
      },
      target: ref('FlowSurfaceApplyBlueprintResponseTarget'),
      surface: ref('FlowSurfaceGetResponse'),
    },
    additionalProperties: false,
  },
  FlowSurfaceApprovalBlueprintSurface: {
    type: 'string',
    enum: ['initiator', 'approver', 'taskCard'],
  },
  FlowSurfaceApplyApprovalBlueprintBinding: {
    type: 'object',
    required: ['resourceName', 'filterByTk', 'configPath'],
    properties: {
      resourceName: {
        type: 'string',
        enum: ['workflows', 'flow_nodes'],
      },
      filterByTk: STRING_OR_INTEGER_SCHEMA,
      configPath: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyApprovalBlueprintTarget: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
      },
      workflowId: STRING_OR_INTEGER_SCHEMA,
      nodeId: STRING_OR_INTEGER_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyApprovalBlueprintRequest: {
    type: 'object',
    required: ['surface'],
    description:
      "Simplified approval-surface blueprint request for workflow approval UIs. This is the preferred bootstrap / replace route for approval initiator, approver, and task-card surfaces. `version` may be omitted and defaults to '1'. `mode` may be omitted and defaults to `replace`; v1 only supports `replace`. Runtime validation enforces binding rules: `initiator` requires `workflowId`, `approver` requires `nodeId`, and `taskCard` requires exactly one of `workflowId` or `nodeId`. Page-like surfaces (`initiator`, `approver`) accept `blocks + layout`; each block may declare `type` directly or reuse `template: { uid, mode }`. `taskCard` accepts `fields + layout`. This route does not perform schema wiring, but it does persist binding fields and reconcile approval runtime config from approval actions.",
    properties: {
      version: {
        type: 'string',
        enum: ['1'],
      },
      mode: {
        type: 'string',
        enum: ['replace'],
        default: 'replace',
      },
      surface: ref('FlowSurfaceApprovalBlueprintSurface'),
      workflowId: STRING_OR_INTEGER_SCHEMA,
      nodeId: STRING_OR_INTEGER_SCHEMA,
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceApprovalBlueprintBlockSpec'),
        description: 'Page-like approval content for `initiator` and `approver` surfaces.',
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldSpec'),
        description: 'Task-card field list for `taskCard` surfaces.',
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyApprovalBlueprintResponse: {
    type: 'object',
    required: ['version', 'mode', 'surfaceType', 'target', 'binding', 'surface'],
    properties: {
      version: {
        type: 'string',
        enum: ['1'],
      },
      mode: {
        type: 'string',
        enum: ['replace'],
      },
      surfaceType: ref('FlowSurfaceApprovalBlueprintSurface'),
      target: ref('FlowSurfaceApplyApprovalBlueprintTarget'),
      binding: ref('FlowSurfaceApplyApprovalBlueprintBinding'),
      surface: ref('FlowSurfaceGetResponse'),
    },
    additionalProperties: false,
  },
  FlowSurfaceConfigureRequest: {
    type: 'object',
    required: ['target', 'changes'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      changes: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceConfigureResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      updated: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCreateMenuRequest: {
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['group', 'item'],
        default: 'item',
      },
      icon: {
        type: 'string',
      },
      tooltip: {
        type: 'string',
      },
      hideInMenu: {
        type: 'boolean',
      },
      parentMenuRouteId: STRING_OR_INTEGER_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceCreateMenuResult: {
    type: 'object',
    properties: {
      routeId: STRING_OR_INTEGER_SCHEMA,
      type: {
        type: 'string',
        enum: ['group', 'flowPage'],
      },
      parentMenuRouteId: {
        ...STRING_OR_INTEGER_SCHEMA,
        nullable: true,
      },
      pageSchemaUid: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabRouteId: STRING_OR_INTEGER_SCHEMA,
      tabSchemaName: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateMenuRequest: {
    type: 'object',
    required: ['menuRouteId'],
    properties: {
      menuRouteId: STRING_OR_INTEGER_SCHEMA,
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
        nullable: true,
      },
      tooltip: {
        type: 'string',
        nullable: true,
      },
      hideInMenu: {
        type: 'boolean',
      },
      parentMenuRouteId: {
        ...STRING_OR_INTEGER_SCHEMA,
        nullable: true,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateMenuResult: {
    type: 'object',
    properties: {
      routeId: STRING_OR_INTEGER_SCHEMA,
      type: {
        type: 'string',
        enum: ['group', 'flowPage'],
      },
      parentMenuRouteId: {
        ...STRING_OR_INTEGER_SCHEMA,
        nullable: true,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCreatePageRequest: {
    type: 'object',
    properties: {
      menuRouteId: STRING_OR_INTEGER_SCHEMA,
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabSchemaName: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      tabTitle: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      tabIcon: {
        type: 'string',
      },
      enableTabs: {
        type: 'boolean',
      },
      enableHeader: {
        type: 'boolean',
      },
      displayTitle: {
        type: 'boolean',
      },
      documentTitle: {
        type: 'string',
      },
      tabDocumentTitle: {
        type: 'string',
      },
      tabFlowRegistry: ANY_OBJECT_SCHEMA,
      routeOptions: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceCreatePageResult: {
    type: 'object',
    properties: {
      routeId: STRING_OR_INTEGER_SCHEMA,
      parentMenuRouteId: {
        ...STRING_OR_INTEGER_SCHEMA,
        nullable: true,
      },
      pageSchemaUid: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabRouteId: STRING_OR_INTEGER_SCHEMA,
      tabSchemaName: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDestroyPageRequest: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDestroyPageResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddTabRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      tabSchemaUid: {
        type: 'string',
      },
      tabSchemaName: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceAddTabResult: {
    type: 'object',
    properties: {
      pageUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabRouteId: STRING_OR_INTEGER_SCHEMA,
      tabSchemaName: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateTabRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateTabResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      routeId: STRING_OR_INTEGER_SCHEMA,
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveTabRequest: {
    type: 'object',
    required: ['sourceUid', 'targetUid'],
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveTabResult: {
    type: 'object',
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveTabRequest: {
    type: 'object',
    required: ['uid'],
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveTabResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddPopupTabRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceAddPopupTabResult: {
    type: 'object',
    properties: {
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdatePopupTabRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdatePopupTabResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMovePopupTabRequest: {
    type: 'object',
    required: ['sourceUid', 'targetUid'],
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMovePopupTabResult: {
    type: 'object',
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemovePopupTabRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
    },
    additionalProperties: false,
  },
  FlowSurfaceRemovePopupTabResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddBlockRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      type: {
        type: 'string',
        enum: COMPOSE_BLOCK_TYPE_ENUM,
      },
      use: {
        type: 'string',
      },
      template: ref('FlowSurfaceBlockTemplateRef'),
      resource: ref('FlowSurfaceBlockResourceInput'),
      resourceInit: ref('FlowSurfaceResourceInit'),
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldSpec'),
      },
      fieldsLayout: ref('FlowSurfaceComposeLayout'),
      settings: ANY_OBJECT_SCHEMA,
      defaultFilter: {
        allOf: [ref('FlowSurfaceFilterGroup')],
        description: PUBLIC_DATA_SURFACE_BLOCK_DEFAULT_FILTER_DESCRIPTION,
      },
      defaultActionSettings: ref('FlowSurfaceDefaultActionSettings'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddBlockResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
      blockGridUid: {
        type: 'string',
      },
      itemUid: {
        type: 'string',
      },
      itemGridUid: {
        type: 'string',
      },
      actionsColumnUid: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      tabUid: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldRequest: {
    type: 'object',
    required: ['target'],
    oneOf: [
      {
        required: ['template'],
      },
      {
        anyOf: [{ required: ['fieldPath'] }, { required: ['type'] }],
      },
    ],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      template: ref('FlowSurfaceTemplateRef'),
      fieldPath: {
        type: 'string',
        description: 'Required for bound fields. Omit when using synthetic standalone types such as jsColumn/jsItem.',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
        description: 'Public JS renderer variant for a bound field.',
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
        description: 'Public standalone field capability. Does not accept fieldPath.',
      },
      associationPathName: {
        type: 'string',
      },
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      fieldType: RELATION_FIELD_TYPE_SCHEMA,
      fields: RELATION_TARGET_FIELDS_SCHEMA,
      titleField: { type: 'string' },
      openMode: { type: 'string', example: 'drawer' },
      popupSize: { type: 'string', example: 'medium' },
      pageSize: { type: 'number', example: 10 },
      showIndex: { type: 'boolean', example: true },
      defaultTargetUid: {
        type: 'string',
      },
      targetBlockUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
        description: 'Optional filter-form target selection key. This is not the same field as `target.uid`.',
      },
      settings: ANY_OBJECT_SCHEMA,
      popup: ref('FlowSurfaceComposeFieldPopup'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      wrapperUid: {
        type: 'string',
      },
      fieldUid: {
        type: 'string',
      },
      innerFieldUid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
      },
      defaultTargetUid: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
        nullable: true,
      },
      fieldPath: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      type: {
        type: 'string',
        enum: NON_RECORD_ACTION_TYPE_ENUM,
      },
      use: {
        type: 'string',
      },
      resourceInit: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
      popup: ref('FlowSurfaceComposeActionPopup'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      assignFormUid: {
        type: 'string',
      },
      assignFormGridUid: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddRecordActionRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      type: {
        type: 'string',
        enum: RECORD_ACTION_TYPE_ENUM,
      },
      use: {
        type: 'string',
      },
      resourceInit: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
      popup: ref('FlowSurfaceComposeActionPopup'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddRecordActionResult: {
    allOf: [ref('FlowSurfaceAddActionResult')],
  },
  FlowSurfaceBatchItemError: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
      },
      message: {
        type: 'string',
      },
      status: {
        type: 'integer',
      },
      type: {
        type: 'string',
        enum: ['bad_request', 'forbidden', 'conflict', 'internal_error'],
      },
    },
    required: ['message', 'type', 'code', 'status'],
    additionalProperties: false,
  },
  FlowSurfaceAddBlockItem: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: COMPOSE_BLOCK_TYPE_ENUM,
      },
      use: {
        type: 'string',
      },
      template: ref('FlowSurfaceBlockTemplateRef'),
      resource: ref('FlowSurfaceBlockResourceInput'),
      resourceInit: ref('FlowSurfaceResourceInit'),
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldSpec'),
      },
      fieldsLayout: ref('FlowSurfaceComposeLayout'),
      settings: ANY_OBJECT_SCHEMA,
      defaultFilter: {
        allOf: [ref('FlowSurfaceFilterGroup')],
        description: PUBLIC_DATA_SURFACE_BLOCK_DEFAULT_FILTER_DESCRIPTION,
      },
      defaultActionSettings: ref('FlowSurfaceDefaultActionSettings'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldItem: {
    type: 'object',
    oneOf: [
      {
        required: ['template'],
      },
      {
        anyOf: [{ required: ['fieldPath'] }, { required: ['type'] }],
      },
    ],
    properties: {
      key: {
        type: 'string',
      },
      template: ref('FlowSurfaceTemplateRef'),
      fieldPath: {
        type: 'string',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
      },
      associationPathName: {
        type: 'string',
      },
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      fieldType: RELATION_FIELD_TYPE_SCHEMA,
      fields: RELATION_TARGET_FIELDS_SCHEMA,
      titleField: { type: 'string' },
      openMode: { type: 'string', example: 'drawer' },
      popupSize: { type: 'string', example: 'medium' },
      pageSize: { type: 'number', example: 10 },
      showIndex: { type: 'boolean', example: true },
      defaultTargetUid: {
        type: 'string',
      },
      targetBlockUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      settings: ANY_OBJECT_SCHEMA,
      popup: ref('FlowSurfaceComposeFieldPopup'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionItem: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: NON_RECORD_ACTION_TYPE_ENUM,
      },
      use: {
        type: 'string',
      },
      resourceInit: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
      popup: ref('FlowSurfaceComposeActionPopup'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddRecordActionItem: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: RECORD_ACTION_TYPE_ENUM,
      },
      use: {
        type: 'string',
      },
      resourceInit: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
      popup: ref('FlowSurfaceComposeActionPopup'),
    },
    additionalProperties: false,
  },
  FlowSurfaceAddBlocksRequest: {
    type: 'object',
    required: ['target', 'blocks'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceAddBlockItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldsRequest: {
    type: 'object',
    required: ['target'],
    oneOf: [
      {
        required: ['template'],
      },
      {
        required: ['fields'],
      },
    ],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      template: ref('FlowSurfaceTemplateRef'),
      fields: {
        type: 'array',
        items: ref('FlowSurfaceAddFieldItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionsRequest: {
    type: 'object',
    required: ['target', 'actions'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      actions: {
        type: 'array',
        items: ref('FlowSurfaceAddActionItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddRecordActionsRequest: {
    type: 'object',
    required: ['target', 'recordActions'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      recordActions: {
        type: 'array',
        items: ref('FlowSurfaceAddRecordActionItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddBlocksItemResult: {
    type: 'object',
    properties: {
      index: {
        type: 'integer',
      },
      key: {
        type: 'string',
      },
      ok: {
        type: 'boolean',
      },
      result: ref('FlowSurfaceAddBlockResult'),
      error: ref('FlowSurfaceBatchItemError'),
    },
    required: ['index', 'ok'],
    additionalProperties: false,
  },
  FlowSurfaceAddFieldsItemResult: {
    type: 'object',
    properties: {
      index: {
        type: 'integer',
      },
      key: {
        type: 'string',
      },
      ok: {
        type: 'boolean',
      },
      result: ref('FlowSurfaceAddFieldResult'),
      error: ref('FlowSurfaceBatchItemError'),
    },
    required: ['index', 'ok'],
    additionalProperties: false,
  },
  FlowSurfaceAddActionsItemResult: {
    type: 'object',
    properties: {
      index: {
        type: 'integer',
      },
      key: {
        type: 'string',
      },
      ok: {
        type: 'boolean',
      },
      result: ref('FlowSurfaceAddActionResult'),
      error: ref('FlowSurfaceBatchItemError'),
    },
    required: ['index', 'ok'],
    additionalProperties: false,
  },
  FlowSurfaceAddRecordActionsItemResult: {
    type: 'object',
    properties: {
      index: {
        type: 'integer',
      },
      key: {
        type: 'string',
      },
      ok: {
        type: 'boolean',
      },
      result: ref('FlowSurfaceAddRecordActionResult'),
      error: ref('FlowSurfaceBatchItemError'),
    },
    required: ['index', 'ok'],
    additionalProperties: false,
  },
  FlowSurfaceAddBlocksResult: {
    type: 'object',
    properties: {
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceAddBlocksItemResult'),
      },
      successCount: {
        type: 'integer',
      },
      errorCount: {
        type: 'integer',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldsResult: {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        items: ref('FlowSurfaceAddFieldsItemResult'),
      },
      successCount: {
        type: 'integer',
      },
      errorCount: {
        type: 'integer',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionsResult: {
    type: 'object',
    properties: {
      actions: {
        type: 'array',
        items: ref('FlowSurfaceAddActionsItemResult'),
      },
      successCount: {
        type: 'integer',
      },
      errorCount: {
        type: 'integer',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddRecordActionsResult: {
    type: 'object',
    properties: {
      recordActions: {
        type: 'array',
        items: ref('FlowSurfaceAddRecordActionsItemResult'),
      },
      successCount: {
        type: 'integer',
      },
      errorCount: {
        type: 'integer',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateSettingsRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateSettingsResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      updated: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceSetEventFlowsRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      flowRegistry: ANY_OBJECT_SCHEMA,
      flows: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceSetEventFlowsResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceSetLayoutRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      rows: ANY_OBJECT_SCHEMA,
      sizes: ANY_OBJECT_SCHEMA,
      rowOrder: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceSetLayoutResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      rows: ANY_OBJECT_SCHEMA,
      sizes: ANY_OBJECT_SCHEMA,
      rowOrder: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveNodeRequest: {
    type: 'object',
    required: ['sourceUid', 'targetUid'],
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveNodeResult: {
    type: 'object',
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveNodeRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: {
        type: 'object',
        required: ['uid'],
        properties: {
          uid: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveNodeResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddTabValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      tabSchemaUid: ref('FlowSurfaceResolvableString'),
      tabSchemaName: ref('FlowSurfaceResolvableString'),
      title: ref('FlowSurfaceResolvableString'),
      icon: ref('FlowSurfaceResolvableString'),
      documentTitle: ref('FlowSurfaceResolvableString'),
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateUpdateTabValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      title: ref('FlowSurfaceResolvableString'),
      icon: ref('FlowSurfaceResolvableString'),
      documentTitle: ref('FlowSurfaceResolvableString'),
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateMoveTabValues: {
    type: 'object',
    required: ['sourceUid', 'targetUid'],
    properties: {
      sourceUid: ref('FlowSurfaceResolvableString'),
      targetUid: ref('FlowSurfaceResolvableString'),
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateRemoveTabValues: {
    type: 'object',
    properties: {
      uid: ref('FlowSurfaceResolvableString'),
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddBlockValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      type: ref('FlowSurfaceResolvableString'),
      use: ref('FlowSurfaceResolvableString'),
      resourceInit: ref('FlowSurfaceMutateResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddFieldValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      fieldPath: ref('FlowSurfaceResolvableString'),
      associationPathName: ref('FlowSurfaceResolvableString'),
      dataSourceKey: ref('FlowSurfaceResolvableString'),
      collectionName: ref('FlowSurfaceResolvableString'),
      fieldUse: ref('FlowSurfaceResolvableString'),
      defaultTargetUid: ref('FlowSurfaceResolvableString'),
      targetBlockUid: ref('FlowSurfaceResolvableString'),
      targetUid: ref('FlowSurfaceResolvableString'),
      wrapperProps: ANY_OBJECT_SCHEMA,
      fieldProps: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddActionValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      type: ref('FlowSurfaceResolvableString'),
      use: ref('FlowSurfaceResolvableString'),
      resourceInit: ref('FlowSurfaceMutateResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddRecordActionValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      type: ref('FlowSurfaceResolvableString'),
      use: ref('FlowSurfaceResolvableString'),
      resourceInit: ref('FlowSurfaceMutateResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateUpdateSettingsValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateSetEventFlowsValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      flowRegistry: ANY_OBJECT_SCHEMA,
      flows: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateSetLayoutValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceMutateWriteTarget'),
      rows: ANY_OBJECT_SCHEMA,
      sizes: ANY_OBJECT_SCHEMA,
      rowOrder: {
        type: 'array',
        items: ref('FlowSurfaceResolvableString'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateMoveNodeValues: {
    type: 'object',
    properties: {
      sourceUid: ref('FlowSurfaceResolvableString'),
      targetUid: ref('FlowSurfaceResolvableString'),
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateRemoveNodeValues: {
    type: 'object',
    required: ['target'],
    properties: {
      target: {
        type: 'object',
        required: ['uid'],
        properties: {
          uid: ref('FlowSurfaceResolvableString'),
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateOpItem: {
    type: 'object',
    required: ['type'],
    properties: {
      opId: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: [...FLOW_SURFACE_MUTATE_OP_TYPES],
      },
      target: ref('FlowSurfaceMutateWriteTarget'),
      values: {
        ...ANY_OBJECT_SCHEMA,
        description:
          'Business payload for the corresponding `/flowSurfaces:<type>` action. Nested runtime values must use `{ step: "<opId>", path: "<field>" }` or `{ key: "<opId>" }`.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateRequest: {
    type: 'object',
    properties: {
      atomic: {
        type: 'boolean',
        enum: [true],
        default: true,
      },
      ops: {
        type: 'array',
        items: ref('FlowSurfaceMutateOpItem'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyRequest: {
    type: 'object',
    required: ['target', 'spec'],
    properties: {
      target: ref('FlowSurfaceWriteTarget'),
      mode: {
        type: 'string',
        enum: ['replace'],
        default: 'replace',
      },
      spec: ref('FlowSurfaceApplySpec'),
    },
    additionalProperties: false,
  },
  FlowSurfaceMutationResult: {
    oneOf: [
      ref('FlowSurfaceCreateMenuResult'),
      ref('FlowSurfaceUpdateMenuResult'),
      ref('FlowSurfaceCreatePageResult'),
      ref('FlowSurfaceDestroyPageResult'),
      ref('FlowSurfaceAddTabResult'),
      ref('FlowSurfaceUpdateTabResult'),
      ref('FlowSurfaceMoveTabResult'),
      ref('FlowSurfaceRemoveTabResult'),
      ref('FlowSurfaceAddPopupTabResult'),
      ref('FlowSurfaceUpdatePopupTabResult'),
      ref('FlowSurfaceMovePopupTabResult'),
      ref('FlowSurfaceRemovePopupTabResult'),
      ref('FlowSurfaceAddBlockResult'),
      ref('FlowSurfaceAddFieldResult'),
      ref('FlowSurfaceAddActionResult'),
      ref('FlowSurfaceAddRecordActionResult'),
      ref('FlowSurfaceUpdateSettingsResult'),
      ref('FlowSurfaceSetEventFlowsResult'),
      ref('FlowSurfaceSetLayoutResult'),
      ref('FlowSurfaceMoveNodeResult'),
      ref('FlowSurfaceRemoveNodeResult'),
    ],
  },
  FlowSurfaceMutationItemResult: {
    type: 'object',
    properties: {
      opId: {
        type: 'string',
      },
      result: ref('FlowSurfaceMutationResult'),
    },
    required: ['result'],
    additionalProperties: false,
  },
  FlowSurfaceMutationResponse: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: ref('FlowSurfaceMutationItemResult'),
      },
      clientKeyToUid: ref('FlowSurfaceClientKeyMap'),
    },
    additionalProperties: false,
  },
  FlowSurfaceErrorResponse: {
    type: 'object',
    example: {
      errors: [
        {
          code: 'FLOW_SURFACE_BAD_REQUEST',
          message:
            'flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab',
          status: 400,
          type: 'bad_request',
        },
      ],
    },
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Stable machine-readable error code',
              example: 'FLOW_SURFACE_BAD_REQUEST',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message for the caller',
            },
            status: {
              type: 'integer',
              description: 'HTTP status mapped from the FlowSurfaces error',
              example: 400,
            },
            type: {
              type: 'string',
              description: 'Error category such as bad_request, forbidden, conflict or internal_error',
              example: 'bad_request',
              enum: ['bad_request', 'forbidden', 'conflict', 'internal_error'],
            },
          },
          required: ['message', 'type', 'code', 'status'],
          additionalProperties: false,
        },
      },
    },
    additionalProperties: true,
  },
};

const paths = Object.fromEntries(
  FLOW_SURFACES_ACTION_NAMES.map((actionName) => [
    `/flowSurfaces:${actionName}`,
    {
      [FLOW_SURFACES_ACTION_METHODS[actionName]]: actionDocs[actionName],
    },
  ]),
);

export default {
  tags: [
    {
      name: FLOW_SURFACES_TAG,
      description: 'Atomic and declarative FlowModel surface orchestration for external CLI and automation tools',
    },
  ],
  paths: {
    ...paths,
  },
  components: {
    parameters,
    schemas,
  },
};
