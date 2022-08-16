/*
# 树结构设计 —— 路径枚举

yarn run:example database/collections/tree/materialized-path
*/
import { Database } from '@nocobase/database';
import { uid } from '@nocobase/utils';

const db = new Database({
  logging: process.env.DB_LOGGING === 'on' ? console.log : false,
  dialect: process.env.DB_DIALECT as any,
  storage: process.env.DB_STORAGE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as any,
  timezone: process.env.DB_TIMEZONE,
  tablePrefix: `t_${uid()}_`,
});

db.collection({
  name: 'categories',
  tree: 'materialized-path',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'treeParent',
      name: 'parent',
    },
    {
      type: 'treeChildren',
      name: 'children',
    },
  ],
});

(async () => {
  await db.sync();
  await db.close();
})();

export default db;
