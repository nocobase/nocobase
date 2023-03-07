import { Op, Sequelize } from 'sequelize';

const mapVal = (values, db) =>
  values.map((v) => {
    const collection = db.getCollection(v);
    return Sequelize.literal(`'${collection.tableNameAsString()}'::regclass`);
  });

export default {
  $childIn(values, ctx: any) {
    const db = ctx.db;

    return {
      [Op.in]: mapVal(values, db),
    };
  },
  $childNotIn(values, ctx: any) {
    const db = ctx.db;

    return {
      [Op.notIn]: mapVal(values, db),
    };
  },
};
