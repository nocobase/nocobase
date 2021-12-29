import { Context } from '@nocobase/actions';

export const uiSchemaActions = {
  async insert(ctx: Context, next) {
    const { db } = ctx;
    const { values } = ctx.action.params;
  },

  async create(ctx: Context, next) {
    const { db } = ctx;
    const { values } = ctx.action.params;

    const transaction = await db.sequelize.transaction();

    try {
      const repository = db.getCollection('ui_schemas').repository;
      const model = await repository.create({
        values,
        transaction,
      });

      // insert tree path
      const modelKey = model.get('key') as string;
      const modelParentKey = model.get('parentKey') as string;
      const treeCollection = db.getCollection('ui_schema_tree_path');

      if (modelParentKey) {
        await db.sequelize.query(
          `INSERT INTO ${treeCollection.model.tableName} (ancestor, descendant)
SELECT t.ancestor, :modelKey FROM ${treeCollection.model.tableName} AS t  WHERE t.descendant = :modelParentKey UNION ALL  SELECT :modelKey, :modelKey`,
          {
            type: 'INSERT',
            transaction,
            replacements: {
              modelKey,
              modelParentKey,
            },
          },
        );
      } else {
        await db.sequelize.query(
          `INSERT INTO ${treeCollection.model.tableName}(ancestor, descendant) VALUES (:modelKey, :modelKey)`,
          {
            type: 'INSERT',
            replacements: {
              modelKey,
            },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (err) {
      throw err;
    }

    await next();
  },
};
