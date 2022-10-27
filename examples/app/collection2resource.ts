/*
Step 1: 将 collections 同步给数据库（建表和字段）
yarn run:example app/collection2resource db:sync

Step 2: 启动应用
yarn run:example app/collection2resource start

Step 3: Create article
curl --location --request POST 'http://localhost:13000/api/articles:create' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "My first article",
    "content": "Hello NocoBase!"
}'

Step 4: View article list
curl http://localhost:13000/api/articles:list
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
    tablePrefix: 'c2r_',
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
  ],
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
