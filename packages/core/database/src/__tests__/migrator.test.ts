import { Database, Migration, mockDatabase } from '@nocobase/database';

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
