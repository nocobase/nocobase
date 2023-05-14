import { getRepositoryFromCtx } from './actions';

export const checkSendPermission = async (ctx, next) => {
  const { params: values } = ctx.action;

  const key = values.filterByTk;
  const rolesRepo = getRepositoryFromCtx(ctx, 'rolesCustomRequest');
  const currentRole = ctx.state.currentRole;

  const roleRecords = await rolesRepo.find({
    filter: { customRequestKey: key },
  });
  if (!roleRecords) {
    ctx.throw(401);
  }
  const roles = roleRecords?.map((roleRecord) => roleRecord?.roleName);
  if (!roles.includes(currentRole)) {
    ctx.throw(401);
  }

  await next();
};
