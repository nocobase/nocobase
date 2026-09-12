/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { FlowSurfaceErrorItemInput } from '../errors';
import { throwAggregateBadRequest } from '../errors';
import { normalizeComposeFieldSpec, normalizeFlowSurfaceComposeKey } from '../service-utils';
import { FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES } from './blueprint';
import { APPROVAL_ACTION_CATALOG_SPECS, APPROVAL_BLOCK_CATALOG_SPECS } from './catalog-specs';
import { APPROVAL_SINGLETON_ACTION_USES } from './runtime-config';

type ApprovalBlueprintSurface = (typeof FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES)[number];

type ApprovalBlueprintActionSpec = {
  key?: unknown;
  type?: unknown;
  use?: unknown;
  fieldUse?: unknown;
  stepParams?: unknown;
  props?: unknown;
  decoratorProps?: unknown;
  flowRegistry?: unknown;
};

type ApprovalBlueprintBlockSpec = {
  key?: unknown;
  type?: unknown;
  template?: unknown;
  resource?: unknown;
  resourceInit?: unknown;
  fields?: unknown;
  settings?: unknown;
  actions?: unknown;
  use?: unknown;
  fieldUse?: unknown;
  stepParams?: unknown;
  props?: unknown;
  decoratorProps?: unknown;
  flowRegistry?: unknown;
};

type ApprovalBlueprintPayload = {
  version?: unknown;
  mode?: unknown;
  surface?: unknown;
  workflowId?: unknown;
  nodeId?: unknown;
  blocks?: unknown;
  fields?: unknown;
  layout?: unknown;
};

type NormalizedApprovalBlueprintItem = {
  key?: string;
  target?: string;
};

const APPROVAL_SURFACE_SET = new Set<string>(FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES);
const APPROVAL_ACTION_USE_BY_PUBLIC_KEY = new Map(
  APPROVAL_ACTION_CATALOG_SPECS.map((item) => [item.publicKey, item.use]),
);
const APPROVAL_ACTION_PUBLIC_KEYS_BY_USE = new Map(
  APPROVAL_ACTION_CATALOG_SPECS.map((item) => [item.use, item.publicKey]),
);
const APPROVAL_BLOCK_PUBLIC_KEY_SET = new Set(APPROVAL_BLOCK_CATALOG_SPECS.map((item) => item.key));
const APPROVAL_BLOCK_ALLOWED_CONTAINER_USES_BY_PUBLIC_KEY = new Map(
  APPROVAL_BLOCK_CATALOG_SPECS.map((item) => [item.key, item.allowedContainerUses]),
);
const APPROVAL_PAGE_GRID_USE_BY_SURFACE: Partial<Record<ApprovalBlueprintSurface, string>> = {
  initiator: 'TriggerBlockGridModel',
  approver: 'ApprovalBlockGridModel',
};
const APPROVAL_DEFAULT_ACTION_PUBLIC_KEYS_BY_BLOCK_TYPE = new Map<string, Set<string>>([
  ['approvalInitiator', new Set(['approvalSubmit'])],
]);
const APPROVAL_ALLOWED_ACTION_PUBLIC_KEYS_BY_BLOCK_TYPE = new Map(
  APPROVAL_BLOCK_CATALOG_SPECS.map((block) => [
    block.key,
    new Set(
      APPROVAL_ACTION_CATALOG_SPECS.filter((action) => action.allowedContainerUses.includes(block.use)).map(
        (action) => action.publicKey,
      ),
    ),
  ]),
);
const COMPOSE_RAW_BLOCK_KEYS: Array<keyof ApprovalBlueprintBlockSpec> = [
  'use',
  'fieldUse',
  'stepParams',
  'props',
  'decoratorProps',
  'flowRegistry',
];
const COMPOSE_RAW_ACTION_KEYS: Array<keyof ApprovalBlueprintActionSpec> = [
  'use',
  'fieldUse',
  'stepParams',
  'props',
  'decoratorProps',
  'flowRegistry',
];

function buildAuthoringError(input: {
  path: string;
  ruleId: string;
  message: string;
  details?: Record<string, unknown>;
}): FlowSurfaceErrorItemInput {
  return {
    path: input.path,
    ruleId: input.ruleId,
    message: input.message,
    details: {
      retryAction: 'fix_payload_and_retry_same_applyApprovalBlueprint_write',
      ...(input.details || {}),
    },
  };
}

function normalizeOptionalBindingId(value: unknown) {
  if (_.isUndefined(value) || _.isNull(value) || String(value).trim() === '') {
    return {
      present: false,
      valid: true,
    };
  }
  if (typeof value === 'number') {
    return {
      present: true,
      valid: Number.isFinite(value),
    };
  }
  return {
    present: true,
    valid: /^\d+$/.test(String(value).trim()),
  };
}

function getSurface(value: unknown): ApprovalBlueprintSurface | undefined {
  const normalized = String(value || '').trim();
  return APPROVAL_SURFACE_SET.has(normalized) ? (normalized as ApprovalBlueprintSurface) : undefined;
}

function readActionType(action: unknown) {
  if (typeof action === 'string') {
    return String(action || '').trim();
  }
  if (_.isPlainObject(action)) {
    return String((action as ApprovalBlueprintActionSpec).type || '').trim();
  }
  return '';
}

