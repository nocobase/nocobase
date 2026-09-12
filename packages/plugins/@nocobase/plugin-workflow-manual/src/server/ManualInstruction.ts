/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import { Registry } from '@nocobase/utils';
import WorkflowPlugin, { Instruction, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';
import type { FlowNodeModel, JobModel } from '@nocobase/plugin-workflow';

import initFormTypes, { FormHandler } from './forms';

type FormType = {
  type: 'custom' | 'create' | 'update';
  actions: number[];
  options: {
    [key: string]: any;
  };
};

export interface ManualConfig {
  schema: { [key: string]: any };
  forms: { [key: string]: FormType };
  assignees?: (number | string)[];
  mode?: number;
  title?: string;
}

export default class extends Instruction {
  formTypes = new Registry<FormHandler>();

  constructor(public workflow: WorkflowPlugin) {
    super(workflow);

    initFormTypes(this);
  }

  async run(node, prevJob, processor: Processor) {
    const { mode, ...config } = node.config as ManualConfig;
    const assignees = [...new Set(processor.getParsedValue(config.assignees, node.id).flat().filter(Boolean))];

    const job = processor.saveJob({
      status: assignees.length ? JOB_STATUS.PENDING : JOB_STATUS.RESOLVED,
      result: mode ? [] : null,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    if (!assignees.length) {
      return job;
    }
    const title = config.title ? processor.getParsedValue(config.title, node.id) : node.title;
    // NOTE: batch create users jobs
    const TaskRepo = this.workflow.app.db.getRepository('workflowManualTasks');
    await TaskRepo.createMany({
      records: assignees.map((userId) => ({
        userId,
        jobId: job.id,
        nodeId: node.id,
        executionId: job.executionId,
        workflowId: node.workflowId,
        status: JOB_STATUS.PENDING,
        title,
      })),
    });

    return job;
  }

  async resume(node: FlowNodeModel, job: JobModel, processor: Processor) {
    processor.logger.debug(`manual resume job and next status: ${job.status}`);
    return job;
  }
}
