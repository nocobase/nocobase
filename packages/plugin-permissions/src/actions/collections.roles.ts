import { actions, middlewares } from '@nocobase/actions';
import * as rolesCollectionsActions from './roles.collections';

export async function list(ctx: actions.Context, next: actions.Next) {
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({
    associated: null,
  });
  return actions.common.list(ctx, next);
}

export async function get(ctx: actions.Context, next: actions.Next) {
  const { resourceName, resourceKey, associatedName, associatedKey } = ctx.action.params;
  ctx.action.mergeParams({
    associated: null,
    resourceName: associatedName,
    resourceKey: associatedKey,
    associatedName: resourceName,
    associatedKey: resourceKey,
  });
  await middlewares.associated(ctx, async () => {
  });
  return rolesCollectionsActions.get(ctx, next);
}

export async function update(ctx: actions.Context, next: actions.Next) {
  const { resourceName, resourceKey, associatedName, associatedKey } = ctx.action.params;
  ctx.action.mergeParams({
    associated: null,
    resourceName: associatedName,
    resourceKey: associatedKey,
    associatedName: resourceName,
    associatedKey: resourceKey,
  });
  await middlewares.associated(ctx, async () => {
  });
  return rolesCollectionsActions.update(ctx, next);
}
