/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type FlowModelRepository from '../../repository';
import { buildDefinedPayload } from '../service-utils';
import { throwBadRequest } from '../errors';

export const APPROVAL_SURFACE_ROOT_USES = new Set([
  'TriggerChildPageModel',
  'ApprovalChildPageModel',
  'ApplyTaskCardDetailsModel',
  'ApprovalTaskCardDetailsModel',
]);

export const APPROVAL_SINGLETON_ACTION_USES = new Set([
  'ApplyFormSubmitModel',
  'ApplyFormSaveDraftModel',
  'ApplyFormWithdrawModel',
  'ProcessFormApproveModel',
  'ProcessFormRejectModel',
  'ProcessFormReturnModel',
  'ProcessFormDelegateModel',
  'ProcessFormAddAssigneeModel',
]);

const APPROVAL_PROCESS_ACTION_STATUS_BY_USE: Record<string, number> = {
  ProcessFormApproveModel: 2,
  ProcessFormRejectModel: -1,
  ProcessFormReturnModel: 1,
  ProcessFormDelegateModel: 8,
  ProcessFormAddAssigneeModel: 99,
};

const APPROVAL_PROCESS_ACTION_STATUS_ORDER = [2, -1, 1, 8, 99];

type ApprovalRuntimeConfigDeps = {
  db: {
    getRepository: (resourceName: string) => {
      find: (options: Record<string, any>) => Promise<any[]>;
      update: (options: Record<string, any>) => Promise<any>;
    };
  };
  locator: {
    findParentUid: (uid: string, transaction?: any) => Promise<string | null | undefined>;
  };
  repository: Pick<FlowModelRepository, 'findModelById'>;
};

export class FlowSurfaceApprovalRuntimeConfigService {
  constructor(private readonly deps: ApprovalRuntimeConfigDeps) {}

  private getRepositoryIfAvailable(resourceName: string) {
    try {
      return this.deps.db.getRepository(resourceName);
    } catch {
      return null;
    }
  }

  private readModelField(model: any, fieldName: string) {
    return model?.get?.(fieldName) ?? model?.[fieldName];
  }

  private readApprovalConfig(model: any) {
    return _.cloneDeep(this.readModelField(model, 'config') || {});
  }

  private collectApprovalActionNodes(node: any, carry: any[] = []) {
    if (!node?.uid) {
      return carry;
    }
    if (APPROVAL_SINGLETON_ACTION_USES.has(node.use || '')) {
      carry.push(node);
    }
    Object.values(node.subModels || {}).forEach((subModel) => {
      _.castArray(subModel as any).forEach((child) => this.collectApprovalActionNodes(child, carry));
    });
    return carry;
  }

