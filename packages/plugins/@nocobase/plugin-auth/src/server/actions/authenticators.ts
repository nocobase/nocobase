import { Context, Next } from '@nocobase/actions';
import { Model, Repository } from '@nocobase/database';
import { namespace } from '../../preset';
import { AuthManager } from '@nocobase/auth';

async function checkCount(repository: Repository, id: number[]) {
  // TODO(yangqia): This is a temporary solution, may cause concurrency problem.
  const count = await repository.count({
    filter: {
      enabled: true,
      id: {
        $ne: id,
      },
    },
  });
  if (count <= 0) {
    throw new Error('Please keep and enable at least one authenticator');
  }
}

export default {
  listTypes: async (ctx: Context, next: Next) => {
    ctx.body = ctx.app.authManager.listTypes();
    await next();
  },
  publicList: async (ctx: Context, next: Next) => {
    const repo = ctx.db.getRepository('authenticators');
    const authManager = ctx.app.authManager as AuthManager;
    const authenticators = await repo.find({
      fields: ['name', 'authType', 'title', 'options', 'sort'],
      filter: {
        enabled: true,
      },
      sort: 'sort',
    });
    ctx.body = authenticators.map((authenticator: Model) => {
      const authType = authManager.getAuthConfig(authenticator.authType);
      return {
        name: authenticator.name,
        authType: authenticator.authType,
        authTypeTitle: authType?.title || '',
        title: authenticator.title,
        options: authenticator.options?.public || {},
      };
    });
    await next();
  },
  destroy: async (ctx: Context, next: Next) => {
    const repository = ctx.db.getRepository('authenticators');
    const { filterByTk, filter } = ctx.action.params;
    try {
      await checkCount(repository, filterByTk);
    } catch (err) {
      ctx.throw(400, ctx.t(err.message, { ns: namespace }));
    }
    const instance = await repository.destroy({
      filter,
      filterByTk,
      context: ctx,
    });

    ctx.body = instance;
    await next();
  },
  update: async (ctx: Context, next: Next) => {
    const repository = ctx.db.getRepository('authenticators');
    const { forceUpdate, filterByTk, values, whitelist, blacklist, filter, updateAssociationValues } =
      ctx.action.params;

    if (!values.enabled) {
      try {
        await checkCount(repository, values.id);
      } catch (err) {
        ctx.throw(400, ctx.t(err.message, { ns: namespace }));
      }
    }

    ctx.body = await repository.update({
      filterByTk,
      values,
      whitelist,
      blacklist,
      filter,
      updateAssociationValues,
      context: ctx,
      forceUpdate,
    });

    await next();
  },
};
