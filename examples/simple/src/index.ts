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

app.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'password', name: 'password' },
  ],
});

app.parse(process.argv);

/*
根据配置生成相关数据表
yarn examples simple db:sync

启动服务
yarn examples simple start

客户端发送请求

创建数据
curl --location --request POST 'http://localhost:3000/api/examples/simple/users' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username": "abc",
    "password": "123456"
}'

查看列表
curl --location --request GET 'http://localhost:5051/api/examples/simple/users'
*/
