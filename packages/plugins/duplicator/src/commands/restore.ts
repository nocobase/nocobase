import { Application } from '@nocobase/server';
import decompress from 'decompress';
import * as os from 'os';
import fsPromises from 'fs/promises';
import path from 'path';
import lodash from 'lodash';
import fs from 'fs';
import * as readline from 'readline';
import { sqlAdapter } from '../utils';

export default function addRestoreCommand(app: Application) {
  app
    .command('restore')
    .argument('<string>', 'restore file path')
    .action(async (restoreFilePath) => {
      await restoreAction(app, restoreFilePath);
    });
}

interface RestoreContext {
  app: Application;
  dir: string;
}

async function restoreAction(app, restoreFilePath: string) {
  const tmpDir = os.tmpdir();
  const restoreDir = path.resolve(tmpDir, `nocobase-restore-${Date.now()}`);

  const restoreContext: RestoreContext = {
    app,
    dir: restoreDir,
  };

  await decompress(restoreFilePath, restoreDir);
  console.log('decompressed at ' + restoreDir);

  await importCollections(restoreContext);

  await clearDump(restoreContext);
  await app.stop();
}

async function importCollections(ctx: RestoreContext) {
  const collectionsDir = path.resolve(ctx.dir, 'collections');
  const collections = await fsPromises.readdir(collectionsDir);

  for (const collectionName of collections) {
    await importCollection(ctx, {
      collectionName,
    });
  }
}

const _escapeString = function (val) {
  val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
    switch (s) {
      case "'":
        return "''";

      default:
        return s;
    }
  });

  return val;
};

export async function importCollection(
  ctx: RestoreContext,
  options: {
    collectionName: string;
    insert?: boolean;
    clear?: boolean;
  },
) {
  const { collectionName, insert } = options;
  const collection = ctx.app.db.getCollection(collectionName);
  const collectionDataPath = path.resolve(ctx.dir, 'collections', collectionName, 'data');
  const collectionMetaPath = path.resolve(ctx.dir, 'collections', collectionName, 'meta');

  const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
  const meta = JSON.parse(metaContent);

  if (!collection) {
  }

  const tableName = meta.tableName;

  if (options.clear !== false) {
    // truncate old data
    let sql = `TRUNCATE TABLE "${tableName}"`;

    if (ctx.app.db.inDialect('sqlite')) {
      sql = `DELETE
             FROM "${tableName}"`;
    }

    await ctx.app.db.sequelize.query(sqlAdapter(ctx.app.db, sql));
  }

  // read file content from collection data
  const rows = await readLines(collectionDataPath);

  if (rows.length == 0) {
    ctx.app.logger.info(`${collectionName} has no data to import`);
    return;
  }

  const columns = meta['columns'];

  const inertSQL = `INSERT INTO "${collection.model.tableName}" (${columns.map((c) => `"${c}"`).join(',')})
                    VALUES ${rows
                      .map((row) => {
                        return `(${columns
                          .map((column, index) => {
                            const data = JSON.parse(row)[index];

                            if (lodash.isPlainObject(data)) {
                              return `'${_escapeString(JSON.stringify(data))}'`;
                            }

                            if (lodash.isString(data)) {
                              return `'${_escapeString(data)}'`;
                            }

                            if (lodash.isNull(data)) {
                              return 'null';
                            }

                            return data;
                          })
                          .join(',')})`;
                      })
                      .join(',')}`;

  if (insert === false) {
    return inertSQL;
  }

  await ctx.app.db.sequelize.query(inertSQL, {
    type: 'INSERT',
  });

  ctx.app.logger.info(`${collectionName} imported with ${rows.length} rows`);
}

export async function readLines(filePath: string) {
  const results = [];
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    results.push(line);
  }
  return results;
}

async function clearDump(ctx: RestoreContext) {
  await fsPromises.rm(ctx.dir, { recursive: true });
}