function readActionKey(action: unknown, actionType: string) {
  if (_.isPlainObject(action)) {
    const key = String((action as ApprovalBlueprintActionSpec).key || '').trim();
    return key || actionType;
  }
  return actionType;
}

function readErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function collectThrownAuthoringError<T>(
  errors: FlowSurfaceErrorItemInput[],
  input: {
    path: string;
    ruleId: string;
    details?: Record<string, unknown>;
  },
  run: () => T,
) {
  try {
    return run();
  } catch (error) {
    errors.push(
      buildAuthoringError({
        path: input.path,
        ruleId: input.ruleId,
        message: readErrorMessage(error),
        details: input.details,
      }),
    );
    return undefined;
  }
}

function collectTopLevelShapeErrors(payload: ApprovalBlueprintPayload, errors: FlowSurfaceErrorItemInput[]) {
  const version = _.isUndefined(payload.version) ? '1' : String(payload.version || '').trim();
  if (version !== '1') {
    errors.push(
      buildAuthoringError({
        path: '$.version',
        ruleId: 'approval-blueprint-version-unsupported',
        message: "flowSurfaces applyApprovalBlueprint only supports version '1'",
        details: {
          invalidVersion: payload.version,
          suggestedFix: "Set version to '1' or omit it.",
        },
      }),
    );
  }

  const mode = _.isUndefined(payload.mode) ? 'replace' : String(payload.mode || '').trim();
  if (mode !== 'replace') {
    errors.push(
      buildAuthoringError({
        path: '$.mode',
        ruleId: 'approval-blueprint-mode-unsupported',
        message: "flowSurfaces applyApprovalBlueprint only supports mode 'replace'",
        details: {
          invalidMode: payload.mode,
          suggestedFix: "Set mode to 'replace' or omit it.",
        },
      }),
    );
  }

  const surface = getSurface(payload.surface);
  if (!surface) {
    errors.push(
      buildAuthoringError({
        path: '$.surface',
        ruleId: 'approval-blueprint-surface-invalid',
        message: `flowSurfaces applyApprovalBlueprint surface must be one of ${FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES.map(
          (item) => `'${item}'`,
        ).join(', ')}`,
        details: {
          invalidSurface: payload.surface,
          allowedSurfaces: FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES,
          suggestedFix: "Use surface 'initiator', 'approver', or 'taskCard'.",
        },
      }),
    );
  }

  if (!_.isUndefined(payload.layout) && !_.isPlainObject(payload.layout)) {
    errors.push(
      buildAuthoringError({
        path: '$.layout',
        ruleId: 'approval-blueprint-layout-shape',
        message: 'flowSurfaces applyApprovalBlueprint layout must be an object',
        details: {
          suggestedFix: 'Pass a layout object such as { rows: [[...]] }, or omit layout.',
        },
      }),
    );
  }

  return surface;
}

