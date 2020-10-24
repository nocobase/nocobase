import Database from '../src';
import path from 'path';
import dbDriven from './plugins/db-driven';

const sync = {
  force: true,
  alter: {
    drop: true,
  }
}

const db = new Database({
  username: 'test',
  password: 'test',
  database: 'test',
  host: '127.0.0.1',
  port: 45432,
  dialect: 'postgres',
  logging: false,
  define: {
  },
  sync,
});

(async () => {

  const tables = db.import({
    directory: path.resolve(__dirname, 'tables'),
  });

  await db.sync({ tables });

  await db.plugin(dbDriven());

  if (!sync.force) {
    await db.sequelize.drop();
    await db.sync();
  }

  const [Table, Field] = db.getModels(['tables', 'fields']);

  const [table] = await Table.findOrCreate({
    where: {
      name: 'demos',
    },
    defaults: {
      options: {
        name: 'demos',
      },
    },
  });

  await db.getModel('demos').create({});

  await Field.bulkCreate([
    {
      name: 'col1',
      table_name: 'demos',
      options: {
        type: 'string',
        name: 'col1',
      },
    },
    {
      name: 'col2',
      table_name: 'demos',
      options: {
        type: 'string',
        name: 'col2',
      },
    },
  ]);

  await db.getModel('demos').create({
    col1: 'col1',
    col2: 'col2',
  });

  await table.createField({
    name: 'col3',
    options: {
      type: 'string',
      name: 'col3',
    },
  });
  
  await db.getModel('demos').create({
    col1: 'col1',
    col2: 'col2',
    col3: 'col3',
  });

  await table.createField({
    name: 'col4',
    options: {
      type: 'string',
      name: 'col4',
    },
  });

  await db.getModel('demos').create({
    col1: 'col1',
    col2: 'col2',
    col3: 'col3',
    col4: 'col4',
  });

  await table.createField({
    name: 'col5',
    options: {
      type: 'string',
      name: 'col5',
    },
  });

  await db.getModel('demos').create({
    col1: 'col1',
    col2: 'col2',
    col3: 'col3',
    col4: 'col4',
    col5: 'col5',
  });

  await db.close();
})();
