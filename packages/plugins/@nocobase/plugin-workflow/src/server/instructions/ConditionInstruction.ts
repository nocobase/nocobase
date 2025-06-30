/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Evaluator, evaluators } from '@nocobase/evaluators';
import { Instruction } from '.';
import type Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel, JobModel } from '../types';
import { logicCalculate } from '../logicCalculate';

export const BRANCH_INDEX = {
  DEFAULT: null,
  ON_TRUE: 1,
  ON_FALSE: 0,
} as const;

export class ConditionInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { engine, calculation, expression, rejectOnFalse } = node.config || {};
    const evaluator = evaluators.get(engine);

    let result = true;

    try {
      result = evaluator
        ? evaluator(expression, processor.getScope(node.id))
        : logicCalculate(processor.getParsedValue(calculation, node.id));
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR,
      };
    }

    if (!result && rejectOnFalse) {
      return {
        status: JOB_STATUS.FAILED,
        result,
      };
    }

    const job = {
      status: JOB_STATUS.RESOLVED,
      result,
      // TODO(optimize): try unify the building of job
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: (prevJob && prevJob.id) || null,
    };

    const branchNode = processor.nodes.find(
      (item) => item.upstreamId === node.id && item.branchIndex != null && Boolean(item.branchIndex) === result,
    );

    if (!branchNode) {
      return job;
    }

    const savedJob = await processor.saveJob(job);

    await processor.run(branchNode, savedJob);

    return null;
  }

  async resume(node: FlowNodeModel, branchJob: JobModel, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node) as JobModel;

    if (branchJob.status === JOB_STATUS.RESOLVED) {
      // return to continue node.downstream
      return job;
    }

    // pass control to upper scope by ending current scope
    return processor.exit(branchJob.status);
  }

  async test({ engine, calculation, expression = '' }) {
    const evaluator = <Evaluator | undefined>evaluators.get(engine);
    try {
      const result = evaluator ? evaluator(expression) : logicCalculate(calculation);
      return {
        result,
        status: JOB_STATUS.RESOLVED,
      };
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR,
      };
    }
  }
}

export default ConditionInstruction;