function collectBindingErrors(
  payload: ApprovalBlueprintPayload,
  surface: ApprovalBlueprintSurface | undefined,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!surface) {
    return;
  }

  const workflowId = normalizeOptionalBindingId(payload.workflowId);
  const nodeId = normalizeOptionalBindingId(payload.nodeId);

  if (workflowId.present && !workflowId.valid) {
    errors.push(
      buildAuthoringError({
        path: '$.workflowId',
        ruleId: 'approval-blueprint-workflow-id-invalid',
        message: 'flowSurfaces applyApprovalBlueprint workflowId must be an integer identifier',
        details: {
          invalidWorkflowId: payload.workflowId,
          suggestedFix:
            'Pass an integer workflowId, or remove workflowId when the selected surface does not accept it.',
        },
      }),
    );
  }

  if (nodeId.present && !nodeId.valid) {
    errors.push(
      buildAuthoringError({
        path: '$.nodeId',
        ruleId: 'approval-blueprint-node-id-invalid',
        message: 'flowSurfaces applyApprovalBlueprint nodeId must be an integer identifier',
        details: {
          invalidNodeId: payload.nodeId,
          suggestedFix: 'Pass an integer nodeId, or remove nodeId when the selected surface does not accept it.',
        },
      }),
    );
  }

  if (surface === 'initiator') {
    if (!workflowId.present) {
      errors.push(
        buildAuthoringError({
          path: '$.workflowId',
          ruleId: 'approval-initiator-workflow-id-required',
          message: "flowSurfaces applyApprovalBlueprint surface 'initiator' requires workflowId",
          details: {
            surface,
            suggestedFix: 'Pass workflowId for initiator surfaces.',
          },
        }),
      );
    }
    if (nodeId.present) {
      errors.push(
        buildAuthoringError({
          path: '$.nodeId',
          ruleId: 'approval-initiator-node-id-forbidden',
          message: "flowSurfaces applyApprovalBlueprint surface 'initiator' does not accept nodeId",
          details: {
            surface,
            suggestedFix: 'Remove nodeId; initiator surfaces bind to the workflow trigger by workflowId.',
          },
        }),
      );
    }
    if (!_.isUndefined(payload.fields)) {
      errors.push(
        buildAuthoringError({
          path: '$.fields',
          ruleId: 'approval-page-fields-forbidden',
          message: "flowSurfaces applyApprovalBlueprint surface 'initiator' does not accept fields",
          details: {
            surface,
            suggestedFix: 'Use blocks[].fields for initiator form fields.',
          },
        }),
      );
    }
    return;
  }

  if (surface === 'approver') {
    if (!nodeId.present) {
      errors.push(
        buildAuthoringError({
          path: '$.nodeId',
          ruleId: 'approval-approver-node-id-required',
          message: "flowSurfaces applyApprovalBlueprint surface 'approver' requires nodeId",
          details: {
            surface,
            suggestedFix: 'Pass nodeId for approver surfaces.',
          },
        }),
      );
    }
    if (workflowId.present) {
      errors.push(
        buildAuthoringError({
          path: '$.workflowId',
          ruleId: 'approval-approver-workflow-id-forbidden',
          message: "flowSurfaces applyApprovalBlueprint surface 'approver' does not accept workflowId",
          details: {
            surface,
            suggestedFix: 'Remove workflowId; approver surfaces bind to one approval node by nodeId.',
          },
        }),
      );
    }
    if (!_.isUndefined(payload.fields)) {
      errors.push(
        buildAuthoringError({
          path: '$.fields',
          ruleId: 'approval-page-fields-forbidden',
          message: "flowSurfaces applyApprovalBlueprint surface 'approver' does not accept fields",
          details: {
            surface,
            suggestedFix: 'Use blocks[].fields for approver form/details fields.',
          },
        }),
      );
    }
    return;
  }

  if (workflowId.present === nodeId.present) {
    errors.push(
      buildAuthoringError({
        path: '$',
        ruleId: 'approval-task-card-binding-exclusive',
        message: "flowSurfaces applyApprovalBlueprint surface 'taskCard' requires exactly one of workflowId or nodeId",
        details: {
          surface,
          suggestedFix:
            'Pass exactly one binding id: workflowId for submitter task cards, or nodeId for approver task cards.',
        },
      }),
    );
  }
  if (!_.isUndefined(payload.blocks)) {
    errors.push(
      buildAuthoringError({
        path: '$.blocks',
        ruleId: 'approval-task-card-blocks-forbidden',
        message: "flowSurfaces applyApprovalBlueprint surface 'taskCard' does not accept blocks",
        details: {
          surface,
          suggestedFix: 'Use fields + layout for taskCard surfaces instead of blocks.',
        },
      }),
    );
  }
}

function collectCollectionShapeErrors(
  payload: ApprovalBlueprintPayload,
  surface: ApprovalBlueprintSurface | undefined,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (surface === 'initiator' || surface === 'approver') {
    if (!_.isUndefined(payload.blocks) && !Array.isArray(payload.blocks)) {
      errors.push(
        buildAuthoringError({
          path: '$.blocks',
          ruleId: 'approval-blueprint-blocks-shape',
          message: 'flowSurfaces applyApprovalBlueprint blocks must be an array',
          details: {
            surface,
            suggestedFix: 'Pass blocks as an array, or omit blocks.',
          },
        }),
      );
      return;
    }
    const blockKeys = new Map<string, number>();
    const normalizedBlocks: NormalizedApprovalBlueprintItem[] = [];
    _.castArray(payload.blocks || []).forEach((block, index) => {
      if (!_.isPlainObject(block)) {
        errors.push(
          buildAuthoringError({
            path: `$.blocks[${index}]`,
            ruleId: 'approval-blueprint-block-shape',
            message: `flowSurfaces applyApprovalBlueprint blocks[${index}] must be an object`,
            details: {
              surface,
              blockIndex: index,
              suggestedFix: 'Pass each block as an object with key and type/template.',
            },
          }),
        );
        return;
      }
      const normalizedBlock = collectBlockIdentityErrors(
        block as ApprovalBlueprintBlockSpec,
        index,
        surface,
        blockKeys,
        errors,
      );
      if (normalizedBlock) {
        normalizedBlocks.push(normalizedBlock);
      }
      collectBlockPublicShapeErrors(block as ApprovalBlueprintBlockSpec, index, surface, errors);
      collectBlockFieldErrors(block as ApprovalBlueprintBlockSpec, index, surface, errors);
      collectBlockSurfaceErrors(block as ApprovalBlueprintBlockSpec, index, surface, errors);
      collectBlockActionErrors(block as ApprovalBlueprintBlockSpec, index, surface, errors);
    });
    collectLayoutReferenceErrors({
      layout: payload.layout,
      itemKeys: new Set(normalizedBlocks.map((item) => item.key).filter((key): key is string => !!key)),
      path: '$.layout',
      surface,
      itemKind: 'block',
      errors,
    });
    return;
  }

  if (surface === 'taskCard') {
    const normalizedFields = collectFieldListErrors({
      input: payload.fields,
      path: '$.fields',
      surface,
      context: 'flowSurfaces applyApprovalBlueprint taskCard fields',
      disallowTarget: true,
      errors,
    });
    collectLayoutReferenceErrors({
      layout: payload.layout,
      itemKeys: new Set(normalizedFields.map((field) => field.key).filter((key): key is string => !!key)),
      path: '$.layout',
      surface,
      itemKind: 'field',
      errors,
    });
  }
}

