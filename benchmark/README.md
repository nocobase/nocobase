## koa-database

http://localhost:13010/

```bash
yarn pm2 start benchmark/koa-database/index.js --name koa-database
```

## koa-sequelize

http://localhost:13020/

```bash
yarn pm2 start benchmark/koa-sequelize/index.js --name koa-sequelize
```

## nocobase-server

http://localhost:13030/api/users

```bash
yarn pm2 start benchmark/nocobase-server/index.js --name nocobase-server
```

## koa-resourcer

http://localhost:13040/api/users

```bash
yarn pm2 start benchmark/koa-resourcer/index.js --name koa-resourcer
```

## nocobase-app

http://localhost:13000/api/users?token=

```bash
yarn install
yarn build
yarn nocobase install
yarn start
```
