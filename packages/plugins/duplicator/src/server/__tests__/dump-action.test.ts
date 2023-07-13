import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import * as os from 'os';
import path from 'path';
import fsPromises from 'fs/promises';
import { Dumper } from '../dumper';
import { readLines } from '../utils';
import { Restorer } from '../restorer';

describe('dump', () => {
  let app: MockServer;
  let db: Database;

  let testDir: string;
  beforeEach(async () => {
    testDir = path.resolve(os.tmpdir(), `nocobase-dump-${Date.now()}`);
    await fsPromises.mkdir(testDir, { recursive: true });
    app = mockServer();

    db = app.db;
    await app.cleanDb();

    app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'integer',
          name: 'age',
        },
        {
          type: 'string',
          name: 'address',
        },
        {
          type: 'json',
          name: 'meta',
        },
        {
          type: 'belongsTo',
          name: 'profile',
          foreignKey: 'profile_id',
        },
      ],
    });

    app.db.collection({
      name: 'profiles',
      fields: [],
    });

    await db.sync();
  });

  afterEach(async () => {
    await app.destroy();
    await fsPromises.rm(testDir, { recursive: true });
  });

  it('should dump collection to meta and data', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'user1',
          age: 18,
          address: 'address1',
          meta: {
            hello: 'world',
          },
          profile: {},
        },
        {
          name: 'user2',
          age: 19,
          address: null,
          meta: {
            hello: 'world2',
            withQuota: 'with "quota" \'quota\'',
          },
          profile: {},
        },
      ],
    });

    const dumper = new Dumper(app, {
      workDir: testDir,
    });

    await dumper.dumpCollection({
      name: 'users',
    });

    const collectionMetaFile = await fsPromises.readFile(path.resolve(testDir, 'collections', 'users', 'meta'), 'utf8');

    const collectionMeta = JSON.parse(collectionMetaFile);
    expect(collectionMeta.count).toEqual(2);
    expect(collectionMeta.columns).toEqual(
      Object.keys(db.getCollection('users').model.rawAttributes).map(
        (fieldName) => db.getCollection('users').model.rawAttributes[fieldName].field,
      ),
    );

    const dataPath = path.resolve(testDir, 'collections', 'users', 'data');

    const results = await readLines(dataPath);

    expect(results.length).toEqual(2);

    const restorer = new Restorer(app, {
      workDir: testDir,
    });

    const sql = await restorer.importCollection({
      name: 'users',
      insert: false,
    });

    await db.sequelize.query(sql, { type: 'INSERT' });
  });

  it('should dump user defined functions', async () => {
    if (db.sequelize.getDialect() !== 'postgres') {
      return;
    }

    await db.sequelize.query(`
    CREATE OR REPLACE FUNCTION add(integer, integer) RETURNS integer
    AS 'select $1 + $2;'
    LANGUAGE SQL
    IMMUTABLE
    RETURNS NULL ON NULL INPUT;
    `);

    await db.sequelize.query(`
CREATE OR REPLACE FUNCTION trigger_function()
   RETURNS TRIGGER
   LANGUAGE PLPGSQL
AS $$
BEGIN
   -- trigger logic
END;
$$`);

    await db.sequelize.query(`
CREATE  TRIGGER last_name_changes
  BEFORE UPDATE
  ON ${app.db.getCollection('users').quotedTableName()}
  FOR EACH ROW
  EXECUTE PROCEDURE  trigger_function();
    `);

    await db.sequelize.query(`
    CREATE OR REPLACE VIEW vistaView AS SELECT 'Hello World' as hello;
    `);

    const dumper = new Dumper(app, {
      workDir: testDir,
    });

    await dumper.dumpDb();

    const restorer = new Restorer(app, {
      workDir: testDir,
    });

    await restorer.importDb();
  });
});
