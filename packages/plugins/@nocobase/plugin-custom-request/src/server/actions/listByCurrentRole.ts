import { Context } from '@nocobase/actions';

export async function listByCurrentRole(ctx: Context) {
  const crRepo = ctx.db.getRepository('customRequestsRoles');
  ctx.body = (
    await crRepo.find({
      filter: {
        roleName: ctx.state.currentRole,
      },
    })
  ).map((item) => item.customRequestKey);
}
