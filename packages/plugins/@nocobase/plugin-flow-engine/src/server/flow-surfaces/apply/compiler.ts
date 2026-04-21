/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  ACTION_KEY_BY_USE,
  BLOCK_KEY_BY_USE,
  resolveSupportedActionCatalogItem,
  resolveSupportedBlockCatalogItem,
  resolveSupportedFieldCapability,
} from '../catalog';
import {
  FLOW_SURFACE_DETAILS_BLOCK_USES,
  FLOW_SURFACE_FILTER_FORM_BLOCK_USES,
  FLOW_SURFACE_FORM_BLOCK_USES,
  isActionContainerUse,
  isBlockContainerUse,
  isFieldContainerUse,
  isFieldWrapperUse,
  isPopupHostUse,
} from '../placement';
import { FlowSurfaceBadRequestError } from '../errors';
import { CREATABLE_STANDALONE_FIELD_USES, FIELD_WRAPPER_USES } from '../node-use-sets';
import type { FlowSurfaceApplySpec, FlowSurfaceMutateOp, FlowSurfaceNodeSpec, FlowSurfaceWriteTarget } from '../types';
import {
  didItemRefsChange,
  emitLayoutOp,
  emitMoveOps,
  emitMovePopupTabOps,
  emitMoveTabOps,
  omitLayoutProps,
} from './layout';
import { hasExplicitSubModelKey, matchesObjectChild, normalizeChildren, planArrayChildMatches } from './matching';

type CompilerState = {
  seq: number;
  clientKeyToUid: Record<string, string>;
};

type CompiledNodeRef = {
  uidRef: any;
  use: string;
  sourceOpId?: string;
  ownerUidRef?: any;
};

type SyncChildrenResult = {
  childClientKeyRefs: Record<string, any>;
  finalItemRefs: CompiledNodeRef[];
  itemsChanged: boolean;
  itemsSpecified: boolean;
};

type PopupShellBootstrapResult = {
  childRefs: CompiledNodeRef[];
  childClientKeyRefs: Record<string, any>;
  popupGridUidRef: any;
  popupPageRef: CompiledNodeRef | null;
  popupTabRef: CompiledNodeRef | null;
  placeholderRef: CompiledNodeRef | null;
};

function makeOpRef(path: string) {
  const normalized = String(path || '').trim();
  const [step, ...rest] = normalized.split('.');
  return {
    step,
    ...(rest.length ? { path: rest.join('.') } : {}),
  };
}

const FORM_GRID_USES = new Set(['FormGridModel', 'AssignFormGridModel']);
const ACTION_USES = new Set(Array.from(ACTION_KEY_BY_USE.keys()));
const BLOCK_USES = new Set(Array.from(BLOCK_KEY_BY_USE.keys()));
const STANDALONE_FIELD_USES = CREATABLE_STANDALONE_FIELD_USES;
const FORM_BLOCK_USES = FLOW_SURFACE_FORM_BLOCK_USES;
const DETAILS_BLOCK_USES = FLOW_SURFACE_DETAILS_BLOCK_USES;
const FILTER_FORM_BLOCK_USES = FLOW_SURFACE_FILTER_FORM_BLOCK_USES;
const RECORD_ACTION_INTERNAL_CONTAINER_USES = new Set([
  'TableActionsColumnModel',
  'ListItemModel',
  'GridCardItemModel',
]);
const APPLY_POPUP_ALLOWED_KEYS = new Set(['template', 'tryTemplate', 'defaultType']);

export function compileApplySpec(
  target: FlowSurfaceWriteTarget,
  currentTree: any,
  spec: FlowSurfaceApplySpec,
): {
  ops: FlowSurfaceMutateOp[];
  clientKeyToUid: Record<string, string>;
} {
  if (!currentTree?.uid || !currentTree?.use) {
    throw new FlowSurfaceBadRequestError('flowSurfaces apply requires an existing target subtree');
  }

  const ops: FlowSurfaceMutateOp[] = [];
  const state: CompilerState = {
    seq: 0,
    clientKeyToUid: {},
  };

  if (currentTree.use === 'RootPageModel') {
    syncRoutePageNode(ops, state, target, currentTree, spec);
    return {
      ops,
      clientKeyToUid: state.clientKeyToUid,
    };
  }

  if (currentTree.use === 'ChildPageModel') {
    syncExistingNode(
      ops,
      state,
      {
        uidRef: currentTree.uid,
        use: currentTree.use,
      },
      currentTree,
      {
        uid: currentTree.uid,
        use: currentTree.use,
        props: spec.props,
        decoratorProps: spec.decoratorProps,
        stepParams: spec.stepParams,
        flowRegistry: spec.flowRegistry,
        subModels: spec.subModels,
      },
      { uid: currentTree.uid },
    );
    return {
      ops,
      clientKeyToUid: state.clientKeyToUid,
    };
  }

  if (currentTree.use === 'RootPageTabModel') {
    syncRouteTabNode(ops, state, target, currentTree, spec);
    return {
      ops,
      clientKeyToUid: state.clientKeyToUid,
    };
  }

  if (currentTree.use === 'ChildPageTabModel') {
    syncTabNode(ops, state, { uid: currentTree.uid }, currentTree, spec);
    return {
      ops,
      clientKeyToUid: state.clientKeyToUid,
    };
  }

  const rootSpec: FlowSurfaceNodeSpec = {
    uid: currentTree.uid,
    use: currentTree.use,
    popup: spec.popup,
    props: spec.props,
    decoratorProps: spec.decoratorProps,
    stepParams: spec.stepParams,
    flowRegistry: spec.flowRegistry,
    subModels: spec.subModels,
  };

  syncExistingNode(
    ops,
    state,
    {
      uidRef: currentTree.uid,
      use: currentTree.use,
    },
    currentTree,
    rootSpec,
    target,
  );
  return {
    ops,
    clientKeyToUid: state.clientKeyToUid,
  };
}

function syncExistingNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  nodeRef: CompiledNodeRef,
  currentNode: any,
  desiredNode: FlowSurfaceNodeSpec,
  explicitTarget?: FlowSurfaceWriteTarget,
) {
  const popupAwareDesiredNode = withApplyPopupOpenViewForExistingNode(
    desiredNode,
    `flowSurfaces apply node '${desiredNode.use}'`,
  );
  emitDomainSettingOps(ops, nodeRef, currentNode, popupAwareDesiredNode, explicitTarget);
  const childSync = syncChildren(ops, state, nodeRef, currentNode, popupAwareDesiredNode);
  emitLayoutOp(ops, explicitTarget || { uid: nodeRef.uidRef }, currentNode, popupAwareDesiredNode, childSync);
}

function syncCreatedNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  nodeRef: CompiledNodeRef,
  desiredNode: FlowSurfaceNodeSpec,
) {
  emitDomainSettingOps(ops, nodeRef, null, desiredNode);
  const childSync = syncChildren(ops, state, nodeRef, null, desiredNode);
  emitLayoutOp(ops, { uid: nodeRef.uidRef }, null, desiredNode, childSync);
}

function syncRoutePageNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  target: FlowSurfaceWriteTarget,
  currentNode: any,
  desiredNode: FlowSurfaceApplySpec,
) {
  const pageTarget = { uid: String(target.uid || currentNode.uid || '').trim() };
  syncPageNode(ops, state, pageTarget, currentNode, desiredNode);
}

function syncPageNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  pageTarget: FlowSurfaceWriteTarget,
  currentNode: any,
  desiredNode: FlowSurfaceApplySpec,
) {
  emitDomainSettingOps(
    ops,
    {
      uidRef: currentNode.uid,
      use: currentNode.use,
    },
    currentNode,
    {
      uid: currentNode.uid,
      use: currentNode.use,
      props: desiredNode.props,
      decoratorProps: desiredNode.decoratorProps,
      stepParams: desiredNode.stepParams,
      flowRegistry: desiredNode.flowRegistry,
    },
    pageTarget,
  );

  if (!hasExplicitSubModelKey(desiredNode, 'tabs')) {
    return;
  }

  const hasTabsSpec = Object.prototype.hasOwnProperty.call(desiredNode.subModels || {}, 'tabs');
  if (!hasTabsSpec) {
    return;
  }

  const desiredTabs = normalizeChildren(desiredNode.subModels?.tabs);
  const currentTabs = normalizeChildren(currentNode.subModels?.tabs);
  const tabMatchPlan = planArrayChildMatches(currentTabs, desiredTabs, currentNode.use, 'tabs');
  const desiredRefs: CompiledNodeRef[] = [];

  for (const [desiredIndex, desiredTab] of desiredTabs.entries()) {
    const currentMatch = tabMatchPlan.matchesByDesiredIndex.get(desiredIndex);
    if (currentMatch) {
      bindClientKey(state, desiredTab.clientKey, currentMatch.uid);
      desiredRefs.push({
        uidRef: currentMatch.uid,
        use: currentMatch.use,
      });
      syncRouteTabNode(ops, state, { uid: currentMatch.uid }, currentMatch, desiredTab);
      continue;
    }

    const opId = nextOpId(state, 'addTab');
    ops.push({
      opId,
      type: 'addTab',
      values: {
        target: pageTarget,
        ...(desiredTab.clientKey ? { clientKey: desiredTab.clientKey } : {}),
        title:
          desiredTab?.stepParams?.pageTabSettings?.tab?.title ||
          desiredTab?.props?.title ||
          desiredTab?.props?.route?.title ||
          'Untitled',
        icon: desiredTab?.stepParams?.pageTabSettings?.tab?.icon || desiredTab?.props?.icon,
        documentTitle: desiredTab?.stepParams?.pageTabSettings?.tab?.documentTitle,
        flowRegistry: desiredTab?.flowRegistry,
      },
    });
    const createdRef: CompiledNodeRef = {
      uidRef: makeOpRef(`${opId}.tabSchemaUid`),
      use: 'RootPageTabModel',
      sourceOpId: opId,
    };
    desiredRefs.push(createdRef);
    syncCreatedNode(ops, state, createdRef, desiredTab);
  }

  for (const currentTab of currentTabs) {
    if (!tabMatchPlan.matchedCurrentUids.has(currentTab.uid)) {
      ops.push({
        type: 'removeTab',
        values: {
          uid: currentTab.uid,
        },
      });
    }
  }

  emitMoveTabOps(ops, desiredRefs);
}

function syncRouteTabNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  target: FlowSurfaceWriteTarget,
  currentNode: any,
  desiredNode: FlowSurfaceApplySpec,
) {
  const tabTarget = { uid: String(target.uid || currentNode.uid || '').trim() };
  syncTabNode(ops, state, tabTarget, currentNode, desiredNode);
}

function syncTabNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  tabTarget: FlowSurfaceWriteTarget,
  currentNode: any,
  desiredNode: FlowSurfaceApplySpec,
) {
  emitDomainSettingOps(
    ops,
    {
      uidRef: currentNode.uid,
      use: currentNode.use,
    },
    currentNode,
    {
      uid: currentNode.uid,
      use: currentNode.use,
      props: desiredNode.props,
      decoratorProps: desiredNode.decoratorProps,
      stepParams: desiredNode.stepParams,
      flowRegistry: desiredNode.flowRegistry,
    },
    tabTarget,
  );

  if (!hasExplicitSubModelKey(desiredNode, 'grid')) {
    return;
  }

  const hasGridSpec = Object.prototype.hasOwnProperty.call(desiredNode.subModels || {}, 'grid');
  if (!hasGridSpec) {
    return;
  }

  const desiredGrid = normalizeChildren(desiredNode.subModels?.grid)[0];
  const currentGrid = normalizeChildren(currentNode.subModels?.grid)[0];

  if (!desiredGrid || !currentGrid) {
    return;
  }

  syncExistingNode(
    ops,
    state,
    {
      uidRef: currentGrid.uid,
      use: currentGrid.use,
    },
    currentGrid,
    desiredGrid,
    { uid: currentGrid.uid },
  );
}

function syncChildren(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  parentRef: CompiledNodeRef,
  currentParent: any,
  desiredParent: FlowSurfaceNodeSpec,
) {
  const result: SyncChildrenResult = {
    childClientKeyRefs: {},
    finalItemRefs: [],
    itemsChanged: false,
    itemsSpecified: false,
  };
  const desiredSubModels = desiredParent.subModels;
  if (!desiredSubModels) {
    return result;
  }
  const currentSubModels = currentParent?.subModels || {};
  const subKeys = Object.keys(desiredSubModels);

  for (const subKey of subKeys) {
    const desiredRaw = desiredSubModels[subKey];
    const currentRaw = currentSubModels[subKey];
    const desiredChildren = normalizeChildren(desiredRaw);
    const currentChildren = normalizeChildren(currentRaw);
    const isArraySubModel = Array.isArray(desiredRaw) || Array.isArray(currentRaw);

    if (parentRef.use === 'ChildPageModel' && subKey === 'tabs') {
      const tabSync = syncPopupTabs(ops, state, parentRef, currentChildren, desiredChildren);
      if (tabSync.itemsSpecified) {
        result.finalItemRefs = tabSync.finalItemRefs;
        result.itemsChanged = tabSync.itemsChanged;
        result.itemsSpecified = true;
      }
      Object.assign(result.childClientKeyRefs, tabSync.childClientKeyRefs);
      continue;
    }

    if (!isArraySubModel) {
      const desiredChild = desiredChildren[0];
      const currentChild = currentChildren[0];
      if (!desiredChild && currentChild) {
        ops.push({
          type: 'removeNode',
          target: { uid: currentChild.uid },
        });
        continue;
      }
      if (!desiredChild) {
        continue;
      }

      if (currentChild && matchesObjectChild(currentChild, desiredChild)) {
        bindClientKey(state, desiredChild.clientKey, currentChild.uid);
        if (desiredChild.clientKey) {
          result.childClientKeyRefs[desiredChild.clientKey] = currentChild.uid;
        }
        syncExistingNode(
          ops,
          state,
          {
            uidRef: currentChild.uid,
            use: currentChild.use,
          },
          currentChild,
          desiredChild,
        );
        continue;
      }

      if (currentChild) {
        ops.push({
          type: 'removeNode',
          target: { uid: currentChild.uid },
        });
      }

      const defaultRef = getDefaultChildRef(parentRef, subKey, desiredChild.use);
      if (defaultRef) {
        if (desiredChild.clientKey) {
          result.childClientKeyRefs[desiredChild.clientKey] = defaultRef.uidRef;
        }
        syncCreatedNode(ops, state, defaultRef, desiredChild);
      } else {
        const createdRef = createDesiredChild(ops, state, parentRef, subKey, desiredChild, currentParent);
        if (desiredChild.clientKey) {
          result.childClientKeyRefs[desiredChild.clientKey] = createdRef.uidRef;
        }
      }
      continue;
    }

    const childMatchPlan = planArrayChildMatches(currentChildren, desiredChildren, parentRef.use, subKey);
    const desiredRefs: CompiledNodeRef[] = [];

    for (const [desiredIndex, desiredChild] of desiredChildren.entries()) {
      const currentMatch = childMatchPlan.matchesByDesiredIndex.get(desiredIndex);

      if (currentMatch) {
        const currentRef = {
          uidRef: currentMatch.uid,
          use: currentMatch.use,
        };
        bindClientKey(state, desiredChild.clientKey, currentMatch.uid);
        if (desiredChild.clientKey) {
          result.childClientKeyRefs[desiredChild.clientKey] = currentRef.uidRef;
        }
        desiredRefs.push(currentRef);
        syncExistingNode(ops, state, currentRef, currentMatch, desiredChild);
        continue;
      }

      const defaultRef = getDefaultChildRef(parentRef, subKey, desiredChild.use);
      if (defaultRef) {
        if (desiredChild.clientKey) {
          result.childClientKeyRefs[desiredChild.clientKey] = defaultRef.uidRef;
        }
        desiredRefs.push(defaultRef);
        syncCreatedNode(ops, state, defaultRef, desiredChild);
        continue;
      }

      const createdRef = createDesiredChild(ops, state, parentRef, subKey, desiredChild, currentParent);
      if (desiredChild.clientKey) {
        result.childClientKeyRefs[desiredChild.clientKey] = createdRef.uidRef;
      }
      desiredRefs.push(createdRef);
    }

    for (const currentChild of currentChildren) {
      if (!childMatchPlan.matchedCurrentUids.has(currentChild.uid)) {
        ops.push({
          type: 'removeNode',
          target: { uid: currentChild.uid },
        });
      }
    }

    emitMoveOps(ops, desiredRefs);

    if (subKey === 'items') {
      result.finalItemRefs = desiredRefs;
      result.itemsChanged = didItemRefsChange(currentChildren, desiredRefs);
      result.itemsSpecified = true;
    }
  }

  return result;
}

