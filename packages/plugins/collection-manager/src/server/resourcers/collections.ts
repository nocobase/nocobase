import defaultActions, { Context, Next } from '@nocobase/actions';
import { Database } from '@nocobase/database';
import { Application } from '@nocobase/server';

export default {
  async ['collections:setFields'](ctx, next) {
    const { filterByTk, values } = ctx.action.params;

    const transaction = await ctx.app.db.sequelize.transaction();

    try {
      const fields = values.fields?.map((f) => {
        delete f.key;
        return f;
      });

      const db = ctx.app.db as Database;

      const collection = await db.getRepository('collections').findOne({
        filter: {
          name: filterByTk,
        },
        transaction,
      });

      const existFields = await collection.getFields({
        transaction,
      });

      const needUpdateFields = fields
        .filter((f) => {
          return existFields.find((ef) => ef.name === f.name);
        })
        .map((f) => {
          return {
            ...f,
            key: existFields.find((ef) => ef.name === f.name).key,
          };
        });

      const needDestroyFields = existFields.filter((ef) => {
        return !fields.find((f) => f.name === ef.name);
      });

      const needCreatedFields = fields.filter((f) => {
        return !existFields.find((ef) => ef.name === f.name);
      });

      if (needDestroyFields.length) {
        await db.getRepository('fields').destroy({
          filterByTk: needDestroyFields.map((f) => f.key),
          transaction,
        });
      }

      if (needUpdateFields.length) {
        await db.getRepository('fields').updateMany({
          records: needUpdateFields,
          transaction,
        });
      }

      if (needCreatedFields.length) {
        await db.getRepository('collections.fields', filterByTk).create({
          values: needCreatedFields,
          transaction,
        });
      }

      await collection.loadFields({
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    await next();
  },
  async ['collections:listByRole'](ctx: Context, next: Next) {
    const roleName = ctx.state.currentRole;
    if (roleName === 'root') {
      return defaultActions.list(ctx, next);
    }
    const role = (ctx.app as Application).acl.getRole(roleName);
    // Check global actions set in strategy
    const strategy = role.getStrategy();
    if (!strategy) {
      ctx.body = [];
      return next();
    }
    const actions = strategy.options.actions;
    if (!actions || (actions !== '*' && !actions.includes('view'))) {
      ctx.body = [];
      return next();
    }
    // Get resources have individual configuration
    const resources = Array.from(role.resources.values());
    // Exclude resources without view action permission
    const excludes = resources.filter((resource) => !resource.getAction('view')).map((resource) => resource.name);
    ctx.action.mergeParams({
      filter: excludes.length
        ? {
            name: {
              $notIn: excludes,
            },
          }
        : {},
    });
    return defaultActions.list(ctx, async () => {
      const collections = (ctx.body || []).map((collection: any) => {
        const resource = role.getResource(collection.name);
        if (!resource) {
          return collection;
        }
        const associationFields = Array.from(role.resources.keys())
          .filter((key) => key.startsWith(`${collection.name}.`))
          .map((key) => key.split('.')[1]);
        const allowFields = [...(resource.getAction('view').fields || []), ...associationFields];
        collection.set(
          'fields',
          collection.fields.filter((field: any) => allowFields.includes(field.name)),
          { raw: true },
        );
        return collection;
      });
      ctx.body = collections;
      await next();
    });
  },
};