function collectBlockIdentityErrors(
  block: ApprovalBlueprintBlockSpec,
  blockIndex: number,
  surface: ApprovalBlueprintSurface,
  seenKeys: Map<string, number>,
  errors: FlowSurfaceErrorItemInput[],
) {
  const path = `$.blocks[${blockIndex}]`;
  const key = collectThrownAuthoringError(
    errors,
    {
      path: `${path}.key`,
      ruleId: 'approval-blueprint-block-key-invalid',
      details: {
        surface,
        blockIndex,
        suggestedFix: 'Provide a non-empty, unique block key.',
      },
    },
    () => normalizeFlowSurfaceComposeKey(block.key, `flowSurfaces compose block #${blockIndex + 1}`),
  );
  const type = String(block.type || '').trim();
  const hasTemplate = !_.isUndefined(block.template);
  if (!type && !hasTemplate) {
    errors.push(
      buildAuthoringError({
        path,
        ruleId: 'approval-blueprint-block-type-or-template-required',
        message: `flowSurfaces compose block #${blockIndex + 1} requires key and either type or template`,
        details: {
          surface,
          blockIndex,
          suggestedFix: 'Set either block.type or block.template.',
        },
      }),
    );
  }
  if (!key) {
    return undefined;
  }
  const previousIndex = seenKeys.get(key);
  if (typeof previousIndex !== 'undefined') {
    errors.push(
      buildAuthoringError({
        path: `${path}.key`,
        ruleId: 'approval-blueprint-block-key-duplicate',
        message: `flowSurfaces compose blocks key '${key}' is duplicated at #${previousIndex + 1} and #${
          blockIndex + 1
        }`,
        details: {
          surface,
          key,
          firstIndex: previousIndex,
          duplicateIndex: blockIndex,
          suggestedFix: 'Use a unique key for each block and update layout references accordingly.',
        },
      }),
    );
    return undefined;
  }
  seenKeys.set(key, blockIndex);
  return {
    key,
  };
}

function collectBlockPublicShapeErrors(
  block: ApprovalBlueprintBlockSpec,
  blockIndex: number,
  surface: ApprovalBlueprintSurface,
  errors: FlowSurfaceErrorItemInput[],
) {
  const rawKey = COMPOSE_RAW_BLOCK_KEYS.find((key) => !_.isUndefined(block[key]));
  if (rawKey) {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].${rawKey}`,
        ruleId: 'approval-blueprint-block-public-fields-only',
        message: 'flowSurfaces compose only accepts public semantic block fields',
        details: {
          surface,
          blockIndex,
          rawKey,
          suggestedFix: 'Remove raw FlowModel fields and use public block settings/fields/actions instead.',
        },
      }),
    );
  }

  if (!_.isUndefined(block.template) && !_.isPlainObject(block.template)) {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].template`,
        ruleId: 'approval-blueprint-block-template-shape',
        message: `flowSurfaces compose block #${blockIndex + 1} template must be an object`,
        details: {
          surface,
          blockIndex,
          suggestedFix: 'Use template: { uid, mode } or remove template.',
        },
      }),
    );
    return;
  }

  if (!_.isPlainObject(block.template)) {
    return;
  }

  const template = block.template as { mode?: unknown; uid?: unknown; usage?: unknown };
  const templateUid = String(template.uid || '').trim();
  if (!templateUid) {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].template.uid`,
        ruleId: 'approval-blueprint-block-template-uid-required',
        message: 'flowSurfaces compose template.uid is required',
        details: {
          surface,
          blockIndex,
          suggestedFix: 'Set template.uid to the saved block template uid.',
        },
      }),
    );
  }

  const templateMode = String(template.mode || 'reference').trim() || 'reference';
  if (templateMode !== 'reference' && templateMode !== 'copy') {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].template.mode`,
        ruleId: 'approval-blueprint-block-template-mode-unsupported',
        message: "flowSurfaces compose template.mode only supports 'reference' or 'copy'",
        details: {
          surface,
          blockIndex,
          mode: template.mode,
          suggestedFix: "Use template.mode 'reference' or 'copy'.",
        },
      }),
    );
  }

  const templateUsage = String(template.usage || 'block').trim() || 'block';
  if (templateUsage !== 'block' && templateUsage !== 'fields') {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].template.usage`,
        ruleId: 'approval-blueprint-block-template-usage-unsupported',
        message: "flowSurfaces compose template.usage only supports 'block' or 'fields'",
        details: {
          surface,
          blockIndex,
          usage: template.usage,
          suggestedFix: "Use template.usage 'block' or 'fields', or omit usage.",
        },
      }),
    );
  }

  if (templateUsage === 'block') {
    const conflictKey = (['type', 'use', 'resource', 'resourceInit'] as Array<keyof ApprovalBlueprintBlockSpec>).find(
      (key) => !_.isUndefined(block[key]),
    );
    if (conflictKey) {
      errors.push(
        buildAuthoringError({
          path: `$.blocks[${blockIndex}].${conflictKey}`,
          ruleId: 'approval-blueprint-block-template-block-conflict',
          message: "flowSurfaces addBlock template.usage='block' does not allow type, use, resource or resourceInit",
          details: {
            surface,
            blockIndex,
            conflictKey,
            suggestedFix:
              "Remove type/resource/resourceInit when using template.usage='block', or use template.usage='fields' when importing only fields into a concrete block.",
          },
        }),
      );
    }
  }

  if (templateUsage === 'fields') {
    const conflictKey = (['resource', 'resourceInit'] as Array<keyof ApprovalBlueprintBlockSpec>).find(
      (key) => !_.isUndefined(block[key]),
    );
    if (conflictKey) {
      errors.push(
        buildAuthoringError({
          path: `$.blocks[${blockIndex}].${conflictKey}`,
          ruleId: 'approval-blueprint-block-template-fields-resource-conflict',
          message: "flowSurfaces addBlock template.usage='fields' does not allow resource or resourceInit overrides",
          details: {
            surface,
            blockIndex,
            conflictKey,
            suggestedFix: "Remove resource/resourceInit when using template.usage='fields'.",
          },
        }),
      );
    }
  }

  if (templateUsage === 'fields' && _.castArray(block.fields || []).length) {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].fields`,
        ruleId: 'approval-blueprint-block-template-fields-mixed',
        message: `flowSurfaces compose block #${blockIndex + 1} cannot mix template.usage='fields' with fields[]`,
        details: {
          surface,
          blockIndex,
          suggestedFix: "Remove fields[] when using template.usage='fields'.",
        },
      }),
    );
  }

  if (templateMode !== 'copy' && _.isPlainObject(block.settings) && Object.keys(block.settings).length) {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].settings`,
        ruleId: 'approval-blueprint-block-template-reference-settings',
        message: `flowSurfaces compose block #${
          blockIndex + 1
        } does not allow settings when template.mode is 'reference'`,
        details: {
          surface,
          blockIndex,
          suggestedFix: "Use template.mode='copy' when overriding settings, or remove settings.",
        },
      }),
    );
  }
}

function collectBlockFieldErrors(
  block: ApprovalBlueprintBlockSpec,
  blockIndex: number,
  surface: ApprovalBlueprintSurface,
  errors: FlowSurfaceErrorItemInput[],
) {
  collectFieldListErrors({
    input: (block as { fields?: unknown }).fields,
    path: `$.blocks[${blockIndex}].fields`,
    surface,
    context: `flowSurfaces compose block #${blockIndex + 1} fields`,
    disallowTarget: false,
    errors,
  });
}

