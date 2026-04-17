/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseCollectionName } from '@nocobase/data-source-manager';
import { uid } from '@nocobase/utils';
import _ from 'lodash';
import type FlowModelRepository from '../../repository';
import { assertFlowSurfaceComposeUniqueKeys, buildDefinedPayload, normalizeComposeFieldSpec } from '../service-utils';
import { isFlowSurfaceError, throwBadRequest, throwInternalError } from '../errors';
import {
  prepareFlowSurfaceApplyApprovalBlueprintDocument,
  type FlowSurfaceApprovalBlueprintSurface,
} from './blueprint';
import {
  buildApprovalApproverSurfaceTree,
  buildApprovalInitiatorSurfaceTree,
  buildApprovalTaskCardSurfaceTree,
} from './builder';

type FlowSurfaceApprovalBlueprintBindingResource = 'workflows' | 'flow_nodes';

type FlowSurfaceApplyApprovalBlueprintDocument = ReturnType<typeof prepareFlowSurfaceApplyApprovalBlueprintDocument>;

type FlowSurfaceApprovalBlueprintBindingContext = {
  surface: FlowSurfaceApprovalBlueprintSurface;
  dataSourceKey: string;
  collectionName: string;
  bindingResource: FlowSurfaceApprovalBlueprintBindingResource;
  filterByTk: number | string;
  rootUse:
    | 'TriggerChildPageModel'
    | 'ApprovalChildPageModel'
    | 'ApplyTaskCardDetailsModel'
    | 'ApprovalTaskCardDetailsModel';
  rootUidKey: 'approvalUid' | 'taskCardUid';
  existingUid?: string;
  workflowId?: number | string;
  nodeId?: number | string;
  workflow?: any;
  node?: any;
};

type FlowSurfaceApprovalBlueprintSurfaceRoot = {
  root: any;
  rootUid: string;
  gridUid: string;
};

type ApprovalBlueprintServiceDeps = {
  contractGuard: {
    validateNodeTreeAgainstContract: (node: Record<string, any>) => void;
  };
  db: {
    getRepository: (resourceName: string) => {
      findOne: (options: Record<string, any>) => Promise<any>;
      update: (options: Record<string, any>) => Promise<any>;
    };
  };
  hasDataSource: (dataSourceKey: string) => boolean;
  repository: Pick<
    FlowModelRepository,
    'findModelById' | 'findModelByParentId' | 'insertModel' | 'upsertModel' | 'patch'
  >;
  removeNodeTreeWithBindings: (uid: string, transaction?: any) => Promise<void>;
  surfaceContext: {
    resolveGridNode: (uid: string, transaction?: any) => Promise<any>;
  };
  compose: (values: Record<string, any>, options: { transaction?: any }) => Promise<any>;
  addField: (values: Record<string, any>, options: { transaction?: any }) => Promise<any>;
  setLayout: (values: Record<string, any>, options: { transaction?: any }) => Promise<any>;
  get: (values: Record<string, any>, options: { transaction?: any }) => Promise<any>;
  buildComposeLayoutPayload: (input: {
    layout: any;
    createdByKey: Record<string, { uid: string }>;
    finalItems: any[];
  }) => Record<string, any>;
  syncApprovalRuntimeConfigForSurfaceRoot: (root: any, transaction?: any) => Promise<void>;
};

export class FlowSurfaceApprovalBlueprintService {
  constructor(private readonly deps: ApprovalBlueprintServiceDeps) {}

