/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import { buildDefinedPayload, normalizeRowSpans } from '../service-utils';
import { normalizeFieldPath } from '../service-helpers';
import type { FlowSurfacePlanRequestValues, FlowSurfacePlanSelector, FlowSurfacePlanStep } from '../types';
import type {
  FlowSurfaceBlueprintDsl,
  FlowSurfaceDslCompileContext,
  FlowSurfaceDslAction,
  FlowSurfaceDslBlock,
  FlowSurfaceDslDataSource,
  FlowSurfaceDslDocument,
  FlowSurfaceDslEntityRef,
  FlowSurfaceDslField,
  FlowSurfaceDslLayout,
  FlowSurfaceDslPopup,
  FlowSurfacePatchDsl,
  FlowSurfacePatchDslChange,
} from './types';
import {
  buildFlowSurfaceDslActionRef,
  buildFlowSurfaceDslChangeStepId,
  buildFlowSurfaceDslEntityRefKey,
  buildFlowSurfaceDslFieldRef,
  buildFlowSurfaceDslPopupScopePrefix,
  buildFlowSurfaceDslPopupStepId,
  buildFlowSurfaceDslScopedRef,
  FLOW_SURFACE_DSL_PATCH_SURFACE_DEFAULT_TARGET_OPS,
} from './utils';

const DSL_MENU_GROUP_STEP_ID = 'dslMenuGroup';
const DSL_MENU_ITEM_STEP_ID = 'dslMenuItem';
const DSL_PAGE_STEP_ID = 'dslPage';
const DSL_PAGE_COMPOSE_STEP_ID = 'dslPageCompose';

type FlowSurfaceBlueprintCompileDeps = {
  dataSourcesByKey: Map<string, FlowSurfaceDslDataSource>;
  popupById: Map<string, FlowSurfaceDslPopup>;
  interactionTargets: Map<string, string>;
};

type FlowSurfacePatchCompileDeps = FlowSurfaceBlueprintCompileDeps;

function compilePlanSelectorFromEntityRef(
  entityRef: FlowSurfaceDslEntityRef,
  context: string,
): FlowSurfacePlanSelector {
  if (!_.isPlainObject(entityRef)) {
    throwBadRequest(`${context} must be an object`);
  }
  if (_.isPlainObject((entityRef as any).locator)) {
    return {
      locator: _.cloneDeep((entityRef as any).locator),
    };
  }
  const ref = buildFlowSurfaceDslEntityRefKey(entityRef);
  if (!ref) {
    throwBadRequest(`${context} must provide id or locator`);
  }
  return {
    ref,
  };
}

function compileBlueprintDataSourceResource(dataSource: FlowSurfaceDslDataSource) {
  if (dataSource.kind === 'binding') {
    return buildDefinedPayload({
      binding: dataSource.binding,
      dataSourceKey: dataSource.dataSourceKey,
      collectionName: dataSource.collectionName,
      associationField: dataSource.associationField,
    });
  }
  return buildDefinedPayload({
    dataSourceKey: dataSource.dataSourceKey || 'main',
    collectionName: dataSource.collectionName,
    associationPathName: dataSource.kind === 'association' ? dataSource.associationPathName : undefined,
  });
}

function mergeSemanticSettings(
  base: Record<string, any> | undefined,
  key: string,
  value: any,
): Record<string, any> | undefined {
  const settings = _.isPlainObject(base) ? _.cloneDeep(base) : {};
  if (!_.isNil(value) && value !== '' && _.isUndefined(settings[key])) {
    settings[key] = value;
  }
  return Object.keys(settings).length ? settings : undefined;
}

function buildBlueprintInteractionTargetMap(blueprint: FlowSurfaceBlueprintDsl) {
  const targetMap = new Map<string, string>();
  blueprint.interactions.forEach((interaction) => {
    if (interaction.type !== 'filter-target') {
      return;
    }
    targetMap.set(
      `${interaction.sourceBlockId}:${normalizeFieldPath(interaction.fieldPath, interaction.associationPathName)}`,
      interaction.targetBlockId,
    );
  });
  return targetMap;
}

