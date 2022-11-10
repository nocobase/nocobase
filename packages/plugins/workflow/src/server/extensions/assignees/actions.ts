import { Context, utils } from '@nocobase/actions';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';



export async function submit(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, values } = context.action.params;
  const { currentUser } = context.state;

  if (!currentUser) {
    return context.throw(401);
  }

  const instance = await repository.findOne({
    filterByTk,
    // filter: {
    //   userId: currentUser?.id
    // },
    appends: ['job', 'node', 'execution'],
    context
  });

  const { actions, assignees } = instance.node.config;

  // NOTE: validate status
  if (instance.status !== JOB_STATUS.PENDING
    || instance.job.status !== JOB_STATUS.PENDING
    || instance.execution.status !== EXECUTION_STATUS.STARTED
    || (actions && !actions[values.status])
  ) {
    context.throw(400);
  }

  if (!assignees.includes(currentUser.id)
    || instance.userId !== currentUser.id
  ) {
    return context.throw(404);
  }

  // NOTE: validate assignee
  await instance.update({
    status: values.status,
    result: values.result
  });

  context.body = instance;
  context.status = 202;

  await next();

  instance.job.latestUserJob = instance;

  const plugin = context.app.pm.get('workflow');
  // NOTE: resume the process and no `await` for quick returning
  plugin.resume(instance.job);
}
