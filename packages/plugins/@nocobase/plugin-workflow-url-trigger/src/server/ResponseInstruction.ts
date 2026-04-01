/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

/**
 * HTTP Response instruction for URL trigger workflows.
 * Follows the same pattern as webhook's ResponseInstruction:
 * saves result to job and calls processor.exit().
 * The trigger reads the result from the last job.
 */
export default class ResponseInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    let result;
    let status;

    try {
      const type = node.config.type ?? 'redirect';
      const headers = processor.getParsedValue(node.config.headers ?? [], node.id);

      const responseResult: any = {
        type,
        headers: Array.isArray(headers) ? headers.reduce((pre, h) => ({ ...pre, [h.name]: h.value }), {}) : {},
      };

      if (type === 'redirect') {
        responseResult.url = processor.getParsedValue(node.config.url, node.id);
        responseResult.statusCode = 302;
      } else if (type === 'block') {
        responseResult.statusCode = processor.getParsedValue(node.config.status, node.id) ?? 403;
        responseResult.body = processor.getParsedValue(node.config.body, node.id) ?? '';
      } else if (type === 'data') {
        responseResult.statusCode = 200;
        responseResult.body = processor.getParsedValue(node.config.data, node.id);
      }

      result = responseResult;
      status = JOB_STATUS.RESOLVED;
    } catch (error) {
      result = { error: error.message };
      status = JOB_STATUS.ERROR;
    }

    await processor.saveJob({
      status,
      result,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    return processor.exit(JOB_STATUS.RESOLVED);
  }
}