function resolveBlueprintFieldTarget(
  blockId: string,
  field: FlowSurfaceDslField,
  interactionTargets: Map<string, string>,
) {
  if (typeof field.target === 'string' && field.target.trim()) {
    return field.target.trim();
  }
  if (_.isPlainObject(field.target) && typeof field.target.blockId === 'string' && field.target.blockId.trim()) {
    return field.target.blockId.trim();
  }
  if (field.fieldPath) {
    return interactionTargets.get(`${blockId}:${normalizeFieldPath(field.fieldPath, field.associationPathName)}`);
  }
  return undefined;
}

function resolveBlueprintBlockRef(block: FlowSurfaceDslBlock, scopePrefix?: string) {
  return buildFlowSurfaceDslScopedRef(scopePrefix, block.id);
}

function resolveBlueprintFieldRef(
  block: FlowSurfaceDslBlock,
  field: FlowSurfaceDslField,
  fieldIndex: number,
  scopePrefix?: string,
) {
  return buildFlowSurfaceDslScopedRef(scopePrefix, buildFlowSurfaceDslFieldRef(block.id, field, fieldIndex));
}

function resolveBlueprintActionRef(
  block: FlowSurfaceDslBlock,
  action: FlowSurfaceDslAction,
  actionIndex: number,
  scope: 'actions' | 'recordActions',
  scopePrefix?: string,
) {
  return buildFlowSurfaceDslScopedRef(scopePrefix, buildFlowSurfaceDslActionRef(block.id, scope, action, actionIndex));
}

function compileBlueprintField(
  block: FlowSurfaceDslBlock,
  field: FlowSurfaceDslField,
  fieldIndex: number,
  interactionTargets: Map<string, string>,
  options: {
    scopePrefix?: string;
  } = {},
) {
  return buildDefinedPayload({
    ref: resolveBlueprintFieldRef(block, field, fieldIndex, options.scopePrefix),
    fieldPath: field.fieldPath,
    associationPathName: field.associationPathName,
    renderer: field.renderer,
    type: field.type,
    target: resolveBlueprintFieldTarget(block.id, field, interactionTargets),
    settings: mergeSemanticSettings(field.settings, 'label', field.title),
  });
}

function compileBlueprintPopupPayload(popup: FlowSurfaceDslPopup | undefined) {
  if (!popup) {
    return undefined;
  }
  if (_.castArray(popup.blocks || []).length) {
    return {
      blocks: [],
    };
  }
  if (popup.completion === 'shell-only') {
    return {};
  }
  return undefined;
}

function compileBlueprintAction(
  block: FlowSurfaceDslBlock,
  action: FlowSurfaceDslAction,
  actionIndex: number,
  scope: 'actions' | 'recordActions',
  deps: FlowSurfaceBlueprintCompileDeps,
  options: {
    scopePrefix?: string;
  },
) {
  const popupId = typeof action.popupId === 'string' && action.popupId.trim() ? action.popupId.trim() : undefined;
  return buildDefinedPayload({
    ref: resolveBlueprintActionRef(block, action, actionIndex, scope, options.scopePrefix),
    type: action.type,
    settings: mergeSemanticSettings(action.settings, 'title', action.title),
    popup: compileBlueprintPopupPayload(popupId ? deps.popupById.get(popupId) : undefined),
  });
}

function compileBlueprintBlock(
  block: FlowSurfaceDslBlock,
  deps: FlowSurfaceBlueprintCompileDeps,
  options: {
    scopePrefix?: string;
  },
) {
  const dataSource =
    block.dataBound && block.dataSourceKey ? deps.dataSourcesByKey.get(block.dataSourceKey) : undefined;
  if (block.dataBound && !dataSource) {
    throwBadRequest(
      `flowSurfaces dsl blueprint block '${block.id}' dataSourceKey '${block.dataSourceKey}' is not defined`,
    );
  }
  return buildDefinedPayload({
    ref: resolveBlueprintBlockRef(block, options.scopePrefix),
    type: block.type,
    resource: dataSource ? compileBlueprintDataSourceResource(dataSource) : undefined,
    settings: mergeSemanticSettings(block.settings, 'title', block.title),
    fields: _.castArray(block.fields || []).map((field, index) =>
      compileBlueprintField(block, field, index, deps.interactionTargets, options),
    ),
    actions: _.castArray(block.actions || []).map((action, index) =>
      compileBlueprintAction(block, action, index, 'actions', deps, options),
    ),
    recordActions: _.castArray(block.recordActions || []).map((action, index) =>
      compileBlueprintAction(block, action, index, 'recordActions', deps, options),
    ),
  });
}

