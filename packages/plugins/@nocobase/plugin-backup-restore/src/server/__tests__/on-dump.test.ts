import { MockServer } from '@nocobase/test';
import { Collection, Database } from '@nocobase/database';
import createApp from './index';
import { Dumper } from '../dumper';
import { Restorer } from '../restorer';
import path from 'path';
import fs from 'fs';

describe('on dump', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should handle collection onDump api', async () => {
    class OnDumpCollection extends Collection {}

    app.db.collectionFactory.registerCollectionType(OnDumpCollection, {
      condition(options) {
        return options.onDump;
      },

      async onSync(model, options) {
        return;
      },

      async onDump(dumper: Dumper, collection) {
        dumper.writeSQLContent('onDumpCollection', {
          sql: `CREATE TABLE ${collection.getTableNameWithSchemaAsString()} (id int);`,
          group: 'required',
        });
      },
    });

    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'onDumpCollection',
        title: 'onDumpCollection',
        onDump: true,
      },
      context: {},
    });

    const dumper = new Dumper(app);

    const result = await dumper.dump({
      groups: new Set(['required']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.parseBackupFile();

    const sqlContentPath = path.resolve(restorer.workDir, 'sql-content.json');
    const sqlContent = JSON.parse(await fs.promises.readFile(sqlContentPath, 'utf8'));

    expect(sqlContent).toBeDefined();
    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });
  });
});
