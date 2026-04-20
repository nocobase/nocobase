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
import type { FlowSurfacePlanSelector, FlowSurfacePlanStep } from '../types';
import { compileTabComposeValues } from './compile-blocks';
import { compileReactionPlanSteps } from './compile-reaction';
import type {
  FlowSurfaceApplyBlueprintDocument,
  FlowSurfaceApplyBlueprintProgram,
  FlowSurfaceApplyBlueprintReplaceTargetInfo,
} from './public-types';

const CREATE_MENU_ITEM_STEP_ID = 'blueprintMenuItem';
const CREATE_MENU_GROUP_STEP_ID = 'blueprintMenuGroup';
const CREATE_PAGE_STEP_ID = 'blueprintPage';
const PAGE_CONFIGURE_STEP_ID = 'blueprintPageConfigure';

function buildApplyBlueprintTabStepId(kind: 'compose' | 'add' | 'update', tabIndex: number) {
  const suffix = tabIndex + 1;
  if (kind === 'compose') {
    return `blueprintComposeTab__${suffix}`;
  }
  if (kind === 'add') {
    return `blueprintAddTab__${suffix}`;
  }
  return `blueprintUpdateTab__${suffix}`;
}

function buildPageChrome(document: FlowSurfaceApplyBlueprintDocument) {
  const firstTab = document.tabs[0];
  const pageTitle = document.page?.title || document.navigation?.item?.title || firstTab?.title || 'Untitled page';
  return {
    pageTitle,
    tabTitle: firstTab?.title || pageTitle,
    tabIcon: firstTab?.icon,
    tabDocumentTitle: firstTab?.documentTitle,
    enableTabs: document.page?.enableTabs ?? document.tabs.length > 1,
  };
}

function buildTabSelectorFromStep(stepId: string, path = 'tabSchemaUid'): FlowSurfacePlanSelector {
  return {
    step: stepId,
    path,
  };
}

function buildTabSelectorFromUid(uid: string): FlowSurfacePlanSelector {
  return {
    locator: { uid },
  };
}

function compileCreatePlan(document: FlowSurfaceApplyBlueprintDocument): FlowSurfaceApplyBlueprintProgram {
  const steps: FlowSurfacePlanStep[] = [];
  const chrome = buildPageChrome(document);

  if (_.isPlainObject(document.navigation?.group) && _.isUndefined(document.navigation.group.routeId)) {
    steps.push({
      id: CREATE_MENU_GROUP_STEP_ID,
      action: 'createMenu',
      values: buildDefinedPayload({
        title: document.navigation?.group?.title,
        type: 'group',
        icon: document.navigation?.group?.icon,
        tooltip: document.navigation?.group?.tooltip,
        hideInMenu: document.navigation?.group?.hideInMenu,
      }),
    });
  }

  steps.push({
    id: CREATE_MENU_ITEM_STEP_ID,
    action: 'createMenu',
    values: buildDefinedPayload({
      title: document.navigation?.item?.title || chrome.pageTitle,
      type: 'item',
      icon: document.navigation?.item?.icon,
      tooltip: document.navigation?.item?.tooltip,
      hideInMenu: document.navigation?.item?.hideInMenu,
      parentMenuRouteId: _.isUndefined(document.navigation?.group?.routeId)
        ? document.navigation?.group?.title
          ? { step: CREATE_MENU_GROUP_STEP_ID, path: 'routeId' }
          : undefined
        : document.navigation?.group?.routeId,
    }),
  });

  steps.push({
    id: CREATE_PAGE_STEP_ID,
    action: 'createPage',
    values: buildDefinedPayload({
      menuRouteId: { step: CREATE_MENU_ITEM_STEP_ID, path: 'routeId' },
      title: chrome.pageTitle,
      icon: document.page?.icon,
      documentTitle: document.page?.documentTitle,
      enableHeader: document.page?.enableHeader,
      enableTabs: chrome.enableTabs,
      displayTitle: document.page?.displayTitle,
      tabTitle: chrome.tabTitle,
      tabIcon: chrome.tabIcon,
      tabDocumentTitle: chrome.tabDocumentTitle,
      tabSchemaName: document.tabs[0].key,
    }),
  });

  steps.push({
    id: buildApplyBlueprintTabStepId('compose', 0),
    action: 'compose',
    selectors: {
      target: buildTabSelectorFromStep(CREATE_PAGE_STEP_ID),
    },
    values: compileTabComposeValues(document.tabs[0], document, 0, { mode: 'append' }),
  });

  document.tabs.slice(1).forEach((tab, offset) => {
    const tabIndex = offset + 1;
    const addTabStepId = buildApplyBlueprintTabStepId('add', tabIndex);
    steps.push({
      id: addTabStepId,
      action: 'addTab',
      selectors: {
        target: {
          step: CREATE_PAGE_STEP_ID,
          path: 'pageUid',
        },
      },
      values: buildDefinedPayload({
        title: tab.title || tab.key,
        icon: tab.icon,
        documentTitle: tab.documentTitle,
        tabSchemaName: tab.key,
      }),
    });
    steps.push({
      id: buildApplyBlueprintTabStepId('compose', tabIndex),
      action: 'compose',
      selectors: {
        target: buildTabSelectorFromStep(addTabStepId),
      },
      values: compileTabComposeValues(tab, document, tabIndex, { mode: 'append' }),
    });
  });

  steps.push(...compileReactionPlanSteps(document.reaction));

  return {
    document,
    steps,
    pageLocator: {},
  };
}