function compileBlueprintLayoutRows(
  layout: {
    rows?: any[];
  },
  resolveItemRef: (itemId: string) => string,
) {
  return {
    rows: _.castArray(layout.rows || []).map((row: any) =>
      _.castArray(row?.columns || []).map((column: any) => ({
        ref: resolveItemRef(String(_.castArray(column?.items || [])[0] || '').trim()),
        span: _.isNumber(column?.width) ? column.width : undefined,
      })),
    ),
  };
}

function compileBlueprintLayout(blueprint: FlowSurfaceBlueprintDsl) {
  return compileBlueprintLayoutRows(blueprint.layout, (itemId) => itemId);
}

function compileSetLayoutValues(layout: FlowSurfaceDslLayout, resolveItemRef: (itemId: string) => any) {
  const rows: Record<string, any[]> = {};
  const sizes: Record<string, number[]> = {};
  const rowOrder: string[] = [];

  _.castArray(layout.rows || []).forEach((row: any, rowIndex: number) => {
    const rowKey = typeof row?.key === 'string' && row.key.trim() ? row.key.trim() : `row${rowIndex + 1}`;
    const columns = _.castArray(row?.columns || []);
    rows[rowKey] = columns.map((column: any) =>
      _.castArray(column?.items || [])
        .map((item: any) => String(item || '').trim())
        .filter(Boolean)
        .map((itemId: string) => resolveItemRef(itemId)),
    );
    sizes[rowKey] = normalizeRowSpans(
      columns.map((column: any) => (_.isNumber(column?.width) ? column.width : undefined)),
    );
    rowOrder.push(rowKey);
  });

  return {
    rows,
    sizes,
    rowOrder,
  };
}

function compileBlueprintPopupLayout(popup: FlowSurfaceDslPopup, popupScopePrefix: string) {
  if (!_.isPlainObject(popup.layout)) {
    return undefined;
  }
  if (Array.isArray((popup.layout as any).rows)) {
    return compileBlueprintLayoutRows(popup.layout as any, (itemId) =>
      buildFlowSurfaceDslScopedRef(popupScopePrefix, itemId),
    );
  }
  return _.cloneDeep(popup.layout);
}

function appendSemanticActionPopupSteps(
  steps: FlowSurfacePlanStep[],
  actionRef: string,
  action: FlowSurfaceDslAction,
  deps: FlowSurfaceBlueprintCompileDeps,
  options: {
    counters: {
      popupStep: number;
    };
  },
) {
  const popupId = String(action?.popupId || '').trim();
  if (!popupId) {
    return;
  }
  const popup = deps.popupById.get(popupId);
  if (!popup) {
    return;
  }
  if (popup.title) {
    const popupStepIndex = options.counters.popupStep++;
    steps.push({
      id: buildFlowSurfaceDslPopupStepId('title', actionRef, popupId, popupStepIndex),
      action: 'updatePopupTab',
      selectors: {
        target: {
          ref: `${actionRef}.popupTab`,
        },
      },
      values: {
        title: popup.title,
      },
    });
  }

  const popupBlocks = _.castArray(popup.blocks || []);
  if (!popupBlocks.length) {
    return;
  }

  const popupScopePrefix = buildFlowSurfaceDslPopupScopePrefix(actionRef);
  const popupStepIndex = options.counters.popupStep++;
  steps.push({
    id: buildFlowSurfaceDslPopupStepId('compose', actionRef, popupId, popupStepIndex),
    action: 'compose',
    selectors: {
      target: {
        ref: `${actionRef}.popupGrid`,
      },
    },
    values: buildDefinedPayload({
      mode: 'replace',
      blocks: popupBlocks.map((popupBlock) =>
        compileBlueprintBlock(popupBlock, deps, {
          scopePrefix: popupScopePrefix,
        }),
      ),
      layout: compileBlueprintPopupLayout(popup, popupScopePrefix),
    }),
  });

  appendBlueprintPopupSteps(steps, popupBlocks, deps, {
    scopePrefix: popupScopePrefix,
    counters: options.counters,
  });
}

