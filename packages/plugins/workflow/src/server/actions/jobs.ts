import { Context } from '@nocobase/actions';
import { JOB_STATUS } from '../constants';

export async function submit(context: Context, next) {
  const { values } = context.action.params;

  const { body: instance } = context;

  // NOTE: validate status
  if (instance.status !== JOB_STATUS.PENDING) {
    return context.throw(400);
  }

  // NOTE: validate assignee
  instance.set({
    status: values.status,
    result: values.result
  });

  context.status = 202;

  await next();

  const plugin = context.app.pm.get('workflow');
  // NOTE: resume the process and no `await` for quick returning
  plugin.resume(instance);
}
