import { Context, DEFAULT_PAGE, DEFAULT_PER_PAGE, Next } from '@nocobase/actions';

export async function updateProfile(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const { currentUser } = ctx.state;
  if (!currentUser) {
    ctx.throw(401);
  }
  const UserRepo = ctx.db.getRepository('users');
  const result = await UserRepo.update({
    filterByTk: currentUser.id,
    values,
  });
  ctx.body = result;
  await next();
}

export const listExcludeRole = async (ctx: Context, next: Next) => {
  const { roleName, page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE } = ctx.action.params;
  const repo = ctx.db.getRepository('users');
  const users = await repo.find({
    fields: ['id'],
    filter: {
      'roles.name': roleName,
    },
  });
  const userIds = users.map((user: { id: number }) => user.id);
  const [rows, count] = await repo.findAndCount({
    context: ctx,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    // Ensure memberIds is not empty to resolve strange issue:
    // notIn: [] will be translated to "WHERE id IS NULL"
    filter: userIds.length
      ? {
          id: {
            $notIn: userIds,
          },
        }
      : {},
  });
  ctx.body = {
    count,
    rows,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPage: Math.ceil(count / pageSize),
  };
  await next();
};
