/*
Step 1: 将 collections 同步给数据库（建表和字段）
yarn run:example app/association2resource db:sync

Step 2:
yarn run:example app/association2resource start

Step 3: Create article
curl --location --request POST 'http://localhost:13000/api/articles:create' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "My first article",
    "content": "Hello NocoBase!",
    "user": {
      "name": "user 1"
    }
}'

Step 4: View article user
curl http://localhost:13000/api/articles/1/user
*/
import { Application } from '@nocobase/server';

const app = new Application({
  database: {
    logging: process.env.DB_LOGGING === 'on' ? console.log : false,
    dialect: process.env.DB_DIALECT as any,
    storage: process.env.DB_STORAGE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    timezone: process.env.DB_TIMEZONE,
    tablePrefix: 'a2r_',
  },
  resourcer: {
    prefix: '/api',
  },
  plugins: [],
});

// 已定义的 collection 会自动转为同名 resource
app.collection({
  name: 'articles',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'text',
      name: 'content',
    },
    // 自动转为 articles.user 资源
    {
      type: 'belongsTo',
      name: 'user',
      // 以下参数缺失时，自动处理
      // target: 'users',
      // foreignKey: 'userId',
      // targetKey: 'id',
    },
  ],
});

// 已定义的 collection 会自动转为同名 resource
app.collection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    // 自动转为 users.articles 资源
    {
      type: 'hasMany',
      name: 'articles',
      // 以下参数缺失时，自动处理
      // target: 'articles',
      // foreignKey: 'userId',
      // sourceKey: 'id',
    },
  ],
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
