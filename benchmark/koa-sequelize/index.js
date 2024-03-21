const Koa = require('koa');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  logging: false,
});

const User = sequelize.define(
  'users',
  {
    nickname: DataTypes.STRING,
    username: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
  },
  {
    underscored: true,
  },
);

const app = new Koa();

app.use(async (ctx, next) => {
  ctx.body = await User.findAndCountAll({
    offset: 0,
    limit: 20,
  });
  await next();
});

app.listen(13020, () => {
  console.log('koa-sequelize: http://localhost:13020/');
});
