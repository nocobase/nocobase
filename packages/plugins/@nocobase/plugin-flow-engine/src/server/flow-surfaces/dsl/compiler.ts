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
import { buildDefinedPayload } from '../service-utils';
import { normalizeFieldPath } from '../service-helpers';
import type { FlowSurfacePlanRequestValues, FlowSurfacePlanSelector, FlowSurfacePlanStep } from '../types';
import type {
  FlowSurfaceBlueprintDsl,
  FlowSurfaceDslAction,
  FlowSurfaceDslBlock,
  FlowSurfaceDslDataSource,
  FlowSurfaceDslDocument,
  FlowSurfaceDslEntityRef,
  FlowSurfaceDslField,
  FlowSurfaceDslPopup,
  FlowSurfacePatchDsl,
  FlowSurfacePatchDslChange,
} from './types';
import {
  buildFlowSurfaceDslActionRef,
  buildFlowSurfaceDslChangeStepId,
  buildFlowSurfaceDslEntityRefKey,
  buildFlowSurfaceDslFieldRef,
} from './utils';

const DSL_MENU_GROUP_STEP_ID = 'dslMenuGroup';
const DSL_MENU_ITEM_STEP_ID = 'dslMenuItem';
const DSL_PAGE_STEP_ID = 'dslPage';
const DSL_PAGE_COMPOSE_STEP_ID = 'dslPageCompose';
const PATCH_SURFACE_DEFAULT_TARGET_OPS = new Set([
  'page.destroy',
  'tab.add',
  'block.add',
  'settings.update',
  'layout.replace',
]);

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

function compileBlueprintField(
  block: FlowSurfaceDslBlock,
  field: FlowSurfaceDslField,
  fieldIndex: number,
  interactionTargets: Map<string, string>,
) {
  return buildDefinedPayload({
    ref: buildFlowSurfaceDslFieldRef(block.id, field, fieldIndex),
    fieldPath: field.fieldPath,
    associationPathName: field.associationPathName,
    renderer: field.renderer,
    type: field.type,
    target: resolveBlueprintFieldTarget(block.id, field, interactionTargets),
    settings: mergeSemanticSettings(field.settings, 'label', field.title),
  });
}

function compileBlueprintPopupPayload(
  action: FlowSurfaceDslAction,
  popup: FlowSurfaceDslPopup | undefined,
  deps: {
    dataSourcesByKey: Map<string, FlowSurfaceDslDataSource>;
    popupById: Map<string, FlowSurfaceDslPopup>;
    interactionTargets: Map<string, string>;
  },
) {
  if (!popup) {
    return undefined;
  }
  if (popup.completion === 'shell-only') {
    return {};
  }
  const popupBlocks = _.castArray(popup.blocks || []);
  if (!popupBlocks.length) {
    return undefined;
  }
  return buildDefinedPayload({
    mode: 'replace',
    blocks: popupBlocks.map((block) => compileBlueprintBlock(block, deps, popup.id)),
    layout: _.isPlainObject(popup.layout) ? _.cloneDeep(popup.layout) : undefined,
  });
}

function compileBlueprintAction(
  block: FlowSurfaceDslBlock,
  action: FlowSurfaceDslAction,
  actionIndex: number,
  scope: 'actions' | 'recordActions',
  deps: {
    dataSourcesByKey: Map<string, FlowSurfaceDslDataSource>;
    popupById: Map<string, FlowSurfaceDslPopup>;
    interactionTargets: Map<string, string>;
  },
) {
  const popupId = typeof action.popupId === 'string' && action.popupId.trim() ? action.popupId.trim() : undefined;
  return buildDefinedPayload({
    ref: buildFlowSurfaceDslActionRef(block.id, scope, action, actionIndex),
    type: action.type,
    settings: mergeSemanticSettings(action.settings, 'title', action.title),
    popup: compileBlueprintPopupPayload(action, popupId ? deps.popupById.get(popupId) : undefined, deps),
  });
}

function compileBlueprintBlock(
  block: FlowSurfaceDslBlock,
  deps: {
    dataSourcesByKey: Map<string, FlowSurfaceDslDataSource>;
    popupById: Map<string, FlowSurfaceDslPopup>;
    interactionTargets: Map<string, string>;
  },
  currentPopupId?: string,
) {
  const dataSource =
    block.dataBound && block.dataSourceKey ? deps.dataSourcesByKey.get(block.dataSourceKey) : undefined;
  if (block.dataBound && !dataSource) {
    throwBadRequest(
      `flowSurfaces dsl blueprint block '${block.id}' dataSourceKey '${block.dataSourceKey}' is not defined`,
    );
  }
  return buildDefinedPayload({
    ref: block.id,
    type: block.type,
    resource: dataSource ? compileBlueprintDataSourceResource(dataSource) : undefined,
    settings: mergeSemanticSettings(block.settings, 'title', block.title),
    fields: _.castArray(block.fields || []).map((field, index) =>
      compileBlueprintField(block, field, index, deps.interactionTargets),
    ),
    actions: _.castArray(block.actions || []).map((action, index) =>
      compileBlueprintAction(block, action, index, 'actions', deps),
    ),
    recordActions: _.castArray(block.recordActions || []).map((action, index) =>
      compileBlueprintAction(block, action, index, 'recordActions', deps),
    ),
  });
}

function compileBlueprintLayout(blueprint: FlowSurfaceBlueprintDsl) {
  return {
    rows: _.castArray(blueprint.layout.rows || []).map((row: any) =>
      _.castArray(row?.columns || []).map((column: any) => ({
        ref: String(_.castArray(column?.items || [])[0] || '').trim(),
        span: _.isNumber(column?.width) ? column.width : undefined,
      })),
    ),
  };
}

