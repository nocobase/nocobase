/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, utils } from '@nocobase/actions';
import PluginWorkflowServer, {
  EXECUTION_STATUS,
  getExecutionLockKey,
  isLockAcquireError,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';

import ManualInstruction from './ManualInstruction';

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

  const handler = instruction.formTypes.get(forms[formKey].type);
  let shouldResume = false;

  try {
    const lock = await context.app.lockManager.tryAcquire(getExecutionLockKey(task.execution.id));
    await lock.runExclusive(async () => {
      await context.db.sequelize.transaction(async (transaction) => {
        await Promise.all([
          task.reload({ transaction }),
          task.job.reload({ transaction }),
          task.execution.reload({ transaction }),
        ]);
        if (
          task.status !== JOB_STATUS.PENDING ||
          task.job.status !== JOB_STATUS.PENDING ||
          task.execution.status !== EXECUTION_STATUS.STARTED
        ) {
          return context.throw(400);
        }

        task.set({
          status: actionItem.status,
          result: actionItem.status
            ? { [formKey]: { ...values.result[formKey], ...presetValues }, _: actionKey }
            : { ...(task.result ?? {}), ...values.result },
        });
        task.changed('result', true);

        if (handler && task.status) {
          await handler.call(instruction, task, forms[formKey], processor);
        }

        await task.save({ transaction });
        await instruction.updateJobByManualTasks(task.job, task.node, context.db, task, transaction);
        await task.job.save({ transaction });
        shouldResume = task.job.status !== JOB_STATUS.PENDING;
      });
    }, 60_000);
  } catch (error) {
    if (isLockAcquireError(error)) {
      return context.throw(409, 'Execution is being processed');
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
  processor.logger.info(`manual node (${task.nodeId}) action trigger execution (${task.execution.id}) to resume`);

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
