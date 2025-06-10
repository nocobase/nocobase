/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import PluginWorkflowServer from '../Plugin';

export default class WorkflowRepository extends Repository {
  async revision(options) {
    const { filterByTk, filter, values, context } = options;
    const plugin = context.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    return this.database.sequelize.transaction(async (transaction) => {
      const origin = await this.findOne({
        filterByTk,
        filter,
        appends: ['nodes', 'stats', 'versionStats', 'categories.id'],
        context,
        transaction,
      });

      const trigger = plugin.triggers.get(origin.type);

      const revisionData = filter.key
        ? {
            key: filter.key,
            title: origin.title,
            triggerTitle: origin.triggerTitle,
            current: null,
            ...values,
          }
        : values;

      const instance = await this.create({
        values: {
          title: `${origin.title} copy`,
          description: origin.description,
          options: origin.options,
          categories: origin.categories.map((item) => item.id),
          ...revisionData,
          sync: origin.sync,
          type: origin.type,
          config:
            typeof trigger.duplicateConfig === 'function'
              ? await trigger.duplicateConfig(origin, { transaction })
              : origin.config,
        },
        transaction,
      });

      const originalNodesMap = new Map();
      origin.nodes.forEach((node) => {
        originalNodesMap.set(node.id, node);
      });

      const oldToNew = new Map();
      const newToOld = new Map();
      for await (const node of origin.nodes) {
        const instruction = plugin.instructions.get(node.type);
        const newNode = await instance.createNode(
          {
            type: node.type,
            key: node.key,
            config:
              typeof instruction.duplicateConfig === 'function'
                ? await instruction.duplicateConfig(node, { transaction })
                : node.config,
            title: node.title,
            branchIndex: node.branchIndex,
          },
          { transaction },
        );
        // NOTE: keep original node references for later replacement
        oldToNew.set(node.id, newNode);
        newToOld.set(newNode.id, node);
      }

      for await (const [oldId, newNode] of oldToNew.entries()) {
        const oldNode = originalNodesMap.get(oldId);
        const newUpstream = oldNode.upstreamId ? oldToNew.get(oldNode.upstreamId) : null;
        const newDownstream = oldNode.downstreamId ? oldToNew.get(oldNode.downstreamId) : null;

        await newNode.update(
          {
            upstreamId: newUpstream?.id ?? null,
            downstreamId: newDownstream?.id ?? null,
          },
          { transaction },
        );
      }

      return instance;
    });
  }
}
