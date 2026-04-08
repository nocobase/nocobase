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
} from './catalog';
import {
  FLOW_SURFACE_DETAILS_BLOCK_USES,
  FLOW_SURFACE_FILTER_FORM_BLOCK_USES,
  FLOW_SURFACE_FORM_BLOCK_USES,
  FLOW_SURFACE_FIELD_WRAPPER_USES,
  isActionContainerUse,
  isBlockContainerUse,
  isFieldContainerUse,
  isFieldWrapperUse,
  isGridUse,
  isPopupHostUse,
} from './placement';
import { FlowSurfaceBadRequestError } from './errors';
import type { FlowSurfaceApplySpec, FlowSurfaceMutateOp, FlowSurfaceNodeSpec, FlowSurfaceWriteTarget } from './types';

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

type ArrayChildMatchPlan = {
  matchesByDesiredIndex: Map<number, FlowSurfaceNodeSpec>;
  matchedCurrentUids: Set<string>;
};

function makeOpRef(path: string) {
  return { ref: path };
}

const FORM_GRID_USES = new Set(['FormGridModel', 'AssignFormGridModel']);
const ACTION_USES = new Set(Array.from(ACTION_KEY_BY_USE.keys()));
const BLOCK_USES = new Set(Array.from(BLOCK_KEY_BY_USE.keys()));
const FIELD_WRAPPER_USES = FLOW_SURFACE_FIELD_WRAPPER_USES;
const STANDALONE_FIELD_USES = new Set(['JSColumnModel', 'JSItemModel']);
const FORM_BLOCK_USES = FLOW_SURFACE_FORM_BLOCK_USES;
const DETAILS_BLOCK_USES = FLOW_SURFACE_DETAILS_BLOCK_USES;
const FILTER_FORM_BLOCK_USES = FLOW_SURFACE_FILTER_FORM_BLOCK_USES;
const RECORD_ACTION_INTERNAL_CONTAINER_USES = new Set([
  'TableActionsColumnModel',
  'ListItemModel',
  'GridCardItemModel',
]);

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
  emitDomainSettingOps(ops, nodeRef, currentNode, desiredNode, explicitTarget);
  const childSync = syncChildren(ops, state, nodeRef, currentNode, desiredNode);
  emitLayoutOp(ops, explicitTarget || { uid: nodeRef.uidRef }, currentNode, desiredNode, childSync);
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

