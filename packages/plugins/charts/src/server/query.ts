export const query = {
  api: async (options) => {
    return [];
  },
  json: async (options) => {
    return options.data || [];
  },
  sql: async (options, { db, transaction }) => {
    try {
      const [data] = await db.sequelize.query(options.sql, { transaction });
      return data;
    } catch (error) {
      console.log(error);
      return [];
    }
  },
};

export default query;
