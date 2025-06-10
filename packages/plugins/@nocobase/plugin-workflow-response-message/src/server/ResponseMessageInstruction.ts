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
  message?: string;
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { httpContext } = processor.options;

    if (!httpContext) {
      return {
        status: JOB_STATUS.RESOLVED,
        result: null,
      };
    }

    if (!httpContext.state) {
      httpContext.state = {};
    }

    if (!httpContext.state.messages) {
      httpContext.state.messages = [];
    }

    const message = processor.getParsedValue(node.config.message, node.id);

    if (message) {
      httpContext.state.messages.push({ message });
    }

    return {
      status: JOB_STATUS.RESOLVED,
      result: message,
    };
  }
}
