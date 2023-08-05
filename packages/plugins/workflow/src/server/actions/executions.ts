import actions, { Context } from '@nocobase/actions';
import { Op } from '@nocobase/database';
import { EXECUTION_STATUS } from '../constants';

export async function destroy(context: Context, next) {
  context.action.mergeParams({
    filter: {
      status: {
        [Op.ne]: EXECUTION_STATUS.STARTED,
      },
    },
  });

  await actions.destroy(context, next);
}