function appendBlueprintPopupSteps(
  steps: FlowSurfacePlanStep[],
  blocks: FlowSurfaceDslBlock[],
  deps: FlowSurfaceBlueprintCompileDeps,
  options: {
    scopePrefix?: string;
    counters: {
      popupStep: number;
    };
  },
) {
  const visitScope = (
    block: FlowSurfaceDslBlock,
    scope: 'actions' | 'recordActions',
    actions: FlowSurfaceDslAction[],
  ) => {
    actions.forEach((action, actionIndex) => {
      const actionRef = resolveBlueprintActionRef(block, action, actionIndex, scope, options.scopePrefix);
      appendSemanticActionPopupSteps(steps, actionRef, action, deps, options);
    });
  };

  blocks.forEach((block) => {
    visitScope(block, 'actions', _.castArray(block.actions || []));
    visitScope(block, 'recordActions', _.castArray(block.recordActions || []));
  });
}

function buildPatchCompileDeps(patch: FlowSurfacePatchDsl): FlowSurfacePatchCompileDeps {
  const dataSourcesByKey = new Map<string, FlowSurfaceDslDataSource>();
  _.castArray(patch.dataSources || []).forEach((dataSource) => dataSourcesByKey.set(dataSource.key, dataSource));
  const popupById = new Map<string, FlowSurfaceDslPopup>();
  _.castArray(patch.popups || []).forEach((popup) => popupById.set(popup.id, popup));
  return {
    dataSourcesByKey,
    popupById,
    interactionTargets: new Map<string, string>(),
  };
}

function readPatchEntityRefId(entityRef: FlowSurfaceDslEntityRef | undefined) {
  if (!_.isPlainObject(entityRef) || typeof (entityRef as any).id !== 'string') {
    return undefined;
  }
  const id = String((entityRef as any).id || '').trim();
  return id || undefined;
}

function readFieldTargetRef(field: FlowSurfaceDslField) {
  if (typeof field.target === 'string' && field.target.trim()) {
    return field.target.trim();
  }
  if (_.isPlainObject(field.target) && typeof field.target.blockId === 'string' && field.target.blockId.trim()) {
    return field.target.blockId.trim();
  }
  return undefined;
}

function resolvePatchFieldRef(field: FlowSurfaceDslField, stepId: string, targetRefBase?: string) {
  const explicitId = typeof field.id === 'string' ? field.id.trim() : '';
  if (explicitId) {
    return explicitId;
  }
  if (targetRefBase) {
    return buildFlowSurfaceDslFieldRef(targetRefBase, field, 0);
  }
  return stepId;
}

function resolvePatchActionRef(
  action: FlowSurfaceDslAction,
  stepId: string,
  scope: 'actions' | 'recordActions',
  targetRefBase?: string,
) {
  const explicitId = typeof action.id === 'string' ? action.id.trim() : '';
  if (explicitId) {
    return explicitId;
  }
  if (targetRefBase) {
    return buildFlowSurfaceDslActionRef(targetRefBase, scope, action, 0);
  }
  return stepId;
}

function compilePatchFieldValues(field: FlowSurfaceDslField, stepId: string, targetRefBase?: string) {
  const filterTargetRef = readFieldTargetRef(field);
  return buildDefinedPayload({
    ref: resolvePatchFieldRef(field, stepId, targetRefBase),
    fieldPath: field.fieldPath,
    associationPathName: field.associationPathName,
    renderer: field.renderer,
    type: field.type,
    ...(filterTargetRef
      ? {
          defaultTargetUid: {
            ref: filterTargetRef,
          },
          targetBlockUid: {
            ref: filterTargetRef,
          },
        }
      : {}),
    settings: mergeSemanticSettings(field.settings, 'label', field.title),
  });
}

