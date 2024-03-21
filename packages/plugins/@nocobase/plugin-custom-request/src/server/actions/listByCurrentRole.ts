import { Context } from '@nocobase/actions';

export async function listByCurrentRole(ctx: Context) {
  const repo = ctx.db.getRepository('customRequests');
  const data = await repo.find({
    appends: ['roles'],
  });
  const crRepo = ctx.db.getRepository('customRequestsRoles');
  ctx.body = data
    .filter((item) => {
      return !item.roles.length;
    })
    .map((item) => item.key)
    .concat(
      (
        await crRepo.find({
          filter: {
            roleName: ctx.state.currentRole,
          },
        })
      ).map((item) => item.customRequestKey),
    );
}
