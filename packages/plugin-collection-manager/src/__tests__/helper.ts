import { generatePrefixByPath } from '@nocobase/test';

export const queryTable = async (model, tableName) => {
  const prefix = generatePrefixByPath();

  return await model.queryInterface.describeTable(tableName.includes(prefix) ? tableName : `${prefix}_${tableName}`);
};