function buildPageConfigureChanges(document: FlowSurfaceApplyBlueprintDocument) {
  return buildDefinedPayload({
    title: document.page?.title,
    icon: document.page?.icon,
    documentTitle: document.page?.documentTitle,
    enableHeader: document.page?.enableHeader,
    enableTabs: document.page?.enableTabs,
    displayTitle: document.page?.displayTitle,
  });
}

function compileReplacePlan(
  document: FlowSurfaceApplyBlueprintDocument,
  targetInfo: FlowSurfaceApplyBlueprintReplaceTargetInfo,
): FlowSurfaceApplyBlueprintProgram {
  const steps: FlowSurfacePlanStep[] = [];
  const pageChanges = buildPageConfigureChanges(document);
  if (Object.keys(pageChanges).length) {
    steps.push({
      id: PAGE_CONFIGURE_STEP_ID,
      action: 'configure',
      selectors: {
        target: {
          locator: {
            uid: targetInfo.pageUid,
          },
        },
      },
      values: {
        changes: pageChanges,
      },
    });
  }

  document.tabs.forEach((tab, index) => {
    const existingTab = targetInfo.tabs[index];
    if (existingTab) {
      const tabChanges = buildDefinedPayload({
        title: tab.title,
        icon: tab.icon,
        documentTitle: tab.documentTitle,
      });
      if (Object.keys(tabChanges).length) {
        steps.push({
          id: buildApplyBlueprintTabStepId('update', index),
          action: 'updateTab',
          selectors: {
            target: buildTabSelectorFromUid(existingTab.uid),
          },
          values: tabChanges,
        });
      }
      steps.push({
        id: buildApplyBlueprintTabStepId('compose', index),
        action: 'compose',
        selectors: {
          target: buildTabSelectorFromUid(existingTab.uid),
        },
        values: compileTabComposeValues(tab, document, index, { mode: 'replace' }),
      });
      return;
    }

    const addTabStepId = buildApplyBlueprintTabStepId('add', index);
    steps.push({
      id: addTabStepId,
      action: 'addTab',
      selectors: {
        target: {
          locator: {
            uid: targetInfo.pageUid,
          },
        },
      },
      values: buildDefinedPayload({
        title: tab.title || tab.key,
        icon: tab.icon,
        documentTitle: tab.documentTitle,
        tabSchemaName: tab.key,
      }),
    });
    steps.push({
      id: buildApplyBlueprintTabStepId('compose', index),
      action: 'compose',
      selectors: {
        target: buildTabSelectorFromStep(addTabStepId),
      },
      values: compileTabComposeValues(tab, document, index, { mode: 'append' }),
    });
  });

  targetInfo.tabs
    .slice(document.tabs.length)
    .reverse()
    .forEach((tab, index) => {
      steps.push({
        id: `blueprintRemoveTab__${index + 1}`,
        action: 'removeTab',
        selectors: {
          target: buildTabSelectorFromUid(tab.uid),
        },
      });
    });

  steps.push(...compileReactionPlanSteps(document.reaction));

  return {
    document,
    surface: {
      locator: _.cloneDeep(targetInfo.locator),
    },
    steps,
    pageLocator: _.cloneDeep(targetInfo.locator),
    pageUid: targetInfo.pageUid,
  };
}

export function compileFlowSurfaceApplyBlueprintRequest(
  document: FlowSurfaceApplyBlueprintDocument,
  options: {
    replaceTarget?: FlowSurfaceApplyBlueprintReplaceTargetInfo;
  } = {},
): FlowSurfaceApplyBlueprintProgram {
  if (document.mode === 'create') {
    return compileCreatePlan(document);
  }
  if (!options.replaceTarget) {
    throwBadRequest(`flowSurfaces applyBlueprint replace target resolution is missing`);
  }
  return compileReplacePlan(document, options.replaceTarget);
}

export function resolveApplyBlueprintPageLocator(
  program: FlowSurfaceApplyBlueprintProgram,
  executeResult: Record<string, any> | undefined,
) {
  if (program.document.mode === 'replace') {
    return _.cloneDeep(program.pageLocator);
  }
  const resultById = Object.fromEntries(
    _.castArray(executeResult?.results || []).map((item: any) => [String(item?.id || item?.index), item?.result]),
  ) as Record<string, any>;
  const pageSchemaUid =
    resultById[CREATE_PAGE_STEP_ID]?.pageSchemaUid || executeResult?.target?.locator?.pageSchemaUid || undefined;
  if (!pageSchemaUid) {
    throwBadRequest(`flowSurfaces applyBlueprint failed to resolve created pageSchemaUid`);
  }
  return {
    pageSchemaUid: String(pageSchemaUid),
  };
}
