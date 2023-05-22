import { Context, utils } from '@nocobase/actions';

import Plugin from '../..';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';
import ManualInstruction from '.';

export async function submit(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, values } = context.action.params;
  const { currentUser } = context.state;

  if (!currentUser) {
    return context.throw(401);
  }

  const plugin: Plugin = context.app.pm.get('workflow') as Plugin;
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
  const [formKey] = Object.keys(values.result ?? {});

  // NOTE: validate status
  if (
    userJob.status !== JOB_STATUS.PENDING ||
    userJob.job.status !== JOB_STATUS.PENDING ||
    userJob.execution.status !== EXECUTION_STATUS.STARTED ||
    !userJob.workflow.enabled ||
    !forms[formKey]?.actions?.includes(values.status)
  ) {
    return context.throw(400);
  }

  userJob.execution.workflow = userJob.workflow;
  const processor = plugin.createProcessor(userJob.execution);
  await processor.prepare();

  // NOTE: validate assignee
  const assignees = processor.getParsedValue(userJob.node.config.assignees ?? []);
  if (!assignees.includes(currentUser.id) || userJob.userId !== currentUser.id) {
    return context.throw(403);
  }

  userJob.set({
    status: values.status,
    result: values.status ? values.result : Object.assign(userJob.result ?? {}, values.result),
  });

  const handler = instruction.formTypes.get(forms[formKey].type);
  if (handler && userJob.status) {
    await handler.call(instruction, userJob, forms[formKey], processor);
  }

  await userJob.save({ transaction: processor.transaction });

  await processor.exit(userJob.job);

  context.body = userJob;
  context.status = 202;

  await next();

  userJob.job.latestUserJob = userJob;

  // NOTE: resume the process and no `await` for quick returning
  plugin.resume(userJob.job);
}
