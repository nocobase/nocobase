/*
# Application Migration

# 步骤

Step 1:
yarn run:example app/migrations/add-migration migrator up

Step 2:
yarn run:example app/migrations/add-migration migrator down
*/
import { DataTypes } from '@nocobase/database';
import { Application, Migration } from '@nocobase/server';

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
    tablePrefix: process.env.DB_TABLE_PREFIX,
  },
  resourcer: {
    prefix: '/api',
  },
  plugins: [],
});

class MyMigration extends Migration {
  async up() {
    /*
    可用的属性
    this.app;
    this.db;
    this.queryInterface;
    this.sequelize;
    */
    await this.queryInterface.createTable('test', {
      name: DataTypes.STRING,
    });
  }

  async down() {
    await this.queryInterface.dropTable('test');
  }
}

app.db.addMigration({
  name: 'my-migration',
  migration: MyMigration,
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