function createDesiredChild(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  parentRef: CompiledNodeRef,
  subKey: string,
  desiredChild: FlowSurfaceNodeSpec,
  currentParent?: any,
): CompiledNodeRef {
  if (desiredChild.use === 'ChildPageModel' && isPopupHostUse(parentRef.use)) {
    compilePopupPageSpec(ops, state, parentRef, desiredChild);
    return {
      uidRef: parentRef.uidRef,
      use: desiredChild.use,
      sourceOpId: parentRef.sourceOpId,
    };
  }

  if (
    (isFieldWrapperNode(desiredChild.use) || STANDALONE_FIELD_USES.has(desiredChild.use)) &&
    isFieldContainer(parentRef.use, subKey)
  ) {
    return createFieldNode(ops, state, parentRef, desiredChild);
  }

  if (subKey === 'actions' && isActionContainer(parentRef.use)) {
    if (!ACTION_USES.has(desiredChild.use)) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces apply action '${desiredChild.use}' is not a public capability`,
      );
    }
    return createActionNode(ops, state, parentRef, desiredChild, currentParent);
  }

  if (isBlockContainer(parentRef.use, subKey)) {
    if (!BLOCK_USES.has(desiredChild.use)) {
      throw new FlowSurfaceBadRequestError(`flowSurfaces apply block '${desiredChild.use}' is not a public capability`);
    }
    return createBlockNode(ops, state, parentRef, desiredChild);
  }

  if (
    isFieldContainer(parentRef.use, subKey) &&
    !FIELD_WRAPPER_USES.has(desiredChild.use) &&
    !STANDALONE_FIELD_USES.has(desiredChild.use)
  ) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces apply field wrapper '${desiredChild.use}' is not a public capability`,
    );
  }

  throw new FlowSurfaceBadRequestError(
    `flowSurfaces apply cannot create '${desiredChild.use}' under '${parentRef.use}.${subKey}'`,
  );
}

function createBlockNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  parentRef: CompiledNodeRef,
  desiredNode: FlowSurfaceNodeSpec,
) {
  const blockCatalogItem = resolveSupportedBlockCatalogItem(
    {
      use: desiredNode.use,
    },
    {
      requireCreateSupported: true,
    },
  );
  const opId = nextOpId(state, 'addBlock');
  ops.push({
    opId,
    type: 'addBlock',
    values: {
      target: {
        uid: parentRef.uidRef,
      },
      ...(desiredNode.clientKey ? { clientKey: desiredNode.clientKey } : {}),
      type: blockCatalogItem.key,
      resourceInit: extractResourceInit(desiredNode),
    },
  });

  const ref: CompiledNodeRef = {
    uidRef: makeOpRef(`${opId}.uid`),
    use: desiredNode.use,
    sourceOpId: opId,
  };
  syncCreatedNode(ops, state, ref, desiredNode);
  return ref;
}

