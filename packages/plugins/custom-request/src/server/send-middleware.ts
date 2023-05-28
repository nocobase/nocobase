import { getRepositoryFromCtx } from './actions';
import { NAME_SPACE } from './actions/utils';

export const throw401 = (ctx) => {
  ctx.throw(401, ctx.t('The current role has no request permission', { ns: NAME_SPACE }));
};
export const checkSendPermission = async (ctx, next) => {
  const { params: values } = ctx.action;

  const key = values.filterByTk;
  const rolesRepo = getRepositoryFromCtx(ctx, 'rolesCustomRequest');
  const currentRole = ctx.state.currentRole;
  if (currentRole === 'root') {
    next();
  } else {
    const roleRecords = await rolesRepo.find({
      filter: { customRequestKey: key },
    });

    if (!roleRecords) {
      throw401(ctx);
    }
    const roles = roleRecords?.map((roleRecord) => roleRecord?.roleName);
    if (!roles.includes(currentRole)) {
      throw401(ctx);
    }

    await next();
  }
};
