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

type ConditionConfig = {
  uid?: string;
  title?: string;
  engine?: string;
  calculation?: any;
  expression?: string;
};

type MultiConditionsConfig = {
  conditions?: ConditionConfig[];
  continueOnNoMatch?: boolean;
};

type BranchOutcome = boolean | number | string;
type BranchOutcomeList = BranchOutcome[];
type BranchOutcomeMeta = {
  conditions: BranchOutcomeList;
};

export class MultiConditionsInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { conditions = [], continueOnNoMatch = false } = (node.config || {}) as MultiConditionsConfig;
    const meta: BranchOutcomeMeta = { conditions: [] };

    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: null,
      meta,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    for (let cursor = 0; cursor < conditions.length; cursor++) {
      const branchIndex = cursor + 1;
      const condition = conditions[cursor];
      let conditionResult: BranchOutcome;

      try {
        conditionResult = this.evaluateCondition(condition, node, processor);
      } catch (error) {
        conditionResult = error instanceof Error ? error.message : String(error);
        processor.logger.error(`[multi-conditions] evaluate condition[${cursor}] error:`, { error });
      } finally {
        meta.conditions.push(conditionResult);
        job.set('result', conditionResult);
      }

      if (typeof conditionResult === 'string') {
        job.set('status', JOB_STATUS.ERROR);
        return job;
      }

      if (conditionResult === true) {
        const branchNode = this.getBranchNode(node, processor, branchIndex);
        job.set('status', JOB_STATUS.RESOLVED);
        if (branchNode) {
          await processor.run(branchNode, job);
          return;
        }
        return job;
      }
    }

    job.set('status', continueOnNoMatch ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED);
    const defaultBranch = this.getBranchNode(node, processor, 0);
    if (defaultBranch) {
      await processor.run(defaultBranch, job);
      return;
    }

    return job;
  }

  async resume(node: FlowNodeModel, branchJob: JobModel, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node) as JobModel;
    if (!job) {
      throw new Error('Parent job not found');
    }

    const { continueOnNoMatch = false } = (node.config || {}) as MultiConditionsConfig;

    const jobNode = processor.nodesMap.get(branchJob.nodeId) as FlowNodeModel;
    const branchStartNode = processor.findBranchStartNode(jobNode, node) as FlowNodeModel;
    const branchIndex = branchStartNode.branchIndex;

    if (branchJob.status === JOB_STATUS.RESOLVED) {
      if (branchIndex > 0) {
        job.set({
          status: JOB_STATUS.RESOLVED,
        });
        return job;
      }

      job.set({ status: continueOnNoMatch ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED });
      return job;
    }

    return processor.exit(branchJob.status);
  }

  private evaluateCondition(condition: ConditionConfig, node: FlowNodeModel, processor: Processor) {
    const { engine = 'basic', calculation, expression } = condition ?? {};
    const evaluator = evaluators.get(engine);
    return evaluator
      ? evaluator(expression, processor.getScope(node.id))
      : logicCalculate(processor.getParsedValue(calculation, node.id));
  }

  private getBranchNode(node: FlowNodeModel, processor: Processor, branchIndex: number) {
    return processor.getBranches(node).find((item) => Number(item.branchIndex) === Number(branchIndex));
  }
}

export default MultiConditionsInstruction;