function normalizeApplyPopup(desiredNode: FlowSurfaceNodeSpec, context: string): Record<string, any> | undefined {
  if (_.isUndefined(desiredNode.popup)) {
    return undefined;
  }
  if (!_.isPlainObject(desiredNode.popup)) {
    throw new FlowSurfaceBadRequestError(`${context} popup must be an object`);
  }

  const invalidKeys = Object.keys(desiredNode.popup).filter((key) => !APPLY_POPUP_ALLOWED_KEYS.has(key));
  if (invalidKeys.length) {
    throw new FlowSurfaceBadRequestError(
      `${context} popup only supports ${Array.from(APPLY_POPUP_ALLOWED_KEYS).join(', ')} in flowSurfaces apply`,
    );
  }

  const hasPopupPageSpec = !!normalizeChildren(desiredNode.subModels?.page)[0];
  if (hasPopupPageSpec) {
    throw new FlowSurfaceBadRequestError(
      `${context} cannot mix popup template semantics with explicit popup subtree content in flowSurfaces apply`,
    );
  }

  const nextPopup = _.cloneDeep(desiredNode.popup);
  if (!_.isUndefined(nextPopup.tryTemplate) && typeof nextPopup.tryTemplate !== 'boolean') {
    throw new FlowSurfaceBadRequestError(`${context} popup.tryTemplate must be a boolean`);
  }
  if (!_.isUndefined(nextPopup.defaultType) && nextPopup.defaultType !== 'view' && nextPopup.defaultType !== 'edit') {
    throw new FlowSurfaceBadRequestError(`${context} popup.defaultType must be 'view' or 'edit'`);
  }

  if (_.isUndefined(nextPopup.template) && nextPopup.tryTemplate !== true && _.isUndefined(nextPopup.defaultType)) {
    return undefined;
  }
  if (!isPopupHostUse(desiredNode.use)) {
    throw new FlowSurfaceBadRequestError(
      `${context} popup is only supported on popup-capable action or field nodes in flowSurfaces apply`,
    );
  }
  return nextPopup;
}

function buildApplyPopupStepParams(use: string, popup: Record<string, any> | undefined) {
  if (!popup) {
    return undefined;
  }
  if (use === 'UploadActionModel') {
    return {
      selectExitRecordSettings: {
        openView: popup,
      },
    };
  }
  return {
    popupSettings: {
      openView: popup,
    },
  };
}

function withApplyPopupOpenViewForExistingNode(desiredNode: FlowSurfaceNodeSpec, context: string): FlowSurfaceNodeSpec {
  const popup = normalizeApplyPopup(desiredNode, context);
  if (!popup) {
    return desiredNode;
  }
  return {
    ...desiredNode,
    stepParams: _.merge({}, desiredNode.stepParams || {}, buildApplyPopupStepParams(desiredNode.use, popup)),
  };
}

function createActionNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  parentRef: CompiledNodeRef,
  desiredNode: FlowSurfaceNodeSpec,
  currentParent?: any,
) {
  const popup = normalizeApplyPopup(desiredNode, `flowSurfaces apply action '${desiredNode.use}'`);
  const actionCatalogItem = resolveSupportedActionCatalogItem(
    {
      use: desiredNode.use,
      containerUse: parentRef.use,
    },
    {
      requireCreateSupported: true,
    },
  );
  const opType = actionCatalogItem.scope === 'record' ? 'addRecordAction' : 'addAction';
  const targetUidRef =
    actionCatalogItem.scope === 'record'
      ? resolveRecordActionCreateTargetUidRef(parentRef, currentParent)
      : parentRef.uidRef;
  const opId = nextOpId(state, opType);
  ops.push({
    opId,
    type: opType,
    values: {
      target: {
        uid: targetUidRef,
      },
      ...(desiredNode.clientKey ? { clientKey: desiredNode.clientKey } : {}),
      type: actionCatalogItem.key,
      resourceInit: extractResourceInit(desiredNode),
      ...(popup ? { popup } : {}),
    },
  });

  const ref: CompiledNodeRef = {
    uidRef: makeOpRef(`${opId}.uid`),
    use: desiredNode.use,
    sourceOpId: opId,
  };
  syncCreatedNode(ops, state, ref, desiredNode);
  return ref;
}

function createFieldNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  parentRef: CompiledNodeRef,
  desiredNode: FlowSurfaceNodeSpec,
) {
  const popup = normalizeApplyPopup(desiredNode, `flowSurfaces apply field '${desiredNode.use}'`);
  const standaloneType =
    desiredNode.use === 'JSColumnModel'
      ? 'jsColumn'
      : desiredNode.use === 'JSItemModel'
        ? 'jsItem'
        : desiredNode.use === 'DividerItemModel'
          ? 'divider'
          : undefined;
  if (standaloneType) {
    if (popup) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces apply field '${desiredNode.use}' popup is not supported for standalone field types`,
      );
    }
    const opId = nextOpId(state, 'addField');
    ops.push({
      opId,
      type: 'addField',
      values: {
        target: {
          uid: parentRef.uidRef,
        },
        ...(desiredNode.clientKey ? { clientKey: desiredNode.clientKey } : {}),
        type: standaloneType,
      },
    });

    const ref: CompiledNodeRef = {
      uidRef: makeOpRef(`${opId}.uid`),
      use: desiredNode.use,
      sourceOpId: opId,
    };
    syncCreatedNode(ops, state, ref, desiredNode);
    return ref;
  }

  const innerField = normalizeChildren(desiredNode.subModels?.field)[0];
  const requestedRenderer =
    innerField?.use === 'JSFieldModel' || innerField?.use === 'JSEditableFieldModel' ? 'js' : undefined;
  const fieldCapability = resolveSupportedFieldCapability({
    containerUse: parentRef.use,
    requestedWrapperUse: desiredNode.use,
    requestedFieldUse: innerField?.use,
    requestedRenderer,
    allowUnresolvedFieldUse: true,
  });
  const fieldInit =
    _.get(innerField, ['stepParams', 'fieldSettings', 'init']) ||
    _.get(desiredNode, ['stepParams', 'fieldSettings', 'init']);
  const defaultTargetUid = _.get(desiredNode, ['stepParams', 'filterFormItemSettings', 'init', 'defaultTargetUid']);
  if (!fieldInit?.fieldPath) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces apply field '${desiredNode.use}' requires stepParams.fieldSettings.init.fieldPath`,
    );
  }

  const opId = nextOpId(state, 'addField');
  ops.push({
    opId,
    type: 'addField',
    values: {
      target: {
        uid: parentRef.uidRef,
      },
      ...(desiredNode.clientKey ? { clientKey: desiredNode.clientKey } : {}),
      fieldPath: fieldInit.fieldPath,
      associationPathName: fieldInit.associationPathName,
      dataSourceKey: fieldInit.dataSourceKey,
      collectionName: fieldInit.collectionName,
      ...(requestedRenderer ? { renderer: requestedRenderer } : {}),
      ...(fieldCapability.fieldUse ? { fieldUse: fieldCapability.fieldUse } : {}),
      ...(defaultTargetUid ? { defaultTargetUid } : {}),
      ...(popup ? { popup } : {}),
    },
  });

  const ref: CompiledNodeRef = {
    uidRef: makeOpRef(`${opId}.wrapperUid`),
    use: desiredNode.use,
    sourceOpId: opId,
  };
  syncCreatedNode(ops, state, ref, desiredNode);
  return ref;
}