  async findApprovalSurfaceRootForNode(uid: string, transaction?: any) {
    let cursor = String(uid || '').trim();
    const visited = new Set<string>();
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const node = await this.deps.repository.findModelById(cursor, {
        transaction,
        includeAsyncNode: true,
      });
      if (!node?.uid) {
        return null;
      }
      if (APPROVAL_SURFACE_ROOT_USES.has(node.use || '')) {
        return node;
      }
      cursor = String(
        node.parentId || (await this.deps.locator.findParentUid(node.uid, transaction).catch(() => '')) || '',
      );
    }
    return null;
  }

  private async findApprovalWorkflowBySurfaceRootUid(rootUid: string, transaction?: any) {
    const workflowsRepository = this.getRepositoryIfAvailable('workflows');
    if (!workflowsRepository) {
      return null;
    }
    const workflows = await workflowsRepository.find({
      filter: {
        type: 'approval',
      },
      transaction,
    });
    return workflows.find((workflow: any) => this.readApprovalConfig(workflow).approvalUid === rootUid) || null;
  }

  private async findApprovalNodeBySurfaceRootUid(rootUid: string, transaction?: any) {
    const nodesRepository = this.getRepositoryIfAvailable('flow_nodes');
    if (!nodesRepository) {
      return null;
    }
    const nodes = await nodesRepository.find({
      filter: {
        type: 'approval',
      },
      transaction,
    });
    return nodes.find((node: any) => this.readApprovalConfig(node).approvalUid === rootUid) || null;
  }

  private async patchApprovalRuntimeConfig(
    resourceName: 'workflows' | 'flow_nodes',
    model: any,
    nextConfig: Record<string, any>,
    transaction?: any,
  ) {
    const currentConfig = this.readApprovalConfig(model);
    if (_.isEqual(currentConfig, nextConfig)) {
      return;
    }
    await this.deps.db.getRepository(resourceName).update({
      filterByTk: this.readModelField(model, 'id'),
      values: {
        config: nextConfig,
      },
      transaction,
    });
  }

  private getApprovalActionStepValue(actionNode: any, fieldName: string) {
    const clickSettings = _.get(actionNode, ['stepParams', 'clickSettings']);
    return _.get(clickSettings, ['saveResource', fieldName]) ?? _.get(clickSettings, fieldName);
  }

  private buildApprovalReturnRuntimeConfig(actionNode: any) {
    const settings = this.getApprovalActionStepValue(actionNode, 'approvalReturnNodeSettings') || {};
    const type = String(settings?.type || 'start').trim();
    if (type === 'any') {
      return {
        returnTo: -1,
        returnToNodeVariable: null,
      };
    }
    if (type === 'count') {
      const count = Number(settings?.count);
      return {
        returnTo: Number.isFinite(count) && count > 0 ? count : 1,
        returnToNodeVariable: null,
      };
    }
    if (type === 'specific') {
      const target = String(settings?.target || '').trim();
      return {
        returnTo: target || null,
        returnToNodeVariable: target ? `{{$jobsMapByNodeKey.${target}}}` : null,
      };
    }
    return {
      returnTo: null,
      returnToNodeVariable: null,
    };
  }

  private buildApprovalReassignRuntimeConfig(actionNode: any) {
    const assigneesScope = this.getApprovalActionStepValue(actionNode, 'assigneesScope') || {};
    const assignees = _.castArray(assigneesScope?.assignees || [])
      .filter((item) => !_.isUndefined(item) && !_.isNull(item) && item !== '')
      .map((item) =>
        _.isPlainObject(item) && !Object.prototype.hasOwnProperty.call(item, 'filter') ? { filter: item } : item,
      );
    return {
      assignees,
      options: buildDefinedPayload({
        extraFieldKey: assigneesScope?.extraFieldKey,
      }),
    };
  }

  private async syncApprovalWorkflowRuntimeConfig(root: any, transaction?: any) {
    const workflow = await this.findApprovalWorkflowBySurfaceRootUid(root.uid, transaction);
    if (!workflow) {
      return;
    }
    const currentConfig = this.readApprovalConfig(workflow);
    const actions = this.collectApprovalActionNodes(root);
    await this.patchApprovalRuntimeConfig(
      'workflows',
      workflow,
      {
        ...currentConfig,
        withdrawable: actions.some((action) => action.use === 'ApplyFormWithdrawModel'),
      },
      transaction,
    );
  }

  private async syncApprovalNodeRuntimeConfig(root: any, transaction?: any) {
    const node = await this.findApprovalNodeBySurfaceRootUid(root.uid, transaction);
    if (!node) {
      return;
    }
    const currentConfig = this.readApprovalConfig(node);
    const actionNodes = this.collectApprovalActionNodes(root);
    const statusSet = new Set(
      actionNodes
        .map((action) => APPROVAL_PROCESS_ACTION_STATUS_BY_USE[action.use || ''])
        .filter((status) => !_.isUndefined(status)),
    );
    const nextConfig: Record<string, any> = {
      ...currentConfig,
      actions: APPROVAL_PROCESS_ACTION_STATUS_ORDER.filter((status) => statusSet.has(status)),
    };

    const returnAction = actionNodes.find((action) => action.use === 'ProcessFormReturnModel');
    Object.assign(
      nextConfig,
      returnAction
        ? this.buildApprovalReturnRuntimeConfig(returnAction)
        : {
            returnTo: null,
            returnToNodeVariable: null,
          },
    );

    const delegateAction = actionNodes.find((action) => action.use === 'ProcessFormDelegateModel');
    const delegateConfig = delegateAction ? this.buildApprovalReassignRuntimeConfig(delegateAction) : null;
    nextConfig.toDelegateReassignees = delegateConfig?.assignees || [];
    nextConfig.toDelegateReassigneesOptions = delegateConfig?.options || {};

    const addAssigneeAction = actionNodes.find((action) => action.use === 'ProcessFormAddAssigneeModel');
    const addAssigneeConfig = addAssigneeAction ? this.buildApprovalReassignRuntimeConfig(addAssigneeAction) : null;
    nextConfig.toAddReassignees = addAssigneeConfig?.assignees || [];
    nextConfig.toAddReassigneesOptions = addAssigneeConfig?.options || {};

    await this.patchApprovalRuntimeConfig('flow_nodes', node, nextConfig, transaction);
  }

  async syncApprovalRuntimeConfigForSurfaceRoot(root: any, transaction?: any) {
    if (!root?.uid) {
      return;
    }
    const currentRoot = await this.deps.repository.findModelById(root.uid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!currentRoot?.uid) {
      return;
    }
    if (currentRoot.use === 'TriggerChildPageModel') {
      await this.syncApprovalWorkflowRuntimeConfig(currentRoot, transaction);
      return;
    }
    if (currentRoot.use === 'ApprovalChildPageModel') {
      await this.syncApprovalNodeRuntimeConfig(currentRoot, transaction);
    }
  }

  async syncApprovalRuntimeConfigForNode(uid: string, transaction?: any) {
    const root = await this.findApprovalSurfaceRootForNode(uid, transaction);
    if (root) {
      await this.syncApprovalRuntimeConfigForSurfaceRoot(root, transaction);
    }
  }

  async assertApprovalActionSingleton(parentUid: string, actionUse: string, transaction?: any) {
    if (!APPROVAL_SINGLETON_ACTION_USES.has(actionUse)) {
      return;
    }
    const parent = await this.deps.repository.findModelById(parentUid, {
      transaction,
      includeAsyncNode: true,
    });
    const existing = _.castArray(parent?.subModels?.actions || []).find((action: any) => action?.use === actionUse);
    if (existing?.uid) {
      throwBadRequest(`flowSurfaces addAction approval action '${actionUse}' already exists in '${parent.use}'`);
    }
  }
}