function createActionNode(
  ops: FlowSurfaceMutateOp[],
  state: CompilerState,
  parentRef: CompiledNodeRef,
  desiredNode: FlowSurfaceNodeSpec,
  currentParent?: any,
) {
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
  const standaloneType =
    desiredNode.use === 'JSColumnModel' ? 'jsColumn' : desiredNode.use === 'JSItemModel' ? 'jsItem' : undefined;
  if (standaloneType) {
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

function emitLayoutOp(
  ops: FlowSurfaceMutateOp[],
  target: FlowSurfaceWriteTarget,
  currentNode: any,
  desiredNode: Pick<FlowSurfaceNodeSpec, 'props' | 'use'>,
  childSync: SyncChildrenResult,
) {
  const explicitLayout = resolveLayoutRefs(extractLayout(desiredNode.props), childSync.childClientKeyRefs);
  const desiredLayout =
    explicitLayout ||
    (isGridNode(currentNode?.use || desiredNode.use) && childSync.itemsSpecified
      ? buildAutoLayout(childSync.finalItemRefs.map((item) => item.uidRef))
      : null);
  if (!desiredLayout) {
    return;
  }
  if (!hasRefValue(desiredLayout) && _.isEqual(desiredLayout, extractLayout(currentNode?.props))) {
    return;
  }
  ops.push({
    type: 'setLayout',
    target,
    values: desiredLayout,
  });
}

function emitMoveOps(ops: FlowSurfaceMutateOp[], desiredRefs: CompiledNodeRef[]) {
  for (let index = desiredRefs.length - 2; index >= 0; index -= 1) {
    ops.push({
      type: 'moveNode',
      values: {
        sourceUid: desiredRefs[index].uidRef,
        targetUid: desiredRefs[index + 1].uidRef,
        position: 'before',
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

function normalizeChildren(input: any): FlowSurfaceNodeSpec[] {
  if (!input) {
    return [];
  }
  return _.castArray(input as any).filter(Boolean) as FlowSurfaceNodeSpec[];
}

function hasExplicitSubModelKey(node: Pick<FlowSurfaceNodeSpec, 'subModels'> | FlowSurfaceApplySpec, key: string) {
  return !!node?.subModels && Object.prototype.hasOwnProperty.call(node.subModels, key);
}

function matchesObjectChild(currentChild: any, desiredChild: FlowSurfaceNodeSpec) {
  return currentChild.uid === desiredChild.uid || (!desiredChild.uid && currentChild.use === desiredChild.use);
}

function planArrayChildMatches(
  currentChildren: FlowSurfaceNodeSpec[],
  desiredChildren: FlowSurfaceNodeSpec[],
  parentUse: string,
  subKey: string,
): ArrayChildMatchPlan {
  const matchesByDesiredIndex = new Map<number, FlowSurfaceNodeSpec>();
  const matchedCurrentUids = new Set<string>();
  const remainingDesiredByUse = new Map<string, number[]>();

  for (const [desiredIndex, desiredChild] of desiredChildren.entries()) {
    const matchedCurrent = findExactArrayChildMatch(currentChildren, desiredChild, matchedCurrentUids);
    if (matchedCurrent) {
      matchesByDesiredIndex.set(desiredIndex, matchedCurrent);
      if (matchedCurrent.uid) {
        matchedCurrentUids.add(matchedCurrent.uid);
      }
      continue;
    }

    if (desiredChild?.use && !desiredChild.uid) {
      const desiredIndexes = remainingDesiredByUse.get(desiredChild.use) || [];
      desiredIndexes.push(desiredIndex);
      remainingDesiredByUse.set(desiredChild.use, desiredIndexes);
    }
  }

  const remainingCurrentByUse = new Map<string, FlowSurfaceNodeSpec[]>();
  for (const currentChild of currentChildren) {
    if (!currentChild?.use || matchedCurrentUids.has(currentChild.uid || '')) {
      continue;
    }
    const currentGroup = remainingCurrentByUse.get(currentChild.use) || [];
    currentGroup.push(currentChild);
    remainingCurrentByUse.set(currentChild.use, currentGroup);
  }

  const uses = new Set<string>([...remainingCurrentByUse.keys(), ...remainingDesiredByUse.keys()]);
  for (const use of uses) {
    const currentGroup = remainingCurrentByUse.get(use) || [];
    const desiredIndexes = remainingDesiredByUse.get(use) || [];
    const shouldReuseByOrder = currentGroup.length > 1 || desiredIndexes.length > 1;
    // Reuse unresolved same-use siblings by persisted order only when the pairing is deterministic.
    if (
      currentGroup.length > 0 &&
      desiredIndexes.length > 0 &&
      currentGroup.length !== desiredIndexes.length &&
      shouldReuseByOrder
    ) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces apply cannot safely match duplicate '${use}' nodes under '${parentUse}.${subKey}' without explicit uid or signature`,
      );
    }

    if (!shouldReuseByOrder) {
      continue;
    }

    const reuseCount = Math.min(currentGroup.length, desiredIndexes.length);
    for (let index = 0; index < reuseCount; index += 1) {
      const currentChild = currentGroup[index];
      const desiredIndex = desiredIndexes[index];
      matchesByDesiredIndex.set(desiredIndex, currentChild);
      if (currentChild?.uid) {
        matchedCurrentUids.add(currentChild.uid);
      }
    }
  }

  return {
    matchesByDesiredIndex,
    matchedCurrentUids,
  };
}

function findExactArrayChildMatch(
  currentChildren: FlowSurfaceNodeSpec[],
  desiredChild: FlowSurfaceNodeSpec,
  matchedCurrent: Set<string>,
) {
  if (desiredChild.uid) {
    return currentChildren.find((item) => item?.uid === desiredChild.uid);
  }

  const desiredStrongSignature = getStrongNodeSignature(desiredChild);
  if (desiredStrongSignature) {
    return currentChildren.find(
      (item) => !matchedCurrent.has(item.uid || '') && getStrongNodeSignature(item) === desiredStrongSignature,
    );
  }

  const desiredWeakSignature = getWeakNodeSignature(desiredChild);
  if (desiredWeakSignature) {
    return currentChildren.find(
      (item) => !matchedCurrent.has(item.uid || '') && getWeakNodeSignature(item) === desiredWeakSignature,
    );
  }

  return undefined;
}

function getStrongNodeSignature(node: any) {
  if (!node?.use) {
    return null;
  }

  const resourceInit = _.get(node, ['stepParams', 'resourceSettings', 'init']);
  if (
    resourceInit?.dataSourceKey ||
    resourceInit?.collectionName ||
    resourceInit?.associationName ||
    resourceInit?.associationPathName ||
    !_.isUndefined(resourceInit?.sourceId)
  ) {
    return [
      'resource',
      node.use,
      resourceInit.dataSourceKey || '',
      resourceInit.collectionName || '',
      resourceInit.associationName || '',
      resourceInit.associationPathName || '',
      _.isUndefined(resourceInit.sourceId) ? '' : String(resourceInit.sourceId),
    ].join(':');
  }

  const fieldInit =
    _.get(node, ['stepParams', 'fieldSettings', 'init']) ||
    _.get(node, ['subModels', 'field', 'stepParams', 'fieldSettings', 'init']);
  if (fieldInit?.fieldPath) {
    return [
      'field',
      node.use,
      fieldInit.dataSourceKey || '',
      fieldInit.collectionName || '',
      fieldInit.associationPathName || '',
      fieldInit.fieldPath,
    ].join(':');
  }

  if (node.use === 'TableActionsColumnModel') {
    return 'slot:table-actions-column';
  }

  return null;
}

function getWeakNodeSignature(node: any) {
  if (!node?.use) {
    return null;
  }

  const title =
    _.get(node, ['stepParams', 'pageTabSettings', 'tab', 'title']) ||
    _.get(node, ['stepParams', 'buttonSettings', 'general', 'title']) ||
    _.get(node, ['props', 'title']);

  if (typeof title === 'string' && title.trim()) {
    return ['title', node.use, title.trim()].join(':');
  }

  return null;
}

function isFieldWrapperNode(use?: string) {
  return isFieldWrapperUse(use);
}

function isGridNode(use?: string) {
  return isGridUse(use);
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

function extractLayout(props?: Record<string, any>) {
  if (!props || (!('rows' in props) && !('sizes' in props) && !('rowOrder' in props))) {
    return null;
  }
  return {
    rows: props.rows || {},
    sizes: props.sizes || {},
    rowOrder: props.rowOrder || Object.keys(props.rows || {}),
  };
}

function omitLayoutProps(props?: Record<string, any>) {
  if (!props) {
    return props;
  }
  const next = _.omit(props, ['rows', 'sizes', 'rowOrder']);
  return Object.keys(next).length ? next : undefined;
}

function resolveLayoutRefs(layout: ReturnType<typeof extractLayout>, childClientKeyRefs: Record<string, any>) {
  if (!layout) {
    return layout;
  }
  return {
    rows: Object.fromEntries(
      Object.entries(layout.rows || {}).map(([rowId, cells]) => [
        rowId,
        _.castArray(cells).map((cell) =>
          _.castArray(cell).map((itemUid) => childClientKeyRefs[itemUid as string] ?? itemUid),
        ),
      ]),
    ),
    sizes: layout.sizes || {},
    rowOrder: layout.rowOrder || [],
  };
}

function hasRefValue(value: any): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasRefValue(item));
  }
  if (_.isPlainObject(value)) {
    if (typeof value.ref === 'string') {
      return true;
    }
    return Object.values(value).some((item) => hasRefValue(item));
  }
  return false;
}

export function buildAutoLayout(itemRefs: any[]) {
  if (!itemRefs.length) {
    return {
      rows: {},
      sizes: {},
      rowOrder: [],
    };
  }
  return {
    rows: Object.fromEntries(itemRefs.map((itemRef, index) => [`autoRow${index + 1}`, [[itemRef]]])),
    sizes: Object.fromEntries(itemRefs.map((_, index) => [`autoRow${index + 1}`, [24]])),
    rowOrder: itemRefs.map((_, index) => `autoRow${index + 1}`),
  };
}

function didItemRefsChange(currentChildren: FlowSurfaceNodeSpec[], desiredRefs: CompiledNodeRef[]) {
  if (currentChildren.length !== desiredRefs.length) {
    return true;
  }
  return desiredRefs.some(
    (item, index) => typeof item.uidRef !== 'string' || currentChildren[index]?.uid !== item.uidRef,
  );
}

function nextOpId(state: CompilerState, prefix: string) {
  state.seq += 1;
  return `${prefix}_${state.seq}`;
}

function emitMoveTabOps(ops: FlowSurfaceMutateOp[], desiredRefs: CompiledNodeRef[]) {
  emitOrderedTabMoves(ops, desiredRefs, 'moveTab');
}

function emitOrderedTabMoves(
  ops: FlowSurfaceMutateOp[],
  desiredRefs: CompiledNodeRef[],
  type: 'moveTab' | 'movePopupTab',
) {
  for (let index = desiredRefs.length - 2; index >= 0; index -= 1) {
    ops.push({
      type,
      values: {
        sourceUid: desiredRefs[index].uidRef,
        targetUid: desiredRefs[index + 1].uidRef,
        position: 'before',
      },
    });
  }
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

  emitOrderedTabMoves(ops, desiredRefs, 'movePopupTab');
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
