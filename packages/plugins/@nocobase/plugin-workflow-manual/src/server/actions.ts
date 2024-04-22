import { Context, utils } from '@nocobase/actions';
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

  const userJob = await repository.findOne({
    filterByTk,
    // filter: {
    //   userId: currentUser?.id
    // },
    appends: ['job', 'node', 'execution', 'workflow'],
    context,
  });

  if (!userJob) {
    return context.throw(404);
  }

  const { forms = {} } = userJob.node.config;
  const [formKey] = Object.keys(values.result ?? {}).filter((key) => key !== '_');
  const actionKey = values.result?._;

  const actionItem = forms[formKey]?.actions?.find((item) => item.key === actionKey);
  // NOTE: validate status
  if (
    userJob.status !== JOB_STATUS.PENDING ||
    userJob.job.status !== JOB_STATUS.PENDING ||
    userJob.execution.status !== EXECUTION_STATUS.STARTED ||
    !userJob.workflow.enabled ||
    !actionKey ||
    actionItem?.status == null
  ) {
    return context.throw(400);
  }

  userJob.execution.workflow = userJob.workflow;
  const processor = plugin.createProcessor(userJob.execution);
  await processor.prepare();

  // NOTE: validate assignee
  const assignees = processor
    .getParsedValue(userJob.node.config.assignees ?? [], userJob.nodeId)
    .flat()
    .filter(Boolean);
  if (!assignees.includes(currentUser.id) || userJob.userId !== currentUser.id) {
    return context.throw(403);
  }
  const presetValues = processor.getParsedValue(actionItem.values ?? {}, userJob.nodeId, {
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
  });

  userJob.set({
    status: actionItem.status,
    result:
      actionItem.status > JOB_STATUS.PENDING
        ? { [formKey]: Object.assign(values.result[formKey], presetValues), _: actionKey }
        : Object.assign(userJob.result ?? {}, values.result),
  });

  const handler = instruction.formTypes.get(forms[formKey].type);
  if (handler && userJob.status) {
    await handler.call(instruction, userJob, forms[formKey], processor);
  }

  await userJob.save();

  await processor.exit();

  context.body = userJob;
  context.status = 202;

  await next();

  userJob.job.execution = userJob.execution;
  userJob.job.latestUserJob = userJob;

  // NOTE: resume the process and no `await` for quick returning
  processor.logger.info(`manual node (${userJob.nodeId}) action trigger execution (${userJob.execution.id}) to resume`);

  plugin.resume(userJob.job);
}
