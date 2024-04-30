/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
