/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, utils } from '@nocobase/actions';
import PluginWorkflowServer, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import ManualInstruction from './ManualInstruction';

type ManualTaskModel = {
  id: number | string;
  userId: number | string;
  jobId: number | string;
  status: number;
  result?: unknown;
  job: {
    status: number;
    result?: unknown;
    set(values: { status: number; result: unknown }): void;
    save(): Promise<void>;
  };
  node: {
    config: {
      mode?: number;
    };
  };
};

type StatusDistribution = {
  status: number;
  count: number;
};

function getSubmittedRatio(tasks: ManualTaskModel[]) {
  if (!tasks.length) {
    return 0;
  }
  const submitted = tasks.reduce((count, item) => (item.status !== JOB_STATUS.PENDING ? count + 1 : count), 0);
  return submitted / tasks.length;
}

function getSingleModeStatus(distribution: StatusDistribution[]) {
  return distribution.find((item) => item.status !== JOB_STATUS.PENDING && item.count > 0)?.status ?? null;
}

function getAllModeStatus(distribution: StatusDistribution[], assignees: Array<number | string>) {
  const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
  if (resolved && resolved.count === assignees.length) {
    return JOB_STATUS.RESOLVED;
  }
  const rejected = distribution.find((item) => item.status < JOB_STATUS.PENDING);
  if (rejected && rejected.count) {
    return rejected.status;
  }

  return null;
}

function getAnyModeStatus(distribution: StatusDistribution[], assignees: Array<number | string>) {
  const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
  if (resolved && resolved.count) {
    return JOB_STATUS.RESOLVED;
  }
  const rejectedCount = distribution.reduce(
    (count, item) => (item.status < JOB_STATUS.PENDING ? count + item.count : count),
    0,
  );
  if (rejectedCount === assignees.length) {
    return JOB_STATUS.REJECTED;
  }

  return null;
}

async function updateJobByManualTask(task: ManualTaskModel, context: Context) {
  const mode = task.node.config.mode ?? 0;
  const tasks = (await context.db.getModel('workflowManualTasks').findAll({
    where: {
      jobId: task.jobId,
    },
  })) as ManualTaskModel[];
  const assignees: Array<number | string> = [];
  const distributionMap = new Map<number, number>();

  for (const item of tasks) {
    distributionMap.set(item.status, (distributionMap.get(item.status) ?? 0) + 1);
    assignees.push(item.userId);
  }

  const distribution = Array.from(distributionMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));
  const status =
    mode === 1
      ? getAllModeStatus(distribution, assignees)
      : mode === -1
        ? getAnyModeStatus(distribution, assignees)
        : getSingleModeStatus(distribution);

  task.job.set({
    status: status ?? JOB_STATUS.PENDING,
    result: mode ? getSubmittedRatio(tasks) : task.result ?? task.job.result,
  });
}

export async function submit(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, values } = context.action.params;
  const { currentUser } = context.state;

  if (!currentUser) {
    return context.throw(401);
  }

  const plugin = context.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
  const instruction = plugin.instructions.get('manual') as ManualInstruction;

  const task = await repository.findOne({
    filterByTk,
    // filter: {
    //   userId: currentUser?.id
    // },
    appends: ['job', 'node', 'execution', 'workflow'],
    context,
  });

  if (!task) {
    return context.throw(404);
  }

  const { forms = {} } = task.node.config;
  const [formKey] = Object.keys(values.result ?? {}).filter((key) => key !== '_');
  const actionKey = values.result?._;

  if (!task.execution) {
    return context.throw(400);
  }
  if (
    task.execution.status === EXECUTION_STATUS.STARTED &&
    plugin.timeoutManager.isExpired(task.execution) &&
    (await plugin.timeoutManager.abort(task.execution))
  ) {
    return context.throw(400, context.t('Execution timed out', { ns: 'workflow' }));
  }

  const actionItem = forms[formKey]?.actions?.find((item) => item.key === actionKey);
  // NOTE: validate status
  if (
    task.status !== JOB_STATUS.PENDING ||
    task.job.status !== JOB_STATUS.PENDING ||
    task.execution.status !== EXECUTION_STATUS.STARTED ||
    // !task.workflow.enabled ||
    !actionKey ||
    actionItem?.status == null
  ) {
    return context.throw(400);
  }

  task.execution.workflow = task.workflow;
  const processor = plugin.createProcessor(task.execution);
  await processor.prepare();

  // NOTE: validate assignee
  const assignees = processor
    .getParsedValue(task.node.config.assignees ?? [], task.nodeId)
    .flat()
    .filter(Boolean);
  if (!assignees.includes(currentUser.id) || task.userId !== currentUser.id) {
    return context.throw(403);
  }
  const presetValues = processor.getParsedValue(actionItem.values ?? {}, task.nodeId, {
    additionalScope: {
      // @deprecated
      currentUser: currentUser,
      // @deprecated
      currentRecord: values.result[formKey],
      // @deprecated
      currentTime: new Date(),
      $user: currentUser,
      $nForm: values.result[formKey],
      $nDate: {
        now: new Date(),
      },
    },
  });

  task.set({
    status: actionItem.status,
    result: actionItem.status
      ? { [formKey]: { ...values.result[formKey], ...presetValues }, _: actionKey }
      : { ...(task.result ?? {}), ...values.result },
  });
  task.changed('result', true);

  const handler = instruction.formTypes.get(forms[formKey].type);
  if (handler && task.status) {
    await handler.call(instruction, task, forms[formKey], processor);
  }

  await task.save();
  await updateJobByManualTask(task as ManualTaskModel, context);
  await task.job.save();

  context.body = task;
  context.status = 202;

  await next();

  if (task.execution.status !== EXECUTION_STATUS.STARTED) {
    return;
  }

  // NOTE: resume the process and no `await` for quick returning
  processor.logger.info(`manual node (${task.nodeId}) action trigger execution (${task.execution.id}) to resume`);

  plugin.resume(task.job);
}

export async function listMine(context: Context, next) {
  context.action.mergeParams({
    filter: {
      $and: [
        { userId: context.state.currentUser.id },
        // {
        //   $or: [
        //     {
        //       'workflow.enabled': true,
        //     },
        //     {
        //       'workflow.enabled': false,
        //       status: {
        //         $ne: JOB_STATUS.PENDING,
        //       },
        //     },
        //   ],
        // },
      ],
    },
  });

  return actions.list(context, next);
}
