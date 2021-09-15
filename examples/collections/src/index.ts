import { Application } from '@nocobase/server/src';
import path from 'path';

const keys = __dirname.split(path.sep);
const slug = keys[keys.length - 2];

const options = {
  database: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    dialect: process.env.DB_DIALECT as any,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    hooks: {
      beforeDefine(model, options) {
        options.tableName = `examples_${slug}_${options.tableName || options.name.plural}`;
      },
    },
  },
  resourcer: {
    prefix: `/api/examples/${slug}`,
  },
};

console.log(options);

const app = new Application(options);

// 用户
app.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username', unique: true },
    { type: 'password', name: 'password', unique: true },
    { type: 'hasMany', name: 'posts', foreignKey: 'author_id' },
  ],
});

// 文章
app.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'text', name: 'content' },
    { type: 'belongsToMany', name: 'tags' },
    { type: 'hasMany', name: 'comments' },
    { type: 'belongsTo', name: 'author', target: 'users' },
  ],
});

// 标签
app.collection({
  name: 'tags',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'belongsToMany', name: 'posts' },
  ],
});

// 评论
app.collection({
  name: 'comments',
  fields: [
    { type: 'text', name: 'content' },
    { type: 'belongsTo', name: 'user' },
  ],
});

app.parse(process.argv);

// yarn examples collections db sync
// yarn examples collections start