function compilePatchActionValues(
  action: FlowSurfaceDslAction,
  stepId: string,
  scope: 'actions' | 'recordActions',
  deps: FlowSurfacePatchCompileDeps,
  targetRefBase?: string,
) {
  const actionRef = resolvePatchActionRef(action, stepId, scope, targetRefBase);
  return {
    actionRef,
    values: buildDefinedPayload({
      ref: actionRef,
      type: action.type,
      settings: mergeSemanticSettings(action.settings, 'title', action.title),
      popup: compileBlueprintPopupPayload(
        typeof action.popupId === 'string' && action.popupId.trim()
          ? deps.popupById.get(action.popupId.trim())
          : undefined,
      ),
    }),
  };
}

function buildBlueprintSteps(
  blueprint: FlowSurfaceBlueprintDsl,
  compileContext?: FlowSurfaceDslCompileContext,
): FlowSurfacePlanStep[] {
  const steps: FlowSurfacePlanStep[] = [];
  const dataSourcesByKey = new Map<string, FlowSurfaceDslDataSource>();
  blueprint.dataSources.forEach((dataSource) => dataSourcesByKey.set(dataSource.key, dataSource));
  const popupById = new Map<string, FlowSurfaceDslPopup>();
  blueprint.popups.forEach((popup) => popupById.set(popup.id, popup));
  const interactionTargets = buildBlueprintInteractionTargetMap(blueprint);
  const compileDeps: FlowSurfaceBlueprintCompileDeps = {
    dataSourcesByKey,
    popupById,
    interactionTargets,
  };
  const orderedBlockIds = _.castArray(blueprint.layout.rows || []).flatMap((row: any) =>
    _.castArray(row?.columns || []).flatMap((column: any) =>
      _.castArray(column?.items || [])
        .map((item: any) => String(item || '').trim())
        .filter(Boolean),
    ),
  );
  const blocksById = new Map<string, FlowSurfaceDslBlock>();
  blueprint.blocks.forEach((block) => blocksById.set(block.id, block));
  const composeBlocks = orderedBlockIds.map((blockId) => {
    const block = blocksById.get(blockId);
    if (!block) {
      throwBadRequest(`flowSurfaces dsl blueprint block '${blockId}' is missing from blocks[]`);
    }
    return compileBlueprintBlock(block, compileDeps, {});
  });

  let composeTarget: FlowSurfacePlanSelector;
  let composeMode: 'append' | 'replace' = 'append';
  if (blueprint.target.mode === 'create-page') {
    const groupSpec = _.isPlainObject(blueprint.navigation?.parent)
      ? (blueprint.navigation?.parent as Record<string, any>)
      : undefined;
    if (_.isPlainObject(groupSpec?.createGroup)) {
      steps.push({
        id: DSL_MENU_GROUP_STEP_ID,
        action: 'createMenu',
        values: buildDefinedPayload({
          title: groupSpec.createGroup.title,
          type: 'group',
          icon: groupSpec.createGroup.icon,
          tooltip: groupSpec.createGroup.tooltip,
          hideInMenu: groupSpec.createGroup.hideInMenu,
        }),
      });
    }

    steps.push({
      id: DSL_MENU_ITEM_STEP_ID,
      action: 'createMenu',
      values: buildDefinedPayload({
        title: blueprint.navigation?.item?.title || blueprint.title,
        type: 'item',
        icon: blueprint.navigation?.item?.icon,
        tooltip: blueprint.navigation?.item?.tooltip,
        hideInMenu: blueprint.navigation?.item?.hideInMenu,
        parentMenuRouteId: _.isPlainObject(groupSpec?.createGroup)
          ? {
              step: DSL_MENU_GROUP_STEP_ID,
              path: 'routeId',
            }
          : groupSpec?.routeId,
      }),
    });

    steps.push({
      id: DSL_PAGE_STEP_ID,
      action: 'createPage',
      values: buildDefinedPayload({
        menuRouteId: {
          step: DSL_MENU_ITEM_STEP_ID,
          path: 'routeId',
        },
        title: blueprint.navigation?.page?.title || blueprint.title,
        icon: blueprint.navigation?.page?.icon,
        documentTitle: blueprint.navigation?.page?.documentTitle,
        enableHeader: blueprint.navigation?.page?.enableHeader,
        enableTabs: blueprint.navigation?.page?.enableTabs,
        displayTitle: blueprint.navigation?.page?.displayTitle,
        tabTitle: blueprint.navigation?.initialTab?.title || blueprint.title,
        tabIcon: blueprint.navigation?.initialTab?.icon,
        tabDocumentTitle: blueprint.navigation?.initialTab?.documentTitle,
      }),
    });

    composeTarget = {
      step: DSL_PAGE_STEP_ID,
      path: 'tabSchemaUid',
    };
  } else {
    if (!compileContext?.blueprintUpdatePageComposeTarget) {
      throwBadRequest(`flowSurfaces dsl blueprint update-page target resolution is missing`);
    }
    composeTarget = {
      locator: _.cloneDeep(compileContext.blueprintUpdatePageComposeTarget),
    };
    composeMode = 'replace';
  }

  steps.push({
    id: DSL_PAGE_COMPOSE_STEP_ID,
    action: 'compose',
    selectors: {
      target: composeTarget,
    },
    values: {
      mode: composeMode,
      blocks: composeBlocks,
      layout: compileBlueprintLayout(blueprint),
    },
  });

  appendBlueprintPopupSteps(steps, blueprint.blocks, compileDeps, {
    counters: {
      popupStep: 1,
    },
  });

  return steps;
}

