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

import { Instruction, Processor, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

interface Config {
  target?: string | null;
  value?: any;
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { target, value } = <Config>node.config;
    let result = processor.getParsedValue(value, node.id);

    // If result is a string that looks like a JSON/JS literal (e.g., "[{a:1}]" from useTypedConstant),
    // parse it back to the actual value so downstream nodes (like loop) can iterate over it properly.
    if (typeof result === 'string' && result.length > 0) {
      try {
        result = JSON.parse(result);
      } catch {
        try {
          result = new Function(`return (${result})`)();
        } catch {
          // Not a parseable literal, keep as string
        }
      }
    }

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
