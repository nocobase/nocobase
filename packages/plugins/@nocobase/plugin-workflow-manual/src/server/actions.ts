/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, utils } from '@nocobase/actions';
import { Transaction, type Database, type Model } from '@nocobase/database';
import PluginWorkflowServer, {
  EXECUTION_STATUS,
  type FlowNodeModel,
  getJobLockKey,
  isLockAcquireError,
  JOB_STATUS,
  type JobModel,
  type Processor,
} from '@nocobase/plugin-workflow';

import ManualInstruction, { type ManualConfig } from './ManualInstruction';

type ManualTaskModel = Model & {
  userId: number | string;
  status: number;
  result?: unknown;
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
  if (resolved?.count === assignees.length) {
    return JOB_STATUS.RESOLVED;
  }
  const rejected = distribution.find((item) => item.status < JOB_STATUS.PENDING);
  return rejected?.count ? rejected.status : null;
}

function getAnyModeStatus(distribution: StatusDistribution[], assignees: Array<number | string>) {
  const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
  if (resolved?.count) {
    return JOB_STATUS.RESOLVED;
  }
  const rejectedCount = distribution.reduce(
    (count, item) => (item.status < JOB_STATUS.PENDING ? count + item.count : count),
    0,
  );
  return rejectedCount === assignees.length ? JOB_STATUS.REJECTED : null;
}

async function updateJobByManualTasks(
  job: JobModel,
  node: FlowNodeModel,
  database: Database,
  latestTask: ManualTaskModel,
  transaction: Transaction,
) {
  const mode = (node.config as ManualConfig).mode ?? 0;
  const tasks = await database.getModel<ManualTaskModel>('workflowManualTasks').findAll({
    where: {
      jobId: job.id,
    },
    transaction,
  });
  const assignees: Array<number | string> = [];
  const distributionMap = new Map<number, number>();

  for (const task of tasks) {
    distributionMap.set(task.status, (distributionMap.get(task.status) ?? 0) + 1);
    assignees.push(task.userId);
  }

  const distribution = Array.from(distributionMap.entries()).map(([status, count]) => ({ status, count }));
  const status =
    mode === 1
      ? getAllModeStatus(distribution, assignees)
      : mode === -1
        ? getAnyModeStatus(distribution, assignees)
        : getSingleModeStatus(distribution);

  await job.update(
    {
      status: status ?? JOB_STATUS.PENDING,
      result: mode ? getSubmittedRatio(tasks) : latestTask.result ?? job.result,
    },
    { transaction },
  );
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
  const formConfig = forms[formKey];
  const handler = instruction.formTypes.get(formConfig.type);
  const usesMainDataSource = (formConfig.dataSource ?? 'main') === 'main';
  const transactionOptions =
    context.db.sequelize.getDialect() === 'sqlite' ? { type: Transaction.TYPES.IMMEDIATE } : {};
  const validateTask = () => {
    if (
      task.status !== JOB_STATUS.PENDING ||
      task.job.status !== JOB_STATUS.PENDING ||
      task.execution.status !== EXECUTION_STATUS.STARTED
    ) {
      return context.throw(400);
    }
  };
  const getPresetValues = (processor: Processor): Record<string, unknown> => {
    const assignees = processor
      .getParsedValue(task.node.config.assignees ?? [], task.nodeId)
      .flat()
      .filter(Boolean);
    if (!assignees.includes(currentUser.id) || task.userId !== currentUser.id) {
      return context.throw(403);
    }

    return processor.getParsedValue(actionItem.values ?? {}, task.nodeId, {
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
  };
  const setTaskResult = (presetValues: Record<string, unknown>) => {
    task.set({
      status: actionItem.status,
      result: actionItem.status
        ? { [formKey]: { ...values.result[formKey], ...presetValues }, _: actionKey }
        : { ...(task.result ?? {}), ...values.result },
    });
    task.changed('result', true);
  };
  const handleFormSubmission = async (transaction?: Transaction) => {
    const processor = plugin.createProcessor(task.execution, { transaction });
    await processor.prepare();
    const presetValues = getPresetValues(processor);
    setTaskResult(presetValues);
    if (handler && task.status) {
      const { actions, ...formOptions } = formConfig;
      const parsedFormConfig = {
        ...processor.getParsedValue(formOptions, task.nodeId),
        actions,
      };
      await handler.call(instruction, task, parsedFormConfig, transaction);
    }
    return presetValues;
  };
  let shouldResume = false;

  try {
    const lock = await context.app.lockManager.tryAcquire(getJobLockKey(task.job.id));
    await lock.runExclusive(async () => {
      let presetValues: Record<string, unknown> = {};

      if (!usesMainDataSource) {
        await Promise.all([task.reload(), task.job.reload(), task.execution.reload()]);
        validateTask();
        presetValues = await handleFormSubmission();
      }

      await context.db.sequelize.transaction(transactionOptions, async (transaction) => {
        await Promise.all([
          task.reload({ transaction }),
          task.job.reload({ transaction }),
          task.execution.reload({ transaction }),
        ]);
        validateTask();

        if (usesMainDataSource) {
          await handleFormSubmission(transaction);
        } else {
          setTaskResult(presetValues);
        }

        await task.save({ transaction });
        await updateJobByManualTasks(task.job, task.node, context.db, task, transaction);
        shouldResume = task.job.status !== JOB_STATUS.PENDING;
      });
    }, 60_000);
  } catch (error) {
    if (isLockAcquireError(error)) {
      return context.throw(409);
    }
    throw error;
  }

  context.body = task;
  context.status = 202;

  await next();

  if (!shouldResume) {
    return;
  }

  // NOTE: resume the process and no `await` for quick returning
  plugin
    .getLogger(task.execution.workflowId)
    .info(`manual node (${task.nodeId}) action trigger execution (${task.execution.id}) to resume`);

  plugin.resume(task.job).catch(() => undefined);
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