function compilePatchChange(
  patch: FlowSurfacePatchDsl,
  change: FlowSurfacePatchDslChange,
  index: number,
  deps: FlowSurfacePatchCompileDeps,
): FlowSurfacePlanStep[] {
  const id = buildFlowSurfaceDslChangeStepId(change, index);
  const selectorFromChangeTarget = !_.isUndefined(change.target)
    ? compilePlanSelectorFromEntityRef(change.target, `flowSurfaces dsl patch changes[${index}].target`)
    : undefined;
  const selectorFromSurface = FLOW_SURFACE_DSL_PATCH_SURFACE_DEFAULT_TARGET_OPS.has(change.op)
    ? {
        locator: _.cloneDeep(patch.target.locator),
      }
    : undefined;
  const targetSelector = selectorFromChangeTarget || selectorFromSurface;
  const targetRefBase = readPatchEntityRefId(change.target);
  const sourceSelector = !_.isUndefined(change.source)
    ? compilePlanSelectorFromEntityRef(change.source, `flowSurfaces dsl patch changes[${index}].source`)
    : undefined;
  const rawValues = _.isPlainObject(change.values) ? _.cloneDeep(change.values) : {};

  switch (change.op) {
    case 'page.destroy':
      return [
        {
          id,
          action: 'destroyPage',
          selectors: {
            target: targetSelector || {
              locator: _.cloneDeep(patch.target.locator),
            },
          },
        },
      ];
    case 'tab.add':
      return [
        {
          id,
          action: 'addTab',
          selectors: {
            target: targetSelector,
          },
          values: rawValues,
        },
      ];
    case 'tab.update':
      return [
        {
          id,
          action: 'updateTab',
          selectors: {
            target: targetSelector,
          },
          values: rawValues,
        },
      ];
    case 'tab.move':
      return [
        {
          id,
          action: 'moveTab',
          selectors: buildDefinedPayload({
            source: sourceSelector,
            target: targetSelector,
          }),
          values: rawValues,
        },
      ];
    case 'tab.remove':
      return [
        {
          id,
          action: 'removeTab',
          selectors: {
            target: targetSelector,
          },
        },
      ];
    case 'block.add': {
      const block = _.cloneDeep(rawValues.block) as FlowSurfaceDslBlock;
      const steps: FlowSurfacePlanStep[] = [
        {
          id,
          action: 'compose',
          selectors: {
            target: targetSelector,
          },
          values: {
            mode: 'append',
            blocks: [compileBlueprintBlock(block, deps, {})],
          },
        },
      ];
      appendBlueprintPopupSteps(steps, [block], deps, {
        counters: {
          popupStep: 1,
        },
      });
      return steps;
    }
    case 'field.add':
      return [
        {
          id,
          action: 'addField',
          selectors: {
            target: targetSelector,
          },
          values: compilePatchFieldValues(_.cloneDeep(rawValues.field) as FlowSurfaceDslField, id, targetRefBase),
        },
      ];
    case 'action.add': {
      const action = _.cloneDeep(rawValues.action) as FlowSurfaceDslAction;
      const compiled = compilePatchActionValues(action, id, 'actions', deps, targetRefBase);
      const steps: FlowSurfacePlanStep[] = [
        {
          id,
          action: 'addAction',
          selectors: {
            target: targetSelector,
          },
          values: compiled.values,
        },
      ];
      appendSemanticActionPopupSteps(steps, compiled.actionRef, action, deps, {
        counters: {
          popupStep: 1,
        },
      });
      return steps;
    }
    case 'recordAction.add': {
      const action = _.cloneDeep(rawValues.action) as FlowSurfaceDslAction;
      const compiled = compilePatchActionValues(action, id, 'recordActions', deps, targetRefBase);
      const steps: FlowSurfacePlanStep[] = [
        {
          id,
          action: 'addRecordAction',
          selectors: {
            target: targetSelector,
          },
          values: compiled.values,
        },
      ];
      appendSemanticActionPopupSteps(steps, compiled.actionRef, action, deps, {
        counters: {
          popupStep: 1,
        },
      });
      return steps;
    }
    case 'settings.update':
      return [
        {
          id,
          action: 'configure',
          selectors: {
            target: targetSelector,
          },
          values: {
            changes: _.cloneDeep(rawValues.changes),
          },
        },
      ];
    case 'layout.replace':
      return [
        {
          id,
          action: 'setLayout',
          selectors: {
            target: targetSelector,
          },
          values: compileSetLayoutValues(_.cloneDeep(rawValues.layout) as FlowSurfaceDslLayout, (itemId) => ({
            ref: itemId,
          })),
        },
      ];
    case 'node.move':
      return [
        {
          id,
          action: 'moveNode',
          selectors: buildDefinedPayload({
            source: sourceSelector,
            target: targetSelector,
          }),
          values: rawValues,
        },
      ];
    case 'node.remove':
      return [
        {
          id,
          action: 'removeNode',
          selectors: {
            target: targetSelector,
          },
        },
      ];
    case 'template.detach':
      return [
        {
          id,
          action: 'convertTemplateToCopy',
          selectors: {
            target: targetSelector,
          },
        },
      ];
    default:
      throwBadRequest(`flowSurfaces dsl patch op '${change.op}' is not supported`);
  }
}