function buildBlueprintSteps(blueprint: FlowSurfaceBlueprintDsl): FlowSurfacePlanStep[] {
  const steps: FlowSurfacePlanStep[] = [];
  const dataSourcesByKey = new Map<string, FlowSurfaceDslDataSource>();
  blueprint.dataSources.forEach((dataSource) => dataSourcesByKey.set(dataSource.key, dataSource));
  const popupById = new Map<string, FlowSurfaceDslPopup>();
  blueprint.popups.forEach((popup) => popupById.set(popup.id, popup));
  const interactionTargets = buildBlueprintInteractionTargetMap(blueprint);
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
    return compileBlueprintBlock(block, {
      dataSourcesByKey,
      popupById,
      interactionTargets,
    });
  });

  let composeTarget: FlowSurfacePlanSelector;
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
    composeTarget = {
      locator: _.cloneDeep(blueprint.target.locator),
    };
  }

  steps.push({
    id: DSL_PAGE_COMPOSE_STEP_ID,
    action: 'compose',
    selectors: {
      target: composeTarget,
    },
    values: {
      mode: 'append',
      blocks: composeBlocks,
      layout: compileBlueprintLayout(blueprint),
    },
  });

  return steps;
}

function compilePatchChange(
  patch: FlowSurfacePatchDsl,
  change: FlowSurfacePatchDslChange,
  index: number,
): FlowSurfacePlanStep {
  const id = buildFlowSurfaceDslChangeStepId(change, index);
  const selectorFromChangeTarget = !_.isUndefined(change.target)
    ? compilePlanSelectorFromEntityRef(change.target, `flowSurfaces dsl patch changes[${index}].target`)
    : undefined;
  const selectorFromSurface = PATCH_SURFACE_DEFAULT_TARGET_OPS.has(change.op)
    ? {
        locator: _.cloneDeep(patch.target.locator),
      }
    : undefined;
  const targetSelector = selectorFromChangeTarget || selectorFromSurface;
  const sourceSelector = !_.isUndefined(change.source)
    ? compilePlanSelectorFromEntityRef(change.source, `flowSurfaces dsl patch changes[${index}].source`)
    : undefined;
  const rawValues = _.isPlainObject(change.values) ? _.cloneDeep(change.values) : {};

  switch (change.op) {
    case 'page.destroy':
      return {
        id,
        action: 'destroyPage',
        selectors: {
          target: targetSelector || {
            locator: _.cloneDeep(patch.target.locator),
          },
        },
      };
    case 'tab.add':
      return {
        id,
        action: 'addTab',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    case 'tab.update':
      return {
        id,
        action: 'updateTab',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    case 'tab.move':
      return {
        id,
        action: 'moveTab',
        selectors: buildDefinedPayload({
          source: sourceSelector,
          target: targetSelector,
        }),
        values: rawValues,
      };
    case 'tab.remove':
      return {
        id,
        action: 'removeTab',
        selectors: {
          target: targetSelector,
        },
      };
    case 'block.add':
      return {
        id,
        action: 'addBlock',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    case 'field.add':
      return {
        id,
        action: 'addField',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    case 'action.add':
      return {
        id,
        action: 'addAction',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    case 'recordAction.add':
      return {
        id,
        action: 'addRecordAction',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    case 'settings.update': {
      const configureChanges = _.isPlainObject(rawValues.changes) ? _.cloneDeep(rawValues.changes) : undefined;
      if (configureChanges) {
        return {
          id,
          action: 'configure',
          selectors: {
            target: targetSelector,
          },
          values: {
            changes: configureChanges,
          },
        };
      }
      return {
        id,
        action: 'updateSettings',
        selectors: {
          target: targetSelector,
        },
        values: rawValues,
      };
    }
    case 'layout.replace': {
      const layoutValues = _.isPlainObject(rawValues.layout) ? _.cloneDeep(rawValues.layout) : rawValues;
      return {
        id,
        action: 'setLayout',
        selectors: {
          target: targetSelector,
        },
        values: layoutValues,
      };
    }
    case 'node.move':
      return {
        id,
        action: 'moveNode',
        selectors: buildDefinedPayload({
          source: sourceSelector,
          target: targetSelector,
        }),
        values: rawValues,
      };
    case 'node.remove':
      return {
        id,
        action: 'removeNode',
        selectors: {
          target: targetSelector,
        },
      };
    case 'template.detach':
      return {
        id,
        action: 'convertTemplateToCopy',
        selectors: {
          target: targetSelector,
        },
      };
    default:
      throwBadRequest(`flowSurfaces dsl patch op '${change.op}' is not supported`);
  }
}

function compilePatch(patch: FlowSurfacePatchDsl): FlowSurfacePlanRequestValues {
  return buildDefinedPayload({
    surface: {
      locator: _.cloneDeep(patch.target.locator),
    },
    plan: {
      steps: patch.changes.map((change, index) => compilePatchChange(patch, change, index)),
    },
  }) as FlowSurfacePlanRequestValues;
}

function compileBlueprint(blueprint: FlowSurfaceBlueprintDsl): FlowSurfacePlanRequestValues {
  return buildDefinedPayload({
    surface:
      blueprint.target.mode === 'update-page'
        ? {
            locator: _.cloneDeep(blueprint.target.locator),
          }
        : undefined,
    plan: {
      steps: buildBlueprintSteps(blueprint),
    },
  }) as FlowSurfacePlanRequestValues;
}

export function compileFlowSurfaceDslToPlanRequest(dsl: FlowSurfaceDslDocument): FlowSurfacePlanRequestValues {
  if (dsl.kind === 'patch') {
    return compilePatch(dsl);
  }
  return compileBlueprint(dsl);
}
