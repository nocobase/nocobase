import { Sequelize } from 'sequelize';

const mapVal = (values, db) =>
  values.map((v) => {
    const collection = db.getCollection(v);
    return Sequelize.literal(`'${collection.tableNameAsString()}'::regclass`);
  });

const joinValues = (values, db) => {
  return values
    .map((v) => {
      const collection = db.getCollection(v);
      return `'${collection.tableNameAsString()}'::regclass`;
    })
    .join(', ');
};

export default {
  $childIn(values, ctx: any) {
    const db = ctx.db;
    return Sequelize.literal(`"tableoid" IN (${joinValues(values, db)})`);
  },

  $childNotIn(values, ctx: any) {
    const db = ctx.db;

    return Sequelize.literal(`"tableoid" NOT IN (${joinValues(values, db)})`);
  },
} as Record<string, any>;