function collectFieldListErrors(input: {
  input: unknown;
  path: string;
  surface: ApprovalBlueprintSurface;
  context: string;
  disallowTarget: boolean;
  errors: FlowSurfaceErrorItemInput[];
}) {
  if (_.isUndefined(input.input)) {
    return [];
  }
  if (!Array.isArray(input.input)) {
    input.errors.push(
      buildAuthoringError({
        path: input.path,
        ruleId: 'approval-blueprint-fields-shape',
        message: 'flowSurfaces applyApprovalBlueprint fields must be an array',
        details: {
          surface: input.surface,
          suggestedFix: 'Pass fields as an array, or omit fields.',
        },
      }),
    );
    return [];
  }

  const seenKeys = new Map<string, number>();
  const normalizedFields: NormalizedApprovalBlueprintItem[] = [];
  input.input.forEach((field, fieldIndex) => {
    const normalizedField = collectThrownAuthoringError(
      input.errors,
      {
        path: `${input.path}[${fieldIndex}]`,
        ruleId: 'approval-blueprint-field-invalid',
        details: {
          surface: input.surface,
          fieldIndex,
          suggestedFix: 'Use a non-empty field path string or a public field object with fieldPath/type.',
        },
      },
      () => normalizeComposeFieldSpec(field, fieldIndex),
    );
    if (!normalizedField) {
      return;
    }
    if (input.disallowTarget && normalizedField.target) {
      input.errors.push(
        buildAuthoringError({
          path: `${input.path}[${fieldIndex}].target`,
          ruleId: 'approval-task-card-field-target-forbidden',
          message: 'flowSurfaces applyApprovalBlueprint taskCard fields do not support target',
          details: {
            surface: input.surface,
            fieldIndex,
            target: normalizedField.target,
            suggestedFix: 'Remove target from taskCard fields; every field is added to the task-card details grid.',
          },
        }),
      );
    }
    const key = normalizedField.key;
    const previousIndex = seenKeys.get(key);
    if (typeof previousIndex !== 'undefined') {
      input.errors.push(
        buildAuthoringError({
          path: `${input.path}[${fieldIndex}]`,
          ruleId: 'approval-blueprint-field-key-duplicate',
          message: `${input.context} key '${key}' is duplicated at #${previousIndex + 1} and #${fieldIndex + 1}`,
          details: {
            surface: input.surface,
            key,
            firstIndex: previousIndex,
            duplicateIndex: fieldIndex,
            suggestedFix: 'Use a unique key for each field and update layout references accordingly.',
          },
        }),
      );
      return;
    }
    seenKeys.set(key, fieldIndex);
    normalizedFields.push(normalizedField);
  });
  return normalizedFields;
}

