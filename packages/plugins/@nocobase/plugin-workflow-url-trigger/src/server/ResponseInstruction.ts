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
 * Sets the HTTP response directly on the Koa context.
 * Supports: redirect, block (custom status), and data response.
 */
export default class ResponseInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { httpContext } = processor.options as any;
    const { type = 'redirect' } = node.config;

    const result: any = { type };

    if (type === 'redirect') {
      const url = processor.getParsedValue(node.config.url, node.id);
      result.url = url;
      if (httpContext && url) {
        httpContext.redirect(url);
      }
    } else if (type === 'block') {
      const status = processor.getParsedValue(node.config.status, node.id) ?? 403;
      const body = processor.getParsedValue(node.config.body, node.id) ?? '';
      result.status = status;
      result.body = body;
      if (httpContext) {
        httpContext.status = status;
        httpContext.body = typeof body === 'object' ? body : { message: body };
      }
    } else if (type === 'data') {
      const data = processor.getParsedValue(node.config.data, node.id);
      result.data = data;
      if (httpContext) {
        httpContext.status = 200;
        httpContext.body = data;
      }
    }

    return {
      result,
      status: JOB_STATUS.RESOLVED,
    };
  }
}
