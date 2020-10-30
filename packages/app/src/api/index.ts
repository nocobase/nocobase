import Api from '../../../api/src';
import dotenv from 'dotenv';
import path from 'path';
import Database from '@nocobase/database';

const sync = {
  force: true,
  alter: {
    drop: true,
  },
};

dotenv.config();

const api = Api.create({
  database: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.platform === 'linux' ? process.env.DB_HOST : 'localhost',
    port: process.platform === 'linux' ? parseInt(process.env.DB_PORT) : ( process.env.DB_DIALECT == 'postgres' ? 45432 : 23306 ),
    dialect: process.env.DB_DIALECT as any,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    logging: false,
    define: {},
    sync,
  },
  resourcer: {
    prefix: '/api',
  },
});

(async () => {
  await api
    .plugins([
      [path.resolve(__dirname, '../../../plugin-collections'), {}],
      [path.resolve(__dirname, '../../../plugin-pages'), {}],
      // [require('../../plugin-collections/src/index').default, {}],
      // [require('../../plugin-pages/src/index').default, {}],
    ]);

  const database: Database = api.database;

  const Collection = database.getModel('collections');
  const tables = database.getTables([]);

  for (let table of tables) {
    const options = table.getOptions();
    const collection = await Collection.create({
      name: options.name,
      title: options.title,
    });
    await collection.updateAssociations({
      fields: options.fields.map(field => {
        return {
          type: field.type,
          name: field.name,
          options: field,
        };
      }),
    });
  }

  // const collections = await Collection.findAll();

  // await Promise.all(collections.map(async (collection) => {
  //   return await collection.modelInit();
  // }));

  api.listen(process.env.HTTP_PORT, () => {
    console.log(`http://localhost:${process.env.HTTP_PORT}/`);
  });
})();
