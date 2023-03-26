import { Database } from '@nocobase/database';

export const query = {
  api: async (options) => {
    return [];
  },
  json: async (options) => {
    return options.data || [];
  },
  sql: async (
    options,
    {
      db,
      transaction,
      skipError,
      validateSQL,
    }: { db: Database; transaction?: any; skipError?: boolean; validateSQL?: boolean },
  ) => {
    try {
      // 分号截取，只取第一段
      const sql: string = options.sql.trim().split(';').shift();
      if (!sql) {
        throw new Error('SQL is empty');
      }
      if (!/^select/i.test(sql) && !/^with([\s\S]+)select([\s\S]+)/i.test(sql)) {
        throw new Error('Only select query allowed');
      }
      const [data] = await db.sequelize.query(sql, { transaction });
      return data;
    } catch (error) {
      if (skipError) {
        return [];
      }
      throw error;
    }
  },
};

export default query;
