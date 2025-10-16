/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, utils } from '@nocobase/actions';
import { MultipleRelationRepository, Op, Repository } from '@nocobase/database';
import WorkflowPlugin from '..';
import type { WorkflowModel } from '../types';

export async function create(context: Context, next) {
  const { db } = context;
  const repository = utils.getRepositoryFromParams(context) as MultipleRelationRepository;
  const { whitelist, blacklist, updateAssociationValues, values, associatedIndex: workflowId } = context.action.params;
  const workflowPlugin = context.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

  context.body = await db.sequelize.transaction(async (transaction) => {
    const workflow =
      workflowPlugin.enabledCache.get(Number.parseInt(workflowId, 10)) ||
      ((await repository.getSourceModel(transaction)) as WorkflowModel);
    if (!workflow.versionStats) {
      workflow.versionStats = await workflow.getVersionStats({ transaction });
    }
    if (workflow.versionStats.executed > 0) {
      context.throw(400, 'Node could not be created in executed workflow');
    }

    const NODES_LIMIT = process.env.WORKFLOW_NODES_LIMIT ? parseInt(process.env.WORKFLOW_NODES_LIMIT, 10) : null;
    if (NODES_LIMIT) {
      const nodesCount = await workflow.countNodes({ transaction });
      if (nodesCount >= NODES_LIMIT) {
        context.throw(400, `The number of nodes in a workflow cannot exceed ${NODES_LIMIT}`);
      }
    }

    const instance = await repository.create({
      values,
      whitelist,
      blacklist,
      updateAssociationValues,
      context,
      transaction,
    });

    if (!instance.upstreamId) {
      const previousHead = await repository.findOne({
        filter: {
          id: {
            $ne: instance.id,
          },
          upstreamId: null,
        },
        transaction,
      });
      if (previousHead) {
        await previousHead.setUpstream(instance, { transaction });
        await instance.setDownstream(previousHead, { transaction });
        instance.set('downstream', previousHead);
      }
      return instance;
    }

    const upstream = await instance.getUpstream({ transaction });

    if (instance.branchIndex == null) {
      const downstream = await upstream.getDownstream({ transaction });

      if (downstream) {
        await downstream.setUpstream(instance, { transaction });
        await instance.setDownstream(downstream, { transaction });
        instance.set('downstream', downstream);
      }

      await upstream.update(
        {
          downstreamId: instance.id,
        },
        { transaction },
      );

      upstream.set('downstream', instance);
    } else {
      const [downstream] = await upstream.getBranches({
        where: {
          id: {
            [Op.ne]: instance.id,
          },
          branchIndex: instance.branchIndex,
        },
        transaction,
      });

      if (downstream) {
        await downstream.update(
          {
            upstreamId: instance.id,
            branchIndex: null,
          },
          { transaction },
        );
        await instance.setDownstream(downstream, { transaction });
        instance.set('downstream', downstream);
      }
    }

    instance.set('upstream', upstream);

    return instance;
  });

  await next();
}

function searchBranchNodes(nodes, from): any[] {
  const branchHeads = nodes.filter((item: any) => item.upstreamId === from.id && item.branchIndex != null);
  return branchHeads.reduce(
    (flatten: any[], head) => flatten.concat(searchBranchDownstreams(nodes, head)),
    [],
  ) as any[];
}

function searchBranchDownstreams(nodes, from) {
  let result = [];
  for (let search = from; search; search = search.downstream) {
    result = [...result, search, ...searchBranchNodes(nodes, search)];
  }
  return result;
}

function findBranchTail(branchHead) {
  let tail = branchHead;
  while (tail.downstream) {
    tail = tail.downstream;
  }
  return tail;
}

