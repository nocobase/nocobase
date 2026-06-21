/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import Joi from 'joi';
import { Instruction, Processor, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

interface Config {
  target?: string | null;
  value?: any;
}

export default class extends Instruction {
  configSchema = Joi.object({
    target: Joi.string().allow(null).optional(),
    value: Joi.any(),
  });

  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { target, value } = <Config>node.config;
    const result = processor.getParsedValue(value, node.id);

    if (target) {
      const targetNode = processor.nodes.find((item) => item.key === target);
      if (!targetNode) {
        throw new Error(`target node by key "${target}" is not found`);
      }

      await processor.saveJob({
        status: JOB_STATUS.RESOLVED,
        result,
        nodeId: targetNode.id,
        nodeKey: target,
        upstreamId: (prevJob && prevJob.id) || null,
      });
    }

    return {
      status: JOB_STATUS.RESOLVED,
      result,
    };
  }
}
