import { Database, Migration, mockDatabase } from '@nocobase/database';
import { resolve } from 'path';

const names = (migrations: Array<{ name: string }>) => migrations.map(m => m.name);

describe('migrator', () => {
  let db: Database;

  beforeEach(async () => {

    db = mockDatabase({
      tablePrefix: 'test_',
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('addMigrations', async () => {
    db.addMigrations({
      directory: resolve(__dirname, './fixtures/migrations'),
    });
    await db.migrator.up();
    expect(names(await db.migrator.executed())).toEqual(['m1', 'm2']);
  });

  test('addMigrations', async () => {
    db.addMigrations({
      namespace: 'test',
      directory: resolve(__dirname, './fixtures/migrations'),
    });
    await db.migrator.up();
    expect(names(await db.migrator.executed())).toEqual(['test/m1', 'test/m2']);
  });

  test('up and down', async () => {
    const spy = jest.fn();
    db.addMigration({
      name: 'migration1',
      migration: class extends Migration {
        async up() {
          spy('migration1-up');
        }
        async down() {
          spy('migration1-down');
        }
      },
    });
    db.addMigration({
      name: 'migration2',
      migration: class extends Migration {
        async up() {
          spy('migration2-up');
        }
        async down() {
          spy('migration2-down');
        }
      },
    });
    await db.migrator.up();
    expect(names(await db.migrator.executed())).toEqual(['migration1', 'migration2']);
    await db.migrator.down();
    expect(names(await db.migrator.executed())).toEqual(['migration1']);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(1, 'migration1-up');
  });
});
