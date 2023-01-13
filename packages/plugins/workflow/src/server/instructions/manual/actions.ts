import { Context, utils } from '@nocobase/actions';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';



export async function submit(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, values } = context.action.params;
  const { currentUser } = context.state;

  if (!currentUser) {
    return context.throw(401);
  }

  const transaction = await context.db.sequelize.transaction();

  const instance = await repository.findOne({
    filterByTk,
    // filter: {
    //   userId: currentUser?.id
    // },
    appends: ['job', 'node', 'execution', 'workflow'],
    context,
    transaction
  });

  if (!instance) {
    return context.throw(404);
  }

  const { actions = [] } = instance.node.config;

  // NOTE: validate status
  if (instance.status !== JOB_STATUS.PENDING
    || instance.job.status !== JOB_STATUS.PENDING
    || instance.execution.status !== EXECUTION_STATUS.STARTED
    || !actions.includes(values.status)
  ) {
    return context.throw(400);
  }

  const plugin = context.app.pm.get('workflow');
  instance.execution.workflow = instance.workflow;
  const processor = plugin.createProcessor(instance.execution, { transaction });
  await processor.prepare();

  const assignees = processor.getParsedValue(instance.node.config.assignees ?? []);
  if (!assignees.includes(currentUser.id)
    || instance.userId !== currentUser.id
  ) {
    return context.throw(403);
  }

  // NOTE: validate assignee
  await instance.update({
    status: values.status,
    result: values.result
  }, {
    transaction
  });

  await transaction.commit();

  context.body = instance;
  context.status = 202;

  await next();

  instance.job.latestUserJob = instance;

  // NOTE: resume the process and no `await` for quick returning
  plugin.resume(instance.job);
}
