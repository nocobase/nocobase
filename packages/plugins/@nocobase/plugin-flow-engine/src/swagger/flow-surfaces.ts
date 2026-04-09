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
  FLOW_SURFACE_PLAN_STEP_ACTIONS,
  FLOW_SURFACES_ACTION_METHODS,
  FLOW_SURFACES_ACTION_NAMES,
} from '../server/flow-surfaces/constants';
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
const STRING_OR_INTEGER_SCHEMA = {
  oneOf: [{ type: 'string' }, { type: 'integer' }],
};
const ACTION_TYPE_ENUM = [
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
const NON_RECORD_ACTION_TYPE_ENUM = [
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

const FLOW_SURFACES_READ_ACL_NOTE =
  'Read actions (`get` / `describeSurface` / `validatePlan` / `catalog` / `context` / `listTemplates` / `getTemplate`) are open to `loggedIn` by default. Write actions still require the `ui.flowSurfaces` snippet.';

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
      `Returns the block / field / action capabilities that can be created under the current target context, together with the recommended \`configureOptions\`, the underlying settings contract, event capabilities, and layout capabilities for the current node. The returned \`blocks[] / actions[] / recordActions[]\` only represent the truly available public capabilities under plugins enabled in the current instance. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceCatalogRequest', examples.catalog),
    responses: responses('FlowSurfaceCatalogResponse'),
  },
  context: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Read ctx variable tree available under the current target',
    description: valuesCompatibilityNote(
      `Returns the \`ctx\` variable tree available under the current target. \`path\` only accepts bare paths such as \`record\`, \`popup.record\`, and \`item.parentItem.value\`. Do not pass \`ctx.record\` or \`{{ ctx.record }}\`. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceContextRequest', examples.context),
    responses: responses('FlowSurfaceContextResponse'),
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
    summary: 'Read surface tree with stable refs and fingerprint',
    description: valuesCompatibilityNote(
      `Reads the current surface together with request-scoped bind refs, persisted declared refs, and an optimistic-concurrency fingerprint. The fingerprint is computed from the public surface tree together with the resolved ref bindings and ignores ref source differences such as \`request\` vs \`declared\`. The public readback strips the internal declared-ref metadata path from node.stepParams. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceDescribeSurfaceRequest', examples.describeSurface),
    responses: responses('FlowSurfaceDescribeSurfaceResponse'),
  },
  validatePlan: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Resolve plan selectors and preview the compiled low-level calls',
    description: valuesCompatibilityNote(
      `Validates a high-level plan against the current surface fingerprint, resolves { ref | locator } selectors to concrete uids, and returns the compiled step payloads without mutating data. The fingerprint covers both the public surface tree and the resolved ref bindings. When \`surface\` uses { ref }, that ref must also appear in \`bindRefs\` so the server can anchor the current surface root. Used request refs must also be persistable; route-backed page/tab roots are rejected. ${FLOW_SURFACES_READ_ACL_NOTE}`,
    ),
    requestBody: requestBody('FlowSurfaceValidatePlanRequest', examples.validatePlan),
    responses: responses('FlowSurfaceValidatePlanResponse'),
  },
  executePlan: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Execute a high-level plan and persist used bind refs as declared refs',
    description: valuesCompatibilityNote(
      'Executes validated high-level plan steps by orchestrating the existing FlowSurfaces service methods directly inside one transaction. Request-scoped bind refs used by selectors, plus `surface: { ref }` when it anchors the current surface, are persisted back as declared refs. Used request refs must be persistable; route-backed page/tab roots are rejected. If the plan removes the current surface itself, the response returns `surfaceExistsAfterExecute=false` and an empty refs map. Clients that need a fresh fingerprint for the next round should call `describeSurface` again.',
    ),
    requestBody: requestBody('FlowSurfaceExecutePlanRequest', examples.executePlan),
    responses: responses('FlowSurfaceExecutePlanResponse'),
  },
  ...templateActionDocs,
  compose: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Compose blocks, fields, actions and simple layout under an existing surface',
    description: valuesCompatibilityNote(
      'Organizes content under an existing page/tab/grid/popup using the public block/action/field semantics. This is the preferred creation entry for AI callers. The caller does not need to pass raw `use`, `fieldUse`, or `stepParams`. Blocks may be created from `template`, and form templates can set `template.usage="fields"` to import only their grid fields. Popup-capable actions and fields may reuse `popup.template`. For collection blocks under a popup, check `catalog.blocks[].resourceBindings` first. The `select / subForm / bulkEditForm` scene is currently recognized only, and popup collection block creation is not supported in that scene.',
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
      'Uses simple `changes` to update high-frequency settings such as page/tab titles, table pageSize, field clickToOpen, and action openView/confirm without requiring the caller to know internal paths. Check `catalog(target).configureOptions` before calling this action.',
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
            detailsSettings: {
              summary: 'Configure details colon and linkageRules',
              value: examples.configureDetails,
            },
            actionBehaviorSettings: {
              summary:
                'Configure action linkageRules, edit/update/duplicate modes, collapsed rows and email selection defaults',
              value: examples.configureActionModes,
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
      'Creates a block by catalog key or an explicitly supported block use. It can also create from `template`, using `mode="reference"` or `mode="copy"`. Form templates may set `template.usage="fields"` to create a fresh host block and import only its grid fields. Popup-capable host nodes automatically receive the popup shell. For collection blocks under a popup, check `catalog.blocks[].resourceBindings` first, then pass the semantic `resource.binding`. The lower-level `resourceInit` is still accepted for compatibility, but the server validates it against popup semantics. `resource` and `resourceInit` are mutually exclusive. The `select / subForm / bulkEditForm` scene is currently recognized only, and popup collection block creation is not supported in that scene. Direct add does not accept raw `props` / `decoratorProps` / `stepParams` / `flowRegistry`. Use `settings` and reuse the public configuration semantics from `configure.changes` / `catalog.configureOptions`.',
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
      'Automatically derives the wrapper/inner-field combination from the container use and the field interface. It can also import a form template through `template`, using `reference` or `copy` mode for the target form grid. `fieldUse` is only kept as a compatibility check and is no longer an arbitrary creation entry. Direct add does not accept raw `wrapperProps` / `fieldProps` / `props` / `decoratorProps` / `stepParams` / `flowRegistry`. Use `settings` and reuse the public configuration semantics from `configure.changes` / `catalog.configureOptions`. Popup-capable fields can also pass `popup` directly to append a local popup subtree or `popup.template` to reuse a saved popup template in `reference` / `copy` mode. If local openView is enabled but no popup content is provided, the server fills in the popup page/tab/grid shell automatically.',
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
      'Only non-record actions that are public in the catalog and visible in the current container may be created. Typical cases include table block actions, form submit, filter-form reset, and action-panel actions. Use `addRecordAction` for record actions. Direct add does not accept raw `props` / `decoratorProps` / `stepParams` / `flowRegistry`. Use `settings` and reuse `configure.changes` / `catalog.configureOptions`. Popup-capable actions may also include `popup` directly to append a popup subtree or `popup.template` to reuse a saved popup template in `reference` / `copy` mode.',
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
      'Only record actions that are public in the catalog and visible in the current container may be created. The public target must be a record-capable owner target such as table/details/list/gridCard. Do not pass internal container uids such as a table actions column or a list/gridCard item. Direct add does not accept raw `props` / `decoratorProps` / `stepParams` / `flowRegistry`. Use `settings` and reuse `configure.changes` / `catalog.configureOptions`. Popup-capable actions may also include `popup` directly to append a popup subtree or `popup.template` to reuse a saved popup template in `reference` / `copy` mode.',
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
            js: {
              summary: 'Create a JS record action under a details block owner target',
              value: examples.addRecordJsAction,
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
      'Creates multiple blocks sequentially under the same target. Each item may include `settings` or `template`, but raw `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Partial-success semantics apply: a failure in one item does not roll back the others. Results are returned in input order as `index/key/ok/result/error`, and each `error` always includes `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddBlocksRequest', examples.addBlocks),
    responses: responses('FlowSurfaceAddBlocksResult'),
  },
  addFields: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple fields sequentially under the same target',
    description: valuesCompatibilityNote(
      'Creates multiple fields sequentially under the same target. The request may either import one shared `template` or create explicit `fields[]`. Each item may include `settings`, and popup-capable fields may also include `popup` directly for local popup content or `popup.template` to reuse a saved popup template in `reference` / `copy` mode. Raw `wrapperProps` / `fieldProps` / `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Partial-success semantics apply: a failure in one item does not roll back the others. Results are returned in input order as `index/key/ok/result/error`, and each `error` always includes `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddFieldsRequest', examples.addFields),
    responses: responses('FlowSurfaceAddFieldsResult'),
  },
  addActions: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple non-record actions sequentially under the same target',
    description: valuesCompatibilityNote(
      'Creates multiple non-record actions sequentially under the same target. Each item may include `settings`, and popup-capable actions may also include `popup`, but raw `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Partial-success semantics apply. Record actions do not belong to this entry and should use `addRecordActions` instead. Each failed item always returns an `error` with `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddActionsRequest', examples.addActions),
    responses: responses('FlowSurfaceAddActionsResult'),
  },
  addRecordActions: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add multiple record actions sequentially under the same record-capable owner target',
    description: valuesCompatibilityNote(
      'Creates multiple record actions sequentially under the same target. The target must be a record-capable owner target, and the server resolves the canonical record-action container automatically. Do not pass internal container uids such as a table actions column or a list/gridCard item. Each item may include `settings`, and popup-capable actions may also include `popup`, but raw `props` / `decoratorProps` / `stepParams` / `flowRegistry` are not accepted. Partial-success semantics apply: a failure in one item does not roll back the others. Each failed item always returns an `error` with `message/type/code/status`.',
    ),
    requestBody: requestBody('FlowSurfaceAddRecordActionsRequest', examples.addRecordActions),
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
      'Executes `ops[]` in order and supports `opId` plus `{ref:"<opId>.<field>"}` references to earlier results. V1 only supports `atomic=true`.',
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
  FlowSurfaceMutateRef: {
    type: 'object',
    required: ['ref'],
    properties: {
      ref: {
        type: 'string',
        description: 'Reference to a previous mutate op result field, for example `page.tabSchemaUid`.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceResolvableString: {
    oneOf: [{ type: 'string' }, ref('FlowSurfaceMutateRef')],
  },
  FlowSurfaceResolvableIdentifier: {
    oneOf: [{ type: 'string' }, { type: 'integer' }, ref('FlowSurfaceMutateRef')],
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
  FlowSurfacePlanSelectorByRef: {
    type: 'object',
    required: ['ref'],
    properties: {
      ref: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfacePlanSelectorByLocator: {
    type: 'object',
    required: ['locator'],
    properties: {
      locator: ref('FlowSurfaceReadLocator'),
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
  FlowSurfaceSurfaceSelector: {
    oneOf: [ref('FlowSurfacePlanSelectorByRef'), ref('FlowSurfacePlanSelectorByLocator')],
  },
  FlowSurfacePlanSelector: {
    oneOf: [
      ref('FlowSurfacePlanSelectorByRef'),
      ref('FlowSurfacePlanSelectorByLocator'),
      ref('FlowSurfacePlanSelectorByStep'),
    ],
  },
  FlowSurfaceBindRef: {
    type: 'object',
    required: ['ref', 'locator'],
    properties: {
      ref: {
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
  FlowSurfaceRefInfo: {
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
  FlowSurfaceRefsMap: {
    type: 'object',
    additionalProperties: ref('FlowSurfaceRefInfo'),
  },
  FlowSurfaceResolvedSelectorSummary: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
      },
      uid: {
        type: 'string',
      },
      kind: {
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
  FlowSurfaceApplySpec: {
    type: 'object',
    properties: {
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
      bindRefs: {
        type: 'array',
        items: ref('FlowSurfaceBindRef'),
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
      refs: ref('FlowSurfaceRefsMap'),
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
        required: ['key'],
        properties: {
          key: {
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
          },
          fieldPath: {
            type: 'string',
          },
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
          popup: ref('FlowSurfaceComposeFieldPopup'),
        },
        additionalProperties: false,
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
  FlowSurfaceComposeActionPopup: {
    type: 'object',
    oneOf: [
      {
        required: ['template'],
      },
      {
        anyOf: [{ required: ['mode'] }, { required: ['blocks'] }, { required: ['layout'] }],
      },
    ],
    properties: {
      template: ref('FlowSurfacePopupTemplateRef'),
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
    oneOf: [
      {
        required: ['template'],
      },
      {
        anyOf: [{ required: ['mode'] }, { required: ['blocks'] }, { required: ['layout'] }],
      },
    ],
    properties: {
      template: ref('FlowSurfacePopupTemplateRef'),
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
          popup: ref('FlowSurfaceComposeActionPopup'),
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
        enum: [
          'table',
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
        ],
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
        description: 'Block-level actions. For table/list/gridCard, prefer block-wide collection actions here.',
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
        enum: [
          'table',
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
        ],
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
      keyToUid: ref('FlowSurfaceClientKeyMap'),
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockResult'),
      },
      layout: ref('FlowSurfaceSetLayoutResult'),
    },
    additionalProperties: false,
  },
  FlowSurfacePlanStep: {
    type: 'object',
    required: ['action'],
    properties: {
      id: {
        type: 'string',
      },
      action: {
        type: 'string',
        enum: [...FLOW_SURFACE_PLAN_STEP_ACTIONS],
      },
      selectors: {
        type: 'object',
        properties: {
          target: ref('FlowSurfacePlanSelector'),
          source: ref('FlowSurfacePlanSelector'),
        },
        additionalProperties: false,
      },
      values: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfacePlanDocument: {
    type: 'object',
    required: ['steps'],
    properties: {
      steps: {
        type: 'array',
        items: ref('FlowSurfacePlanStep'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfacePlanCompiledStep: {
    type: 'object',
    properties: {
      index: {
        type: 'integer',
      },
      id: {
        type: 'string',
      },
      action: {
        type: 'string',
        enum: [...FLOW_SURFACE_PLAN_STEP_ACTIONS],
      },
      resolvedSelectors: {
        type: 'object',
        properties: {
          target: ref('FlowSurfaceResolvedSelectorSummary'),
          source: ref('FlowSurfaceResolvedSelectorSummary'),
        },
        additionalProperties: false,
      },
      payload: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfacePlanResultItem: {
    type: 'object',
    properties: {
      index: {
        type: 'integer',
      },
      id: {
        type: 'string',
      },
      action: {
        type: 'string',
        enum: [...FLOW_SURFACE_PLAN_STEP_ACTIONS],
      },
      result: {},
    },
    additionalProperties: false,
  },
  FlowSurfacePersistedRefResult: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
      },
      uid: {
        type: 'string',
      },
      persisted: {
        type: 'boolean',
      },
      skipped: {
        type: 'string',
        enum: ['not_found'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceValidatePlanRequest: {
    type: 'object',
    required: ['plan'],
    properties: {
      surface: ref('FlowSurfaceSurfaceSelector'),
      expectedFingerprint: {
        type: 'string',
      },
      bindRefs: {
        type: 'array',
        items: ref('FlowSurfaceBindRef'),
      },
      plan: ref('FlowSurfacePlanDocument'),
    },
    additionalProperties: false,
  },
  FlowSurfaceValidatePlanResponse: {
    type: 'object',
    properties: {
      target: {
        allOf: [ref('FlowSurfaceReadTarget')],
        nullable: true,
      },
      fingerprint: {
        type: 'string',
        nullable: true,
      },
      refs: ref('FlowSurfaceRefsMap'),
      compiledSteps: {
        type: 'array',
        items: ref('FlowSurfacePlanCompiledStep'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceExecutePlanRequest: {
    allOf: [ref('FlowSurfaceValidatePlanRequest')],
  },
  FlowSurfaceExecutePlanResponse: {
    type: 'object',
    properties: {
      target: {
        allOf: [ref('FlowSurfaceReadTarget')],
        nullable: true,
      },
      fingerprintBefore: {
        type: 'string',
        nullable: true,
      },
      surfaceExistsAfterExecute: {
        type: 'boolean',
        nullable: true,
      },
      refs: ref('FlowSurfaceRefsMap'),
      compiledSteps: {
        type: 'array',
        items: ref('FlowSurfacePlanCompiledStep'),
      },
      results: {
        type: 'array',
        items: ref('FlowSurfacePlanResultItem'),
      },
      persistedRefs: {
        type: 'array',
        items: ref('FlowSurfacePersistedRefResult'),
      },
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
        enum: [
          'table',
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
        ],
      },
      use: {
        type: 'string',
      },
      template: ref('FlowSurfaceBlockTemplateRef'),
      resource: ref('FlowSurfaceBlockResourceInput'),
      resourceInit: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
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
      fieldUse: {
        type: 'string',
        description: 'Optional compatibility check. The server infers the actual field use from catalog capabilities.',
      },
      defaultTargetUid: {
        type: 'string',
      },
      targetBlockUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
        description: 'Legacy alias used by filter-form target selection. This is not the same field as `target.uid`.',
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
        enum: [
          'table',
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
        ],
      },
      use: {
        type: 'string',
      },
      template: ref('FlowSurfaceBlockTemplateRef'),
      resource: ref('FlowSurfaceBlockResourceInput'),
      resourceInit: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
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
      fieldUse: {
        type: 'string',
      },
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
          'Business payload for the corresponding `/flowSurfaces:<type>` action. Nested refs must use `{ ref: "<opId>.<path>" }`.',
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
