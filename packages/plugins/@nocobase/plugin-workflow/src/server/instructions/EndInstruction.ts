/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import Instruction from '.';
import Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import { FlowNodeModel } from '../types';

interface Config {
  endStatus: number;
}

export default class extends Instruction {
  configSchema = Joi.object({
    endStatus: Joi.number().valid(JOB_STATUS.RESOLVED, JOB_STATUS.FAILED),
  });

  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { endStatus = JOB_STATUS.RESOLVED } = <Config>node.config;
    processor.saveJob({
      status: endStatus,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    return processor.exit(endStatus);
  }
}
