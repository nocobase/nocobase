/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, utils } from '@nocobase/actions';
import WorkflowPlugin, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import ManualInstruction from './ManualInstruction';

export async function submit(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, values } = context.action.params;
  const { currentUser } = context.state;

  if (!currentUser) {
    return context.throw(401);
  }

  const plugin: WorkflowPlugin = context.app.getPlugin(WorkflowPlugin);
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

  const actionItem = forms[formKey]?.actions?.find((item) => item.key === actionKey);
  // NOTE: validate status
  if (
    task.status !== JOB_STATUS.PENDING ||
    task.job.status !== JOB_STATUS.PENDING ||
    task.execution.status !== EXECUTION_STATUS.STARTED ||
    !task.workflow.enabled ||
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
      ? { [formKey]: Object.assign(values.result[formKey], presetValues), _: actionKey }
      : Object.assign(task.result ?? {}, values.result),
  });

  const handler = instruction.formTypes.get(forms[formKey].type);
  if (handler && task.status) {
    await handler.call(instruction, task, forms[formKey], processor);
  }

  await task.save();

  await processor.exit();

  context.body = task;
  context.status = 202;

  await next();

  task.job.execution = task.execution;
  task.job.latestTask = task;

  // NOTE: resume the process and no `await` for quick returning
  processor.logger.info(`manual node (${task.nodeId}) action trigger execution (${task.execution.id}) to resume`);

  plugin.resume(task.job);
}

export async function listMine(context: Context, next) {
  context.action.mergeParams({
    filter: {
      $and: [
        { userId: context.state.currentUser.id },
        {
          $or: [
            {
              'workflow.enabled': true,
            },
            {
              'workflow.enabled': false,
              status: {
                $ne: JOB_STATUS.PENDING,
              },
            },
          ],
        },
      ],
    },
  });

  return actions.list(context, next);
}