function compilePatch(patch: FlowSurfacePatchDsl): FlowSurfacePlanRequestValues {
  const deps = buildPatchCompileDeps(patch);
  return buildDefinedPayload({
    surface: {
      locator: _.cloneDeep(patch.target.locator),
    },
    plan: {
      steps: patch.changes.flatMap((change, index) => compilePatchChange(patch, change, index, deps)),
    },
  }) as FlowSurfacePlanRequestValues;
}

function compileBlueprint(
  blueprint: FlowSurfaceBlueprintDsl,
  compileContext?: FlowSurfaceDslCompileContext,
): FlowSurfacePlanRequestValues {
  return buildDefinedPayload({
    surface:
      blueprint.target.mode === 'update-page'
        ? {
            locator: _.cloneDeep(blueprint.target.locator),
          }
        : undefined,
    plan: {
      steps: buildBlueprintSteps(blueprint, compileContext),
    },
  }) as FlowSurfacePlanRequestValues;
}

export function compileFlowSurfaceDslToPlanRequest(
  dsl: FlowSurfaceDslDocument,
  compileContext?: FlowSurfaceDslCompileContext,
): FlowSurfacePlanRequestValues {
  if (dsl.kind === 'patch') {
    return compilePatch(dsl);
  }
  return compileBlueprint(dsl, compileContext);
}
