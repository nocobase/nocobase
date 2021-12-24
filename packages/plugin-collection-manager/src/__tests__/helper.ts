import { generatePrefixByPath } from '@nocobase/test';

export const queryTable = async (model, tableName) => {
  return await model.queryInterface.describeTable(`${generatePrefixByPath()}_${tableName}`);
};
