import Database from '../database';
import { Dialect } from 'sequelize';



const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT, 10),
  dialect: process.env.DB_DIALECT as Dialect,
  define: {
    hooks: {
      beforeCreate(model, options) {
        
      },
    },
  },
  logging: false,
};

export function getDatabase() {
  return new Database(config);
};