export async function destroy(context: Context, next) {
  const { db } = context;
  const repository = utils.getRepositoryFromParams(context) as Repository;
  const { filterByTk, keepBranch } = context.action.params;
  const keepBranchIndex = keepBranch == null || keepBranch === '' ? null : Number.parseInt(keepBranch, 10);

  const fields = ['id', 'upstreamId', 'downstreamId', 'branchIndex'];
  const instance = await repository.findOne({
    filterByTk,
    fields: [...fields, 'workflowId'],
    appends: ['upstream', 'downstream', 'workflow.versionStats.executed'],
  });
  if (!instance) {
    context.throw(404, 'Node not found');
  }
  if (instance.workflow.versionStats.executed > 0) {
    context.throw(400, 'Nodes in executed workflow could not be deleted');
  }

  await db.sequelize.transaction(async (transaction) => {
    const { upstream, downstream } = instance.get();

    const nodes = await repository.find({
      filter: {
        workflowId: instance.workflowId,
      },
      fields,
      transaction,
    });
    const nodesMap = new Map();
    // make map
    nodes.forEach((item) => {
      nodesMap.set(item.id, item);
    });
    // make linked list
    nodes.forEach((item) => {
      if (item.upstreamId) {
        item.upstream = nodesMap.get(item.upstreamId);
      }
      if (item.downstreamId) {
        item.downstream = nodesMap.get(item.downstreamId);
      }
    });

    const keepBranchHead =
      keepBranchIndex != null
        ? nodes.find((item) => item.upstreamId === instance.id && item.branchIndex == keepBranchIndex)
        : null;
    if (keepBranchIndex != null && !keepBranchHead) {
      context.throw(400, `Branch ${keepBranchIndex} not found`);
    }
    const keepBranchNodes = keepBranchHead ? searchBranchDownstreams(nodes, keepBranchHead) : [];
    const keepBranchNodeIds = new Set<number>(keepBranchNodes.map((item) => item.id));

    const branchNodes = instance ? searchBranchNodes(nodes, instance) : [];
    const branchNodesToDelete = keepBranchHead
      ? branchNodes.filter((item) => !keepBranchNodeIds.has(item.id))
      : branchNodes;

    if (keepBranchHead) {
      if (upstream && upstream.downstreamId === instance.id) {
        await upstream.update(
          {
            downstreamId: keepBranchHead.id,
          },
          { transaction },
        );
      }

      await keepBranchHead.update(
        {
          upstreamId: instance.upstreamId,
          branchIndex: instance.branchIndex,
        },
        { transaction },
      );

      if (downstream) {
        const branchTail = findBranchTail(keepBranchHead);
        await branchTail.update(
          {
            downstreamId: instance.downstreamId,
          },
          { transaction },
        );
        branchTail.downstreamId = instance.downstreamId;
        branchTail.downstream = downstream;

        await downstream.update(
          {
            upstreamId: branchTail.id,
            branchIndex: null,
          },
          { transaction },
        );
      }
    } else {
      if (upstream && upstream.downstreamId === instance.id) {
        await upstream.update(
          {
            downstreamId: instance.downstreamId,
          },
          { transaction },
        );
      }

      if (downstream) {
        await downstream.update(
          {
            upstreamId: instance.upstreamId,
            branchIndex: instance.branchIndex,
          },
          { transaction },
        );
      }
    }

    await repository.destroy({
      filterByTk: [instance.id, ...branchNodesToDelete.map((item) => item.id)],
      transaction,
    });
  });

  context.body = instance;

  await next();
}

export async function update(context: Context, next) {
  const { db } = context;
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, values, whitelist, blacklist, filter, updateAssociationValues } = context.action.params;
  context.body = await db.sequelize.transaction(async (transaction) => {
    // TODO(optimize): duplicated instance query
    const { workflow } = await repository.findOne({
      filterByTk,
      appends: ['workflow.versionStats.executed'],
      transaction,
    });
    if (workflow.versionStats.executed > 0) {
      context.throw(400, 'Nodes in executed workflow could not be reconfigured');
    }

    return repository.update({
      filterByTk,
      values,
      whitelist,
      blacklist,
      filter,
      updateAssociationValues,
      context,
      transaction,
    });
  });

  await next();
}

export async function test(context: Context, next) {
  const { values = {} } = context.action.params;
  const { type, config = {} } = values;
  const plugin = context.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
  const instruction = plugin.instructions.get(type);
  if (!instruction) {
    context.throw(400, `instruction "${type}" not registered`);
  }
  if (typeof instruction.test !== 'function') {
    context.throw(400, `test method of instruction "${type}" not implemented`);
  }
  try {
    context.body = await instruction.test(config);
  } catch (error) {
    context.throw(500, error.message);
  }

  next();
}