  private parseApprovalBlueprintCollection(collectionValue: any) {
    const normalizedCollection = String(collectionValue || '').trim();
    if (!normalizedCollection) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint requires an approval workflow collection binding`);
    }
    let [dataSourceKey, collectionName] = parseCollectionName(normalizedCollection);
    if (
      !normalizedCollection.includes(':') &&
      normalizedCollection.includes('.') &&
      collectionName === normalizedCollection
    ) {
      const [candidateDataSourceKey, ...candidateCollectionParts] = normalizedCollection.split('.');
      const candidateCollectionName = candidateCollectionParts.join('.');
      if (candidateDataSourceKey && candidateCollectionName && this.deps.hasDataSource(candidateDataSourceKey)) {
        dataSourceKey = candidateDataSourceKey;
        collectionName = candidateCollectionName;
      }
    }
    if (!collectionName) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint collection '${normalizedCollection}' is invalid`);
    }
    return {
      dataSourceKey: dataSourceKey || 'main',
      collectionName,
    };
  }

  private async resolveApprovalBlueprintBindingContext(
    document: FlowSurfaceApplyApprovalBlueprintDocument,
    transaction?: any,
  ): Promise<FlowSurfaceApprovalBlueprintBindingContext> {
    if (!_.isUndefined(document.workflowId)) {
      const workflow = await this.deps.db.getRepository('workflows').findOne({
        filterByTk: document.workflowId,
        transaction,
      });
      if (!workflow) {
        throwBadRequest(`flowSurfaces applyApprovalBlueprint workflow '${document.workflowId}' not found`);
      }
      if ((workflow.get?.('type') || workflow.type) !== 'approval') {
        throwBadRequest(
          `flowSurfaces applyApprovalBlueprint workflow '${document.workflowId}' must be an approval workflow`,
        );
      }
      const workflowConfig = _.cloneDeep(workflow.get?.('config') || workflow.config || {});
      const collection = this.parseApprovalBlueprintCollection(workflowConfig.collection);
      return {
        surface: document.surface,
        ...collection,
        bindingResource: 'workflows',
        filterByTk: workflow.get?.('id') || workflow.id || document.workflowId,
        rootUse: document.surface === 'initiator' ? 'TriggerChildPageModel' : 'ApplyTaskCardDetailsModel',
        rootUidKey: document.surface === 'initiator' ? 'approvalUid' : 'taskCardUid',
        existingUid:
          String(
            document.surface === 'initiator' ? workflowConfig.approvalUid || '' : workflowConfig.taskCardUid || '',
          ).trim() || undefined,
        workflowId: workflow.get?.('id') || workflow.id || document.workflowId,
        workflow,
      };
    }

    const node = await this.deps.db.getRepository('flow_nodes').findOne({
      filterByTk: document.nodeId,
      appends: ['workflow'],
      transaction,
    });
    if (!node) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint node '${document.nodeId}' not found`);
    }
    if ((node.get?.('type') || node.type) !== 'approval') {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint node '${document.nodeId}' must be an approval node`);
    }
    const workflow = node.get?.('workflow') || node.workflow;
    if (!workflow) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint node '${document.nodeId}' is missing its workflow relation`);
    }
    const resolvedNodeId = node.get?.('id') || node.id || document.nodeId;
    if (_.isNil(resolvedNodeId)) {
      throwInternalError(`flowSurfaces applyApprovalBlueprint node id could not be resolved`);
    }
    const workflowConfig = _.cloneDeep(workflow.get?.('config') || workflow.config || {});
    const nodeConfig = _.cloneDeep(node.get?.('config') || node.config || {});
    const collection = this.parseApprovalBlueprintCollection(workflowConfig.collection);
    return {
      surface: document.surface,
      ...collection,
      bindingResource: 'flow_nodes',
      filterByTk: resolvedNodeId,
      rootUse: document.surface === 'approver' ? 'ApprovalChildPageModel' : 'ApprovalTaskCardDetailsModel',
      rootUidKey: document.surface === 'approver' ? 'approvalUid' : 'taskCardUid',
      existingUid:
        String(document.surface === 'approver' ? nodeConfig.approvalUid || '' : nodeConfig.taskCardUid || '').trim() ||
        undefined,
      workflowId: workflow.get?.('id') || workflow.id,
      nodeId: resolvedNodeId,
      workflow,
      node,
    };
  }

  private buildApprovalBlueprintSurfaceRootTree(context: FlowSurfaceApprovalBlueprintBindingContext) {
    switch (context.rootUse) {
      case 'TriggerChildPageModel':
        return buildApprovalInitiatorSurfaceTree({
          dataSourceKey: context.dataSourceKey,
          collectionName: context.collectionName,
        });
      case 'ApprovalChildPageModel':
        return buildApprovalApproverSurfaceTree({
          dataSourceKey: context.dataSourceKey,
          collectionName: context.collectionName,
        });
      case 'ApplyTaskCardDetailsModel':
        return buildApprovalTaskCardSurfaceTree({
          detailsUse: 'ApplyTaskCardDetailsModel',
          gridUse: 'ApplyTaskCardGridModel',
          dataSourceKey: context.dataSourceKey,
          collectionName: context.collectionName,
        });
      case 'ApprovalTaskCardDetailsModel':
        return buildApprovalTaskCardSurfaceTree({
          detailsUse: 'ApprovalTaskCardDetailsModel',
          gridUse: 'ApprovalTaskCardGridModel',
          dataSourceKey: context.dataSourceKey,
          collectionName: context.collectionName,
        });
      default: {
        const unsupportedUse: never = context.rootUse;
        throwInternalError(`flowSurfaces applyApprovalBlueprint unsupported root use '${unsupportedUse}'`);
      }
    }
  }

  private buildApprovalBlueprintPageSurfaceRootTree(context: FlowSurfaceApprovalBlueprintBindingContext) {
    if (context.rootUse === 'TriggerChildPageModel') {
      return buildApprovalInitiatorSurfaceTree({
        dataSourceKey: context.dataSourceKey,
        collectionName: context.collectionName,
      });
    }
    if (context.rootUse === 'ApprovalChildPageModel') {
      return buildApprovalApproverSurfaceTree({
        dataSourceKey: context.dataSourceKey,
        collectionName: context.collectionName,
      });
    }
    throwInternalError(`flowSurfaces applyApprovalBlueprint root use '${context.rootUse}' does not support tabs`);
  }

  private getApprovalBlueprintExpectedTabUse(context: FlowSurfaceApprovalBlueprintBindingContext) {
    return context.rootUse === 'TriggerChildPageModel' ? 'TriggerChildPageTabModel' : 'ApprovalChildPageTabModel';
  }

  private getApprovalBlueprintExpectedGridUse(context: FlowSurfaceApprovalBlueprintBindingContext) {
    switch (context.rootUse) {
      case 'TriggerChildPageModel':
        return 'TriggerBlockGridModel';
      case 'ApprovalChildPageModel':
        return 'ApprovalBlockGridModel';
      case 'ApplyTaskCardDetailsModel':
        return 'ApplyTaskCardGridModel';
      case 'ApprovalTaskCardDetailsModel':
        return 'ApprovalTaskCardGridModel';
      default: {
        const unsupportedUse: never = context.rootUse;
        throwInternalError(`flowSurfaces applyApprovalBlueprint unsupported root use '${unsupportedUse}'`);
      }
    }
  }

  private async findApprovalBlueprintSurfaceRoot(
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ) {
    if (!context.existingUid) {
      return null;
    }
    const root = await this.deps.repository.findModelById(context.existingUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!root?.uid || root.use !== context.rootUse) {
      return null;
    }
    return root;
  }

  private async createApprovalBlueprintSurfaceRoot(
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ): Promise<FlowSurfaceApprovalBlueprintSurfaceRoot> {
    const tree = this.buildApprovalBlueprintSurfaceRootTree(context);
    this.deps.contractGuard.validateNodeTreeAgainstContract(tree);
    const root = await this.deps.repository.insertModel(tree, {
      transaction,
    });
    const grid = await this.deps.surfaceContext.resolveGridNode(root.uid, transaction);
    return {
      root,
      rootUid: root.uid,
      gridUid: grid.uid,
    };
  }

  private async ensureApprovalBlueprintPageSurfaceStructure(
    root: any,
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ) {
    const expectedTabUse = this.getApprovalBlueprintExpectedTabUse(context);
    let tab =
      _.castArray(root?.subModels?.tabs || []).find((item: any) => item?.uid && item?.use === expectedTabUse) ||
      _.castArray(root?.subModels?.tabs || [])[0];

    if (!tab?.uid) {
      const defaultTree = this.buildApprovalBlueprintPageSurfaceRootTree(context);
      const defaultTab = _.castArray(defaultTree?.subModels?.tabs || [])[0];
      await this.deps.repository.upsertModel(
        {
          parentId: root.uid,
          subKey: 'tabs',
          subType: 'array',
          ...defaultTab,
        },
        { transaction },
      );
      tab = await this.deps.repository.findModelById(defaultTab.uid, {
        transaction,
        includeAsyncNode: true,
      });
    } else if (tab.use !== expectedTabUse) {
      await this.deps.repository.patch(
        {
          uid: tab.uid,
          use: expectedTabUse,
        },
        { transaction },
      );
      tab = await this.deps.repository.findModelById(tab.uid, {
        transaction,
        includeAsyncNode: true,
      });
    }

    for (const extraTab of _.castArray(root?.subModels?.tabs || []).filter(
      (item: any) => item?.uid && item.uid !== tab.uid,
    )) {
      await this.deps.removeNodeTreeWithBindings(extraTab.uid, transaction);
    }

    const expectedGridUse = this.getApprovalBlueprintExpectedGridUse(context);
    const grid =
      tab?.subModels?.grid ||
      (tab?.uid
        ? await this.deps.repository.findModelByParentId(tab.uid, {
            transaction,
            subKey: 'grid',
            includeAsyncNode: true,
          })
        : null);

    if (!grid?.uid) {
      const gridUid = uid();
      await this.deps.repository.upsertModel(
        {
          uid: gridUid,
          parentId: tab.uid,
          subKey: 'grid',
          subType: 'object',
          async: true,
          use: expectedGridUse,
        },
        { transaction },
      );
      return gridUid;
    }

    if (grid.use !== expectedGridUse) {
      await this.deps.repository.patch(
        {
          uid: grid.uid,
          use: expectedGridUse,
        },
        { transaction },
      );
    }

    return grid.uid;
  }

  private async ensureApprovalBlueprintTaskCardSurfaceStructure(
    root: any,
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ) {
    const expectedGridUse = this.getApprovalBlueprintExpectedGridUse(context);
    const grid =
      root?.subModels?.grid ||
      (await this.deps.repository.findModelByParentId(root.uid, {
        transaction,
        subKey: 'grid',
        includeAsyncNode: true,
      }));

    if (!grid?.uid) {
      const gridUid = uid();
      await this.deps.repository.upsertModel(
        {
          uid: gridUid,
          parentId: root.uid,
          subKey: 'grid',
          subType: 'object',
          use: expectedGridUse,
        },
        { transaction },
      );
      return gridUid;
    }

    if (grid.use !== expectedGridUse) {
      await this.deps.repository.patch(
        {
          uid: grid.uid,
          use: expectedGridUse,
        },
        { transaction },
      );
    }

    return grid.uid;
  }

  private async syncApprovalBlueprintSurfaceAsyncShape(
    surfaceRoot: FlowSurfaceApprovalBlueprintSurfaceRoot,
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ) {
    await this.deps.repository.upsertModel(
      {
        uid: surfaceRoot.rootUid,
        use: context.rootUse,
        async: true,
      },
      { transaction },
    );

    if (context.surface === 'taskCard') {
      return;
    }

    await this.deps.repository.upsertModel(
      {
        uid: surfaceRoot.gridUid,
        use: this.getApprovalBlueprintExpectedGridUse(context),
        async: true,
      },
      { transaction },
    );
  }

  private async syncApprovalBlueprintSurfaceRoot(
    rootUid: string,
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ) {
    const root = await this.deps.repository.findModelById(rootUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!root?.uid) {
      return;
    }

    const stepParams = _.cloneDeep(root.stepParams || {});
    const nextInit = {
      dataSourceKey: context.dataSourceKey,
      collectionName: context.collectionName,
    };

    if (context.rootUse === 'TriggerChildPageModel') {
      const currentInit = _.get(stepParams, ['TriggerChildPageSettings', 'init']) || {};
      if (_.isEqual(currentInit, nextInit)) {
        return;
      }
      _.set(stepParams, ['TriggerChildPageSettings', 'init'], nextInit);
      await this.deps.repository.patch(
        {
          uid: rootUid,
          stepParams,
        },
        { transaction },
      );
      return;
    }

    if (context.rootUse === 'ApprovalChildPageModel') {
      const currentInit = _.get(stepParams, ['ApprovalChildPageSettings', 'init']) || {};
      const currentResourceInit = _.get(stepParams, ['resourceSettings', 'init']) || {};
      if (_.isEqual(currentInit, nextInit) && _.isEqual(currentResourceInit, nextInit)) {
        return;
      }
      _.set(stepParams, ['ApprovalChildPageSettings', 'init'], nextInit);
      _.set(stepParams, ['resourceSettings', 'init'], nextInit);
      await this.deps.repository.patch(
        {
          uid: rootUid,
          stepParams,
        },
        { transaction },
      );
      return;
    }

    const currentInit = _.get(stepParams, ['resourceSettings', 'init']) || {};
    if (!_.isEqual(currentInit, nextInit)) {
      _.set(stepParams, ['resourceSettings', 'init'], nextInit);
    }
    if (!_.get(stepParams, ['detailsSettings', 'layout', 'layout'])) {
      _.set(stepParams, ['detailsSettings', 'layout', 'layout'], 'horizontal');
    }
    if (_.isEqual(stepParams, root.stepParams || {})) {
      return;
    }
    await this.deps.repository.patch(
      {
        uid: rootUid,
        stepParams,
      },
      { transaction },
    );
  }

  private async ensureApprovalBlueprintSurfaceRoot(
    context: FlowSurfaceApprovalBlueprintBindingContext,
    transaction?: any,
  ): Promise<FlowSurfaceApprovalBlueprintSurfaceRoot> {
    const existingRoot = await this.findApprovalBlueprintSurfaceRoot(context, transaction);
    if (!existingRoot?.uid) {
      return this.createApprovalBlueprintSurfaceRoot(context, transaction);
    }

    const gridUid =
      context.surface === 'taskCard'
        ? await this.ensureApprovalBlueprintTaskCardSurfaceStructure(existingRoot, context, transaction)
        : await this.ensureApprovalBlueprintPageSurfaceStructure(existingRoot, context, transaction);

    await this.syncApprovalBlueprintSurfaceAsyncShape(
      {
        root: existingRoot,
        rootUid: existingRoot.uid,
        gridUid,
      },
      context,
      transaction,
    );
    await this.syncApprovalBlueprintSurfaceRoot(existingRoot.uid, context, transaction);
    const root = await this.deps.repository.findModelById(existingRoot.uid, {
      transaction,
      includeAsyncNode: true,
    });
    return {
      root,
      rootUid: root.uid,
      gridUid,
    };
  }

  private async persistApprovalBlueprintBinding(
    context: FlowSurfaceApprovalBlueprintBindingContext,
    rootUid: string,
    transaction?: any,
  ) {
    const configSource = context.bindingResource === 'workflows' ? context.workflow : context.node;
    const currentConfig = _.cloneDeep(configSource?.get?.('config') || configSource?.config || {});
    if (currentConfig?.[context.rootUidKey] === rootUid) {
      return;
    }
    await this.deps.db.getRepository(context.bindingResource).update({
      filterByTk: context.filterByTk,
      values: {
        config: {
          ...currentConfig,
          [context.rootUidKey]: rootUid,
        },
      },
      transaction,
    });
  }

  private async applyApprovalBlueprintPageSurface(
    document: FlowSurfaceApplyApprovalBlueprintDocument,
    surfaceRoot: FlowSurfaceApprovalBlueprintSurfaceRoot,
    options: { transaction?: any },
  ) {
    await this.deps.compose(
      {
        target: {
          uid: surfaceRoot.gridUid,
        },
        mode: 'replace',
        blocks: document.blocks || [],
        layout: document.layout,
      },
      options,
    );
  }

  private async applyApprovalBlueprintTaskCardSurface(
    document: FlowSurfaceApplyApprovalBlueprintDocument,
    surfaceRoot: FlowSurfaceApprovalBlueprintSurfaceRoot,
    context: FlowSurfaceApprovalBlueprintBindingContext,
    options: { transaction?: any },
  ) {
    const normalizedFields = _.castArray(document.fields || []).map((item, index) =>
      normalizeComposeFieldSpec(item, index),
    );
    normalizedFields.forEach((field) => {
      if (field.target) {
        throwBadRequest(`flowSurfaces applyApprovalBlueprint taskCard fields do not support target`);
      }
    });
    assertFlowSurfaceComposeUniqueKeys(normalizedFields, 'flowSurfaces applyApprovalBlueprint taskCard fields');

    const initialGrid = await this.deps.repository.findModelById(surfaceRoot.gridUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    for (const item of _.castArray(initialGrid?.subModels?.items || []).filter((candidate: any) => candidate?.uid)) {
      await this.deps.removeNodeTreeWithBindings(item.uid, options.transaction);
    }

    const createdByKey: Record<string, { uid: string }> = {};
    for (const fieldSpec of normalizedFields) {
      let result;
      try {
        result = await this.deps.addField(
          {
            target: {
              uid: surfaceRoot.rootUid,
            },
            ...(fieldSpec.key ? { key: fieldSpec.key } : {}),
            dataSourceKey: context.dataSourceKey,
            collectionName: context.collectionName,
            ...(fieldSpec.fieldPath ? { fieldPath: fieldSpec.fieldPath } : {}),
            ...(fieldSpec.associationPathName ? { associationPathName: fieldSpec.associationPathName } : {}),
            ...(fieldSpec.renderer ? { renderer: fieldSpec.renderer } : {}),
            ...(fieldSpec.type ? { type: fieldSpec.type } : {}),
            ...(fieldSpec.popup ? { popup: fieldSpec.popup } : {}),
            ...(Object.keys(fieldSpec.settings || {}).length ? { settings: fieldSpec.settings } : {}),
          },
          options,
        );
      } catch (error) {
        if (isFlowSurfaceError(error)) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        throwInternalError(
          `flowSurfaces applyApprovalBlueprint taskCard addField '${fieldSpec.key}' failed: ${message}`,
        );
      }
      createdByKey[fieldSpec.key] = {
        uid: result.wrapperUid || result.uid,
      };
    }

    const finalGrid = await this.deps.repository.findModelById(surfaceRoot.gridUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const layoutPayload = this.deps.buildComposeLayoutPayload({
      layout: document.layout,
      createdByKey,
      finalItems: _.castArray(finalGrid?.subModels?.items || []).filter((item: any) => item?.uid),
    });
    try {
      await this.deps.setLayout(
        {
          target: {
            uid: surfaceRoot.gridUid,
          },
          ...layoutPayload,
        },
        options,
      );
    } catch (error) {
      if (isFlowSurfaceError(error)) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throwInternalError(`flowSurfaces applyApprovalBlueprint taskCard setLayout failed: ${message}`);
    }
  }

  async applyApprovalBlueprint(values: Record<string, any>, options: { transaction?: any } = {}) {
    const document = prepareFlowSurfaceApplyApprovalBlueprintDocument(values);
    const bindingContext = await this.resolveApprovalBlueprintBindingContext(document, options.transaction);
    const surfaceRoot = await this.ensureApprovalBlueprintSurfaceRoot(bindingContext, options.transaction);
    await this.persistApprovalBlueprintBinding(bindingContext, surfaceRoot.rootUid, options.transaction);

    if (document.surface === 'taskCard') {
      await this.applyApprovalBlueprintTaskCardSurface(document, surfaceRoot, bindingContext, options);
    } else {
      await this.applyApprovalBlueprintPageSurface(document, surfaceRoot, options);
    }
    await this.deps.syncApprovalRuntimeConfigForSurfaceRoot({ uid: surfaceRoot.rootUid }, options.transaction);

    let surface;
    try {
      surface = await this.deps.get(
        {
          uid: surfaceRoot.rootUid,
        },
        options,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throwInternalError(
        `flowSurfaces applyApprovalBlueprint readback failed for '${surfaceRoot.rootUid}': ${message}`,
      );
    }

    return {
      version: '1',
      mode: document.mode,
      surfaceType: document.surface,
      target: buildDefinedPayload({
        uid: surfaceRoot.rootUid,
        workflowId: bindingContext.workflowId,
        nodeId: bindingContext.nodeId,
      }),
      binding: {
        resourceName: bindingContext.bindingResource,
        filterByTk: bindingContext.filterByTk,
        configPath: `config.${bindingContext.rootUidKey}`,
      },
      surface,
    };
  }
}
