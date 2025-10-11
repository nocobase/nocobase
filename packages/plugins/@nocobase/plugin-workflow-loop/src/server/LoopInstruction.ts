/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import evaluators from '@nocobase/evaluators';
import { Processor, Instruction, JOB_STATUS, FlowNodeModel, JobModel, logicCalculate } from '@nocobase/plugin-workflow';
import { EXIT } from '../constants';

function getLoopLimit() {
  const limit = process.env.WORKFLOW_LOOP_LIMIT;
  return limit ? parseInt(limit, 10) : null;
}

export type LoopInstructionConfig = {
  target: any;
  condition?:
    | {
        checkpoint?: number;
        continueOnFalse?: boolean;
        calculation?: any;
        expression?: string;
      }
    | false;
  exit?: number;
};

function getTargetLength(target) {
  let length = 0;
  if (typeof target === 'number') {
    if (target < 0) {
      throw new Error('Loop target in number type must be greater than 0');
    }
    length = Math.floor(target);
  } else {
    const targets = Array.isArray(target) ? target : [target].filter((t) => t != null);
    length = targets.length;
  }
  return length;
}

function calculateCondition(node: FlowNodeModel, processor: Processor) {
  const { engine, calculation, expression } = node.config.condition ?? {};
  const evaluator = evaluators.get(engine);

  return evaluator
    ? evaluator(expression, processor.getScope(node.id, true))
    : logicCalculate(processor.getParsedValue(calculation, node.id, { includeSelfScope: true }));
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob: JobModel, processor: Processor) {
    const [branch] = processor.getBranches(node);
    const target = processor.getParsedValue(node.config.target, node.id);
    const length = getTargetLength(target);
    const result = { looped: 0, done: 0 };

    if (!branch || !length) {
      return {
        status: JOB_STATUS.RESOLVED,
        result,
      };
    }

    // NOTE: save job for condition calculation
    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      result,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    if (node.config.condition) {
      const { checkpoint, calculation, expression, continueOnFalse } = node.config.condition ?? {};
      if ((calculation || expression) && !checkpoint) {
        while (result.looped < length) {
          const condition = calculateCondition(node, processor);
          if (condition) {
            // NOTE: if condition matches, run inner branch
            break;
          }
          result.looped += 1;
          job.set('result', result);
          if (continueOnFalse) {
            // NOTE: if `continueOnFalse` is true, continue next loop directly
            processor.saveJob(job);
            continue;
          }
          job.set({
            status: JOB_STATUS.RESOLVED,
            result: { ...result, broken: true },
          });
          return job;
        }
        if (result.looped >= length) {
          job.set({
            status: JOB_STATUS.RESOLVED,
            result,
          });
          return job;
        }
      }
    }

    await processor.run(branch, job);
  }

  async resume(node: FlowNodeModel, branchJob, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node) as JobModel;
    const loop = processor.nodesMap.get(job.nodeId);
    const [branch] = processor.getBranches(node);

    const { result, status } = job;
    // NOTE: if loop has been done (resolved / rejected), do not care newly executed branch jobs.
    if (status !== JOB_STATUS.PENDING) {
      processor.logger.warn(`loop (${job.nodeId}) has been done, ignore newly resumed event`);
      return null;
    }

    if (branchJob.id !== job.id && branchJob.status === JOB_STATUS.PENDING) {
      return null;
    }

    result.looped += 1;

    const target = processor.getParsedValue(loop.config.target, node.id);
    // NOTE: branchJob.status === JOB_STATUS.RESOLVED means branchJob is done, try next loop or exit as resolved
    if (
      branchJob.status === JOB_STATUS.RESOLVED ||
      (branchJob.status < JOB_STATUS.PENDING && loop.config.exit === EXIT.CONTINUE)
    ) {
      result.done += 1;
      const length = getTargetLength(target);

      if (loop.config.condition) {
        const { calculation, expression, continueOnFalse } = loop.config.condition ?? {};
        if (calculation || expression) {
          while (result.looped < length) {
            const condition = calculateCondition(loop, processor);
            if (condition) {
              // NOTE: if condition matched, run inner branch
              processor.logger.debug(`loop condition matched, continue inner branch (looped: ${result.looped})`);
              break;
            }
            if (!continueOnFalse) {
              processor.logger.debug(`loop condition not matches, break (looped: ${result.looped})`);
              job.set({
                status: JOB_STATUS.RESOLVED,
                result: { ...result, broken: true },
              });
              return job;
            }
            // NOTE: if `continueOnFalse` is true, continue next loop directly
            result.looped += 1;
            processor.logger.debug(`loop condition not matches, try next loop item (looped: ${result.looped})`);
          }
        }
      }
      job.set({ result });
      job.changed('result', true);
      processor.saveJob(job);
      if (result.looped < length) {
        const loopLimit = getLoopLimit();
        if (!loopLimit || result.done < loopLimit) {
          await processor.run(branch, job);
          return;
        }
        job.set({
          status: JOB_STATUS.ERROR,
          result: { ...result, exceeded: true },
        });
      } else {
        job.set({
          status: JOB_STATUS.RESOLVED,
        });
      }
    } else {
      // NOTE: branchJob.status < JOB_STATUS.PENDING means branchJob is rejected, any rejection should cause loop rejected
      job.set(
        loop.config.exit
          ? {
              result: { ...result, broken: true },
              status: JOB_STATUS.RESOLVED,
            }
          : {
              status: branchJob.status,
            },
      );
    }

    return job;
  }

  getScope(node, { looped }, processor) {
    const target = processor.getParsedValue(node.config.target, node.id);
    const targets = (Array.isArray(target) ? target : [target]).filter((t) => t != null);
    const length = getTargetLength(target);
    const index = looped;
    const item = typeof target === 'number' ? index : targets[looped];

    const result = {
      item,
      index,
      sequence: index + 1,
      length,
    };

    return result;
  }
}
