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
    const looped = 0;

    if (!branch || !length) {
      return {
        status: JOB_STATUS.RESOLVED,
        result: { looped },
      };
    }

    // NOTE: save job for condition calculation
    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: { looped },
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    if (node.config.condition) {
      const { checkpoint, calculation, expression, continueOnFalse } = node.config.condition ?? {};
      if ((calculation || expression) && !checkpoint) {
        const condition = calculateCondition(node, processor);
        if (!condition) {
          if (continueOnFalse) {
            job.set('result', { looped: 1 });
            processor.saveJob(job);
          } else {
            job.set({
              status: JOB_STATUS.RESOLVED,
              result: { looped, broken: true },
            });
            return job;
          }
        }
      }
    }

    await processor.run(branch, job);

    return null;
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

    const nextIndex = result.looped + 1;

    const target = processor.getParsedValue(loop.config.target, node.id);
    // NOTE: branchJob.status === JOB_STATUS.RESOLVED means branchJob is done, try next loop or exit as resolved
    if (
      branchJob.status === JOB_STATUS.RESOLVED ||
      (branchJob.status < JOB_STATUS.PENDING && loop.config.exit === EXIT.CONTINUE)
    ) {
      job.set({ result: { looped: nextIndex } });
      processor.saveJob(job);

      const length = getTargetLength(target);
      if (nextIndex < length) {
        if (loop.config.condition) {
          const { calculation, expression, continueOnFalse } = loop.config.condition ?? {};
          if (calculation || expression) {
            const condition = calculateCondition(loop, processor);
            if (!condition && !continueOnFalse) {
              job.set({
                status: JOB_STATUS.RESOLVED,
                result: { looped: nextIndex, broken: true },
              });
              return job;
            }
          }
        }
        await processor.run(branch, job);
        return null;
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
              result: { looped: result.looped, broken: true },
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
