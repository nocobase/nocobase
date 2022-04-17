const getDialect = (ctx) => {
  return ctx.db.sequelize.getDialect();
};

const isPg = (ctx) => {
  return getDialect(ctx) === 'postgres';
};

const isMySQL = (ctx) => {
  return getDialect(ctx) === 'mysql';
};

export { getDialect, isPg, isMySQL };