function compilePopupPageSpec(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  hostRef: CompiledNodeRef,
  pageSpec: FlowSurfaceNodeSpec,
) {
  const tabSpec = normalizeChildren(pageSpec.subModels?.tabs)[0];
  const gridSpec = normalizeChildren(tabSpec?.subModels?.grid)[0];
  const popupItems = normalizeChildren(gridSpec?.subModels?.items);
  if (!tabSpec || !gridSpec) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces apply popup page creation under '${hostRef.use}' requires popup page -> tab -> grid`,
    );
  }

  const { childRefs, childClientKeyRefs, popupGridUidRef, popupPageRef, popupTabRef, placeholderRef } =
    bootstrapPopupShellCreation(ops, state, hostRef, pageSpec, tabSpec, popupItems);

  if (popupPageRef) {
    emitDomainSettingOps(ops, popupPageRef, null, pageSpec);
  }
  if (popupTabRef) {
    emitDomainSettingOps(ops, popupTabRef, null, tabSpec);
  }
  if (popupGridUidRef) {
    emitDomainSettingOps(
      ops,
      {
        uidRef: popupGridUidRef,
        use: gridSpec.use,
      },
      null,
      gridSpec,
    );
    if (placeholderRef) {
      ops.push({
        type: 'removeNode',
        values: {
          target: {
            uid: placeholderRef.uidRef,
          },
        },
      });
    }
    emitLayoutOp(ops, { uid: popupGridUidRef }, null, gridSpec, {
      childClientKeyRefs,
      finalItemRefs: childRefs,
      itemsChanged: true,
      itemsSpecified: true,
    });
    emitMoveOps(ops, childRefs);
  }
}

function bootstrapPopupShellCreation(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  hostRef: CompiledNodeRef,
  pageSpec: FlowSurfaceNodeSpec,
  tabSpec: FlowSurfaceNodeSpec,
  popupItems: FlowSurfaceNodeSpec[],
): PopupShellBootstrapResult {
  const result: PopupShellBootstrapResult = {
    childRefs: [],
    childClientKeyRefs: {},
    popupGridUidRef: null,
    popupPageRef: null,
    popupTabRef: null,
    placeholderRef: null,
  };

  const bindPopupShellRefs = (created: CompiledNodeRef) => {
    result.popupPageRef = {
      uidRef: makeOpRef(`${created.sourceOpId}.popupPageUid`),
      use: pageSpec.use,
    };
    result.popupTabRef = {
      uidRef: makeOpRef(`${created.sourceOpId}.popupTabUid`),
      use: tabSpec.use,
      sourceOpId: created.sourceOpId,
    };
    result.popupGridUidRef = makeOpRef(`${created.sourceOpId}.popupGridUid`);
  };

  if (!popupItems.length) {
    result.placeholderRef = createBlockNode(ops, state, hostRef, {
      use: 'MarkdownBlockModel',
    });
    bindPopupShellRefs(result.placeholderRef);
    return result;
  }

  popupItems.forEach((itemSpec, index) => {
    if (index === 0) {
      const created = createBlockNode(ops, state, hostRef, itemSpec);
      result.childRefs.push(created);
      if (itemSpec.clientKey) {
        result.childClientKeyRefs[itemSpec.clientKey] = created.uidRef;
      }
      bindPopupShellRefs(created);
      return;
    }

    const popupGridRef: CompiledNodeRef = {
      uidRef: result.popupGridUidRef,
      use: 'BlockGridModel',
    };
    const created = createBlockNode(ops, state, popupGridRef, itemSpec);
    if (itemSpec.clientKey) {
      result.childClientKeyRefs[itemSpec.clientKey] = created.uidRef;
    }
    result.childRefs.push(created);
  });

  return result;
}

function emitDomainSettingOps(
  ops: FlowSurfaceMutateOp[],
  nodeRef: CompiledNodeRef,
  currentNode: any,
  desiredNode: FlowSurfaceNodeSpec,
  explicitTarget?: FlowSurfaceWriteTarget,
) {
  const props = omitLayoutProps(desiredNode.props);
  const currentProps = omitLayoutProps(currentNode?.props);
  const values: Record<string, any> = {};

  if (!_.isNil(props) && !_.isEqual(props, currentProps)) {
    values.props = props;
  }
  if (!_.isNil(desiredNode.decoratorProps) && !_.isEqual(desiredNode.decoratorProps, currentNode?.decoratorProps)) {
    values.decoratorProps = desiredNode.decoratorProps;
  }
  if (!_.isNil(desiredNode.stepParams) && !_.isEqual(desiredNode.stepParams, currentNode?.stepParams)) {
    values.stepParams = desiredNode.stepParams;
  }

  if (Object.keys(values).length) {
    ops.push({
      type: 'updateSettings',
      target: explicitTarget || { uid: nodeRef.uidRef },
      values,
    });
  }

  if (!_.isNil(desiredNode.flowRegistry) && !_.isEqual(desiredNode.flowRegistry, currentNode?.flowRegistry)) {
    ops.push({
      type: 'setEventFlows',
      target: explicitTarget || { uid: nodeRef.uidRef },
      values: {
        flowRegistry: desiredNode.flowRegistry,
      },
    });
  }
}

function getDefaultChildRef(parentRef: CompiledNodeRef, subKey: string, childUse?: string): CompiledNodeRef | null {
  if (!parentRef.sourceOpId || !childUse) {
    return null;
  }

  if (FORM_BLOCK_USES.has(parentRef.use) && subKey === 'grid' && FORM_GRID_USES.has(childUse)) {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.gridUid`),
      use: childUse,
    };
  }

  if (DETAILS_BLOCK_USES.has(parentRef.use) && subKey === 'grid' && childUse === 'DetailsGridModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.gridUid`),
      use: childUse,
    };
  }

  if (FILTER_FORM_BLOCK_USES.has(parentRef.use) && subKey === 'grid' && childUse === 'FilterFormGridModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.gridUid`),
      use: childUse,
    };
  }

  if (parentRef.use === 'ChildPageTabModel' && subKey === 'grid' && childUse === 'BlockGridModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.popupGridUid`),
      use: childUse,
    };
  }

  if (parentRef.use === 'TableBlockModel' && subKey === 'columns' && childUse === 'TableActionsColumnModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.actionsColumnUid`),
      use: childUse,
      sourceOpId: parentRef.sourceOpId,
      ownerUidRef: parentRef.uidRef,
    };
  }

  if (parentRef.use === 'ListBlockModel' && subKey === 'item' && childUse === 'ListItemModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.itemUid`),
      use: childUse,
      sourceOpId: parentRef.sourceOpId,
      ownerUidRef: parentRef.uidRef,
    };
  }

  if (parentRef.use === 'GridCardBlockModel' && subKey === 'item' && childUse === 'GridCardItemModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.itemUid`),
      use: childUse,
      sourceOpId: parentRef.sourceOpId,
      ownerUidRef: parentRef.uidRef,
    };
  }

  if (parentRef.use === 'ListItemModel' && subKey === 'grid' && childUse === 'DetailsGridModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.gridUid`),
      use: childUse,
    };
  }

  if (parentRef.use === 'GridCardItemModel' && subKey === 'grid' && childUse === 'DetailsGridModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.gridUid`),
      use: childUse,
    };
  }

  if (FIELD_WRAPPER_USES.has(parentRef.use) && subKey === 'field') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.fieldUid`),
      use: childUse,
    };
  }

  if (parentRef.use === 'RootPageTabModel' && subKey === 'grid' && childUse === 'BlockGridModel') {
    return {
      uidRef: makeOpRef(`${parentRef.sourceOpId}.gridUid`),
      use: childUse,
    };
  }

  return null;
}

function resolveRecordActionCreateTargetUidRef(parentRef: CompiledNodeRef, currentParent?: any) {
  if (!RECORD_ACTION_INTERNAL_CONTAINER_USES.has(parentRef.use)) {
    return parentRef.uidRef;
  }

  const ownerUidRef = parentRef.ownerUidRef ?? currentParent?.parentId;
  if (ownerUidRef) {
    return ownerUidRef;
  }

  throw new FlowSurfaceBadRequestError(
    `flowSurfaces apply cannot resolve owning surface for record action container '${parentRef.use}'`,
  );
}

function isFieldWrapperNode(use?: string) {
  return isFieldWrapperUse(use);
}

function isFieldContainer(parentUse?: string, subKey?: string) {
  return isFieldContainerUse(parentUse, subKey);
}

function isBlockContainer(parentUse?: string, subKey?: string) {
  return isBlockContainerUse(parentUse, subKey);
}

function isActionContainer(parentUse?: string) {
  return isActionContainerUse(parentUse);
}

function extractResourceInit(node: FlowSurfaceNodeSpec) {
  return _.get(node, ['stepParams', 'resourceSettings', 'init']);
}

function nextOpId(state: CompilerState, prefix: string) {
  state.seq += 1;
  return `${prefix}_${state.seq}`;
}

function bindClientKey(state: CompilerState, clientKey: string | undefined, uid: any) {
  if (!clientKey || typeof uid !== 'string') {
    return;
  }
  state.clientKeyToUid[clientKey] = uid;
}

function syncPopupTabs(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  popupPageRef: CompiledNodeRef,
  currentTabs: FlowSurfaceNodeSpec[],
  desiredTabs: FlowSurfaceNodeSpec[],
): SyncChildrenResult {
  const result: SyncChildrenResult = {
    childClientKeyRefs: {},
    finalItemRefs: [],
    itemsChanged: false,
    itemsSpecified: false,
  };
  const tabMatchPlan = planArrayChildMatches(currentTabs, desiredTabs, popupPageRef.use, 'tabs');
  const desiredRefs: CompiledNodeRef[] = [];

  for (const [desiredIndex, desiredTab] of desiredTabs.entries()) {
    const currentMatch = tabMatchPlan.matchesByDesiredIndex.get(desiredIndex);
    if (currentMatch) {
      const currentRef = {
        uidRef: currentMatch.uid,
        use: currentMatch.use,
      };
      bindClientKey(state, desiredTab.clientKey, currentMatch.uid);
      if (desiredTab.clientKey) {
        result.childClientKeyRefs[desiredTab.clientKey] = currentRef.uidRef;
      }
      desiredRefs.push(currentRef);
      syncTabNode(ops, state, { uid: currentMatch.uid }, currentMatch, desiredTab);
      continue;
    }

    const createdRef = createPopupTabNode(ops, state, popupPageRef, desiredTab);
    if (desiredTab.clientKey) {
      result.childClientKeyRefs[desiredTab.clientKey] = createdRef.uidRef;
    }
    desiredRefs.push(createdRef);
  }

  for (const currentTab of currentTabs) {
    if (!tabMatchPlan.matchedCurrentUids.has(currentTab.uid)) {
      ops.push({
        type: 'removePopupTab',
        values: {
          target: {
            uid: currentTab.uid,
          },
        },
      });
    }
  }

  emitMovePopupTabOps(ops, desiredRefs);
  return result;
}

function createPopupTabNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  popupPageRef: CompiledNodeRef,
  desiredNode: FlowSurfaceNodeSpec,
) {
  const opId = nextOpId(state, 'addPopupTab');
  ops.push({
    opId,
    type: 'addPopupTab',
    values: {
      target: {
        uid: popupPageRef.uidRef,
      },
      ...(desiredNode.clientKey ? { clientKey: desiredNode.clientKey } : {}),
      title:
        desiredNode?.stepParams?.pageTabSettings?.tab?.title ||
        desiredNode?.props?.title ||
        desiredNode?.props?.route?.title ||
        'Untitled',
      icon: desiredNode?.stepParams?.pageTabSettings?.tab?.icon || desiredNode?.props?.icon,
      documentTitle: desiredNode?.stepParams?.pageTabSettings?.tab?.documentTitle,
      flowRegistry: desiredNode?.flowRegistry,
    },
  });
  const ref: CompiledNodeRef = {
    uidRef: makeOpRef(`${opId}.popupTabUid`),
    use: 'ChildPageTabModel',
    sourceOpId: opId,
  };
  syncCreatedNode(ops, state, ref, desiredNode);
  return ref;
}
