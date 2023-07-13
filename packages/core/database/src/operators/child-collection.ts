import lodash from 'lodash';
import { Sequelize } from 'sequelize';

const mapVal = (values, db) =>
  values.map((v) => {
    const collection = db.getCollection(v);
    return Sequelize.literal(`'${collection.tableNameAsString()}'::regclass`);
  });

const filterItems = (values, db) => {
  return lodash
    .castArray(values)
    .map((v) => {
      const collection = db.getCollection(v);
      if (!collection) return null;
      return `'${collection.tableNameAsString()}'::regclass`;
    })
    .filter(Boolean);
};
const joinValues = (items) => items.join(', ');
export default {
  $childIn(values, ctx: any) {
    const db = ctx.db;
    const items = filterItems(values, db);

    if (items.length) {
      return Sequelize.literal(`"${ctx.model.name}"."tableoid" IN (${joinValues(items)})`);
    } else {
      return Sequelize.literal(`1 = 2`);
    }
  },

  $childNotIn(values, ctx: any) {
    const db = ctx.db;
    const items = filterItems(values, db);

    if (items.length) {
      return Sequelize.literal(`"${ctx.model.name}"."tableoid" NOT IN (${joinValues(items)})`);
    } else {
      return Sequelize.literal(`1 = 1`);
    }
  },
} as Record<string, any>;
