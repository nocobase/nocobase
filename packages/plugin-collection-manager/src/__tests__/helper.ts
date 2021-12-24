import { generatePrefixByPath } from '@nocobase/test';
import { Database } from '@nocobase/database';

export const getTableName = (tableName: string) => {
  const prefix = generatePrefixByPath();
  return tableName.includes(prefix) ? tableName : `${prefix}_${tableName}`;
};

export const queryTable = async (model, tableName) => {
  return await model.queryInterface.describeTable(getTableName(tableName));
};

export const queryInterface = (db: Database) => {
  return db.sequelize.getQueryInterface();
};
