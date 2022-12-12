export const joinComma = (value: any[]) => {
  return value.join(',')
}

export const toValue = (value?: string) => {
  if (!value) return null
  return JSON.parse(value.replace(/\(/g, '[').replace(/\)/g, ']'))
}

export const getDialect = (ctx) => {
  return (ctx.db || ctx.database).sequelize.getDialect();
};

export const isPg = (ctx) => {
  return getDialect(ctx) === 'postgres';
};
