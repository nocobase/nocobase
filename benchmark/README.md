## koa-database

```bash
yarn pm2 start benchmark/koa-database/index.js --name koa-database
wrk -t20 -c20 -d20s http://localhost:13010/
```

## koa-sequelize

```bash
yarn pm2 start benchmark/koa-sequelize/index.js --name koa-sequelize
wrk -t20 -c20 -d20s http://localhost:13020/
```

## nocobase-server

```bash
yarn pm2 start benchmark/nocobase-server/index.js --name nocobase-server
wrk -t20 -c20 -d20s http://localhost:13030/api/users
```

## koa-resourcer

```bash
yarn pm2 start benchmark/koa-resourcer/index.js --name koa-resourcer
wrk -t20 -c20 -d20s http://localhost:13040/api/users
```

## nocobase-app

```bash
yarn install
yarn build
yarn nocobase install
yarn start
wrk -t20 -c20 -d20s http://localhost:13000/api/users?token=
```
