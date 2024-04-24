const getDialect = (ctx) => {
  return ctx.db.sequelize.getDialect();
};

const isPg = (ctx) => {
  return getDialect(ctx) === 'postgres';
};

const isMySQL = (ctx) => {
  return getDialect(ctx) === 'mysql' || getDialect(ctx) === 'mariadb';
};

const getQueryInterface = (ctx) => {
  const sequelize = ctx.db.sequelize;
  return sequelize.getQueryInterface();
};

export { getDialect, isPg, isMySQL };