function collectLayoutReferenceErrors(input: {
  layout?: unknown;
  itemKeys: Set<string>;
  path: string;
  surface: ApprovalBlueprintSurface;
  itemKind: 'block' | 'field';
  errors: FlowSurfaceErrorItemInput[];
}) {
  if (!_.isPlainObject(input.layout)) {
    return;
  }
  const rows = (input.layout as { rows?: unknown }).rows;
  if (_.isUndefined(rows)) {
    return;
  }
  if (!Array.isArray(rows)) {
    input.errors.push(
      buildAuthoringError({
        path: `${input.path}.rows`,
        ruleId: 'approval-blueprint-layout-rows-shape',
        message: 'flowSurfaces compose layout rows must be an array',
        details: {
          surface: input.surface,
          suggestedFix: 'Use layout.rows as an array of non-empty rows.',
        },
      }),
    );
    return;
  }
  const mentionedKeys = new Map<string, { rowIndex: number; cellIndex: number }>();
  rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || !row.length) {
      input.errors.push(
        buildAuthoringError({
          path: `${input.path}.rows[${rowIndex}]`,
          ruleId: 'approval-blueprint-layout-row-shape',
          message: `flowSurfaces compose layout row #${rowIndex + 1} must be a non-empty array`,
          details: {
            surface: input.surface,
            rowIndex,
            suggestedFix: 'Use each layout row as a non-empty array of block/field keys.',
          },
        }),
      );
      return;
    }
    row.forEach((cell, cellIndex) =>
      collectLayoutCellReferenceErrors({
        cell,
        itemKeys: input.itemKeys,
        mentionedKeys,
        path: `${input.path}.rows[${rowIndex}][${cellIndex}]`,
        surface: input.surface,
        itemKind: input.itemKind,
        rowIndex,
        cellIndex,
        errors: input.errors,
      }),
    );
  });
}

function collectLayoutCellReferenceErrors(input: {
  cell: unknown;
  itemKeys: Set<string>;
  mentionedKeys: Map<string, { rowIndex: number; cellIndex: number }>;
  path: string;
  surface: ApprovalBlueprintSurface;
  itemKind: 'block' | 'field';
  rowIndex: number;
  cellIndex: number;
  errors: FlowSurfaceErrorItemInput[];
}) {
  if (_.isPlainObject(input.cell)) {
    const cell = input.cell as { composeKey?: unknown; key?: unknown; uid?: unknown };
    const key = String(cell.composeKey || cell.key || '').trim();
    if (!key) {
      input.errors.push(
        buildAuthoringError({
          path: input.path,
          ruleId: 'approval-blueprint-layout-cell-key-empty',
          message: `flowSurfaces compose layout row #${input.rowIndex + 1} contains an empty key`,
          details: {
            surface: input.surface,
            rowIndex: input.rowIndex,
            cellIndex: input.cellIndex,
            suggestedFix: 'Use a non-empty key/composeKey, or a uid for an existing item.',
          },
        }),
      );
      return;
    }
    collectLayoutKeyReferenceError({ ...input, key });
    return;
  }

  const key = String(input.cell || '').trim();
  if (!key) {
    input.errors.push(
      buildAuthoringError({
        path: input.path,
        ruleId: 'approval-blueprint-layout-cell-key-empty',
        message: `flowSurfaces compose layout row #${input.rowIndex + 1} contains an empty key`,
        details: {
          surface: input.surface,
          rowIndex: input.rowIndex,
          cellIndex: input.cellIndex,
          suggestedFix: 'Use a non-empty block or field key.',
        },
      }),
    );
    return;
  }
  collectLayoutKeyReferenceError({ ...input, key });
}

function collectLayoutKeyReferenceError(input: {
  key: string;
  itemKeys: Set<string>;
  mentionedKeys: Map<string, { rowIndex: number; cellIndex: number }>;
  path: string;
  surface: ApprovalBlueprintSurface;
  itemKind: 'block' | 'field';
  rowIndex: number;
  cellIndex: number;
  errors: FlowSurfaceErrorItemInput[];
}) {
  const previous = input.mentionedKeys.get(input.key);
  if (previous) {
    input.errors.push(
      buildAuthoringError({
        path: input.path,
        ruleId: 'approval-blueprint-layout-key-duplicate',
        message: `flowSurfaces compose layout key '${input.key}' is duplicated`,
        details: {
          surface: input.surface,
          rowIndex: input.rowIndex,
          cellIndex: input.cellIndex,
          key: input.key,
          firstRowIndex: previous.rowIndex,
          firstCellIndex: previous.cellIndex,
          suggestedFix: 'Reference each block or field key at most once in layout.rows.',
        },
      }),
    );
    return;
  }
  input.mentionedKeys.set(input.key, {
    rowIndex: input.rowIndex,
    cellIndex: input.cellIndex,
  });
  if (input.itemKeys.has(input.key)) {
    return;
  }
  input.errors.push(
    buildAuthoringError({
      path: input.path,
      ruleId: 'approval-blueprint-layout-key-unknown',
      message: `flowSurfaces compose layout key '${input.key}' does not match a created ${input.itemKind} key`,
      details: {
        surface: input.surface,
        rowIndex: input.rowIndex,
        cellIndex: input.cellIndex,
        key: input.key,
        itemKind: input.itemKind,
        availableKeys: Array.from(input.itemKeys),
        suggestedFix: `Reference an existing ${input.itemKind} key from this applyApprovalBlueprint payload, or remove the layout cell.`,
      },
    }),
  );
}

