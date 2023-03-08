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
      let sql = options.sql.trim().split(';').shift();
      // 处理变量
      const variables = options?.variables;
      if (variables && Array.isArray(variables) && variables.length > 0) {
        const extra = {};
        variables.forEach((variable) => {
          const { key, value } = variable;
          extra[key] = value;
        });
        const reg = /{{(.*?)}}/g;
        sql = sql.replace(reg, (match, key) => {
          if (extra[key]) {
            return extra[key];
          } else {
            return match;
          }
        });
      }
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
