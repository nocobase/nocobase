import { QueryInterface, Sequelize } from 'sequelize';
import Database from './database';

export interface MigrationContext {
  db: Database;
  queryInterface: QueryInterface;
  sequelize: Sequelize;
}

export class Migration {
  public name: string;

  public context: { db: Database; [key: string]: any };

  constructor(context: MigrationContext) {
    this.context = context;
  }

  get db() {
    return this.context.db;
  }

  get sequelize() {
    return this.context.db.sequelize;
  }

  get queryInterface() {
    return this.context.db.sequelize.getQueryInterface();
  }

  async up() {
    // todo
  }

  async down() {
    // todo
  }
}

export interface MigrationItem {
  name: string;
  migration?: typeof Migration;
  context?: any;
  up?: any;
  down?: any;
}

export class Migrations {
  items = [];
  context: any;

  constructor(context: any) {
    this.context = context;
  }

  clear() {
    this.items = [];
  }

  add(item: MigrationItem) {
    const Migration = item.migration;
    if (Migration) {
      const migration = new Migration({ ...this.context, ...item.context });
      migration.name = item.name;
      this.items.push(migration);
    } else {
      this.items.push(item);
    }
  }

  callback() {
    return async (ctx) => {
      return this.items;
    };
  }
}