function collectBlockSurfaceErrors(
  block: ApprovalBlueprintBlockSpec,
  blockIndex: number,
  surface: ApprovalBlueprintSurface,
  errors: FlowSurfaceErrorItemInput[],
) {
  const blockType = String(block.type || '').trim();
  const expectedGridUse = APPROVAL_PAGE_GRID_USE_BY_SURFACE[surface];
  const allowedContainerUses = APPROVAL_BLOCK_ALLOWED_CONTAINER_USES_BY_PUBLIC_KEY.get(blockType);
  if (!blockType || !expectedGridUse || !allowedContainerUses || allowedContainerUses.includes(expectedGridUse)) {
    return;
  }

  errors.push(
    buildAuthoringError({
      path: `$.blocks[${blockIndex}].type`,
      ruleId: 'approval-block-not-allowed-for-surface',
      message: `flowSurfaces applyApprovalBlueprint block '${blockType}' is not allowed on surface '${surface}'`,
      details: {
        surface,
        blockIndex,
        blockType,
        expectedContainerUse: expectedGridUse,
        allowedContainerUses,
        suggestedFix:
          'Use an approval block type that is available for this surface, or move the block to the matching approval surface.',
      },
    }),
  );
}

function collectBlockActionErrors(
  block: ApprovalBlueprintBlockSpec,
  blockIndex: number,
  surface: ApprovalBlueprintSurface,
  errors: FlowSurfaceErrorItemInput[],
) {
  const blockType = String(block.type || '').trim();
  const actionsPath = `$.blocks[${blockIndex}].actions`;
  if (_.isUndefined(block.actions)) {
    return;
  }
  if (!Array.isArray(block.actions)) {
    errors.push(
      buildAuthoringError({
        path: actionsPath,
        ruleId: 'approval-blueprint-actions-shape',
        message: `flowSurfaces applyApprovalBlueprint blocks[${blockIndex}].actions must be an array`,
        details: {
          surface,
          blockIndex,
          blockType,
          suggestedFix: 'Pass actions as an array of approval action keys or action objects.',
        },
      }),
    );
    return;
  }
  if (!blockType) {
    errors.push(
      buildAuthoringError({
        path: `$.blocks[${blockIndex}].type`,
        ruleId: 'approval-blueprint-actions-require-block-type',
        message: `flowSurfaces applyApprovalBlueprint blocks[${blockIndex}] requires type when actions are provided`,
        details: {
          surface,
          blockIndex,
          suggestedFix: 'Set an approval block type before declaring actions, or remove actions from template blocks.',
        },
      }),
    );
    return;
  }
  if (!APPROVAL_BLOCK_PUBLIC_KEY_SET.has(blockType)) {
    return;
  }

  const defaultActions = APPROVAL_DEFAULT_ACTION_PUBLIC_KEYS_BY_BLOCK_TYPE.get(blockType) || new Set<string>();
  const allowedActions = APPROVAL_ALLOWED_ACTION_PUBLIC_KEYS_BY_BLOCK_TYPE.get(blockType) || new Set<string>();
  const seenSingletonActions = new Map<string, number>();
  const seenActionKeys = new Map<string, number>();

  block.actions.forEach((action, actionIndex) => {
    const actionPath = `${actionsPath}[${actionIndex}]`;
    if (typeof action !== 'string' && !_.isPlainObject(action)) {
      errors.push(
        buildAuthoringError({
          path: actionPath,
          ruleId: 'approval-blueprint-action-shape',
          message: `flowSurfaces applyApprovalBlueprint blocks[${blockIndex}].actions[${actionIndex}] must be a string or object`,
          details: {
            surface,
            blockIndex,
            actionIndex,
            suggestedFix: 'Use an approval action key string, or an object with type/settings.',
          },
        }),
      );
      return;
    }
    if (_.isPlainObject(action)) {
      const rawKey = COMPOSE_RAW_ACTION_KEYS.find(
        (key) => !_.isUndefined((action as ApprovalBlueprintActionSpec)[key]),
      );
      if (rawKey) {
        errors.push(
          buildAuthoringError({
            path: `${actionPath}.${rawKey}`,
            ruleId: 'approval-blueprint-action-public-fields-only',
            message: 'flowSurfaces compose action only accepts public semantic action fields',
            details: {
              surface,
              blockIndex,
              actionIndex,
              rawKey,
              suggestedFix: 'Remove raw FlowModel fields and use public action settings instead.',
            },
          }),
        );
        return;
      }
    }

    const actionType = readActionType(action);
    if (!actionType) {
      errors.push(
        buildAuthoringError({
          path: actionPath,
          ruleId: 'approval-blueprint-action-type-required',
          message: `flowSurfaces applyApprovalBlueprint blocks[${blockIndex}].actions[${actionIndex}] requires type`,
          details: {
            surface,
            blockIndex,
            actionIndex,
            suggestedFix: 'Use a non-empty approval action type.',
          },
        }),
      );
      return;
    }

    const actionKey = collectThrownAuthoringError(
      errors,
      {
        path: _.isPlainObject(action) ? `${actionPath}.key` : actionPath,
        ruleId: 'approval-blueprint-action-key-invalid',
        details: {
          surface,
          blockIndex,
          actionIndex,
          suggestedFix: 'Use a non-empty, unique action key.',
        },
      },
      () =>
        normalizeFlowSurfaceComposeKey(
          readActionKey(action, actionType),
          `flowSurfaces compose action #${actionIndex + 1}`,
        ),
    );
    if (!actionKey) {
      return;
    }
    const previousActionKeyIndex = seenActionKeys.get(actionKey);
    if (typeof previousActionKeyIndex !== 'undefined') {
      errors.push(
        buildAuthoringError({
          path: _.isPlainObject(action) ? `${actionPath}.key` : actionPath,
          ruleId: 'approval-blueprint-action-key-duplicate',
          message: `flowSurfaces compose block #${blockIndex + 1} actions key '${actionKey}' is duplicated at #${
            previousActionKeyIndex + 1
          } and #${actionIndex + 1}`,
          details: {
            surface,
            blockIndex,
            actionKey,
            firstIndex: previousActionKeyIndex,
            duplicateIndex: actionIndex,
            suggestedFix: 'Use a unique key for each action in this block.',
          },
        }),
      );
      return;
    }
    seenActionKeys.set(actionKey, actionIndex);

    const actionUse = APPROVAL_ACTION_USE_BY_PUBLIC_KEY.get(actionType);
    if (!actionUse) {
      errors.push(
        buildAuthoringError({
          path: actionPath,
          ruleId: 'approval-blueprint-action-type-unsupported',
          message: `flowSurfaces applyApprovalBlueprint action '${actionType}' is not an approval action`,
          details: {
            surface,
            blockIndex,
            actionIndex,
            actionType,
            allowedActions: Array.from(allowedActions),
            suggestedFix: 'Use an approval action from the allowedActions list for this block.',
          },
        }),
      );
      return;
    }

    if (!allowedActions.has(actionType)) {
      errors.push(
        buildAuthoringError({
          path: actionPath,
          ruleId: 'approval-action-not-allowed-for-block',
          message: `flowSurfaces applyApprovalBlueprint action '${actionType}' is not allowed on '${blockType}'`,
          details: {
            surface,
            blockIndex,
            actionIndex,
            blockType,
            actionType,
            allowedActions: Array.from(allowedActions),
            suggestedFix: 'Move this action to a compatible approval block or remove it.',
          },
        }),
      );
      return;
    }

    if (defaultActions.has(actionType)) {
      errors.push(
        buildAuthoringError({
          path: actionsPath,
          ruleId: 'approval-initiator-submit-action-default',
          message: 'approvalInitiator creates approvalSubmit by default; do not include approvalSubmit in actions.',
          details: {
            surface,
            blockIndex,
            blockType,
            invalidAction: actionType,
            defaultActionUse: actionUse,
            suggestedFix:
              'Remove approvalSubmit from this actions array and retry the same applyApprovalBlueprint request.',
          },
        }),
      );
      return;
    }

    if (!APPROVAL_SINGLETON_ACTION_USES.has(actionUse)) {
      return;
    }

    const previousIndex = seenSingletonActions.get(actionUse);
    if (typeof previousIndex !== 'undefined') {
      errors.push(
        buildAuthoringError({
          path: actionPath,
          ruleId: 'approval-action-singleton-duplicate',
          message: `flowSurfaces applyApprovalBlueprint action '${actionType}' is duplicated in '${blockType}'`,
          details: {
            surface,
            blockIndex,
            blockType,
            actionType,
            actionUse,
            actionPublicKey: APPROVAL_ACTION_PUBLIC_KEYS_BY_USE.get(actionUse),
            firstIndex: previousIndex,
            duplicateIndex: actionIndex,
            duplicateKey: readActionKey(action, actionType),
            suggestedFix: 'Keep only one instance of this approval action in the actions array.',
          },
        }),
      );
      return;
    }
    seenSingletonActions.set(actionUse, actionIndex);
  });
}

export function assertFlowSurfaceApprovalBlueprintAuthoringPayload(values: unknown) {
  const errors: FlowSurfaceErrorItemInput[] = [];
  if (!_.isPlainObject(values)) {
    errors.push(
      buildAuthoringError({
        path: '$',
        ruleId: 'approval-blueprint-payload-shape',
        message: 'flowSurfaces applyApprovalBlueprint payload must be an object',
        details: {
          suggestedFix: 'Send a JSON object as the applyApprovalBlueprint payload.',
        },
      }),
    );
    throwAggregateBadRequest(errors);
  }

  const payload = values as ApprovalBlueprintPayload;
  const surface = collectTopLevelShapeErrors(payload, errors);
  collectBindingErrors(payload, surface, errors);
  collectCollectionShapeErrors(payload, surface, errors);

  if (errors.length) {
    throwAggregateBadRequest(errors);
  }
}
