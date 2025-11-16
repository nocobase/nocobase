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

type ConditionState = {
  matchedIndex: number;
  lastAttemptedIndex: number | null;
};

const INITIAL_STATE: ConditionState = {
  matchedIndex: 0,
  lastAttemptedIndex: null,
};

export class MultiConditionsInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: { ...INITIAL_STATE },
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    const outcome = await this.proceed(node, processor, job);
    if (outcome) {
      return outcome;
    }
  }

  async resume(node: FlowNodeModel, branchJob: JobModel, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node) as JobModel;
    if (!job) {
      return processor.exit(branchJob.status);
    }

    const state = this.getState(job);
    const { continueOnNoMatch = false } = (node.config || {}) as MultiConditionsConfig;

    if (branchJob.status === JOB_STATUS.RESOLVED) {
      if (state.matchedIndex > 0) {
        job.set({ status: JOB_STATUS.RESOLVED });
        return job;
      }

      job.set({ status: continueOnNoMatch ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED });
      return job;
    }

    if (branchJob.status >= JOB_STATUS.PENDING) {
      processor.saveJob(job);
      return null;
    }

    if (state.lastAttemptedIndex === 0) {
      return processor.exit(branchJob.status);
    }

    state.matchedIndex = 0;
    job.set({ status: JOB_STATUS.PENDING, result: { ...state } });
    const outcome = await this.proceed(node, processor, job);
    if (outcome) {
      return outcome;
    }
    return null;
  }

  private getState(job: JobModel): ConditionState {
    const result = job.result || {};
    return {
      matchedIndex: Number(result.matchedIndex) || 0,
      lastAttemptedIndex: Number(result.lastAttemptedIndex) || 0,
    };
  }

  private async proceed(node: FlowNodeModel, processor: Processor, job: JobModel) {
    const { conditions = [], continueOnNoMatch = false } = (node.config || {}) as MultiConditionsConfig;
    const state = this.getState(job);

    for (let cursor = state.lastAttemptedIndex ?? 0; cursor < conditions.length; cursor++) {
      const branchIndex = cursor + 1;
      const condition = conditions[cursor];
      let passed = false;

      try {
        passed = this.evaluateCondition(condition, node, processor);
      } catch (error) {
        job.set({
          status: JOB_STATUS.ERROR,
          result: {
            ...state,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        return job;
      }

      state.lastAttemptedIndex = branchIndex;
      job.set('result', { ...state });

      if (passed) {
        state.matchedIndex = branchIndex;
        job.set('result', { ...state });
        processor.saveJob(job);
        const branchNode = this.getBranchNode(node, processor, branchIndex);
        if (branchNode) {
          await processor.run(branchNode, job);
          return null;
        }

        job.set({ status: JOB_STATUS.RESOLVED });
        return job;
      }

      processor.saveJob(job);
    }

    state.lastAttemptedIndex = 0;
    state.matchedIndex = 0;
    job.set('result', { ...state });
    processor.saveJob(job);

    const defaultBranch = this.getBranchNode(node, processor, 0);
    if (defaultBranch) {
      await processor.run(defaultBranch, job);
      return null;
    }

    job.set({ status: continueOnNoMatch ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED });
    return job;
  }

  private evaluateCondition(condition: ConditionConfig, node: FlowNodeModel, processor: Processor) {
    if (!condition) {
      return false;
    }

    const { engine = 'basic', calculation, expression } = condition;
    if (engine && engine !== 'basic') {
      const evaluator = <Evaluator | undefined>evaluators.get(engine);
      if (!evaluator || !expression) {
        return false;
      }
      return Boolean(evaluator(expression, processor.getScope(node.id)));
    }

    return Boolean(logicCalculate(processor.getParsedValue(calculation, node.id)));
  }

  private getBranchNode(node: FlowNodeModel, processor: Processor, branchIndex: number) {
    return processor.getBranches(node).find((item) => Number(item.branchIndex) === Number(branchIndex));
  }
}

export default MultiConditionsInstruction;
