import { Application } from '@nocobase/server';
import decompress from 'decompress';
import * as os from 'os';
import fsPromises from 'fs/promises';
import path from 'path';
import lodash from 'lodash';
import fs from 'fs';
import * as readline from 'readline';
import { sqlAdapter } from '../utils';
import { DataTypes } from '@nocobase/database';

export default function addRestoreCommand(app: Application) {
  app
    .command('restore')
    .argument('<string>', 'restore file path')
    .option('-i, --ignore [value...]', 'ignore collections')
    .action(async (restoreFilePath, options) => {
      await restoreAction(app, restoreFilePath, options);
    });
}

interface RestoreContext {
  app: Application;
  dir: string;
}

async function restoreAction(app: Application, restoreFilePath: string, options) {
  const tmpDir = os.tmpdir();
  const restoreDir = path.resolve(tmpDir, `nocobase-restore-${Date.now()}`);

  const restoreContext: RestoreContext = {
    app,
    dir: restoreDir,
  };

  await decompress(restoreFilePath, restoreDir);
  console.log('decompressed at ' + restoreDir);

  await importCollections(restoreContext, options);

  await clearDump(restoreContext);
  await app.stop();
}

async function importCollections(ctx: RestoreContext, options) {
  const collectionsDir = path.resolve(ctx.dir, 'collections');
  const collections = await fsPromises.readdir(collectionsDir);

  const ignore = lodash.castArray(options.ignore);

  if (ignore.includes('users')) {
    ignore.push('rolesUsers');
  }

  // import plugins
  await importCollection(ctx, {
    collectionName: 'applicationPlugins',
  });

  await ctx.app.reload();

  const metaCollections = [
    'uiSchemas',
    'uiRoutes',
    'uiSchemaServerHooks',
    'uiSchemaTemplates',
    'uiSchemaTreePath',
    'collections',
    'fields',
  ];

  // import collections and uiSchemas
  for (const collectionName of metaCollections) {
    await importCollection(ctx, {
      collectionName,
    });
  }

  //@ts-ignore
  await ctx.app.db.getRepository('collections').load();

  await ctx.app.db.sync({
    force: false,
    alter: {
      drop: false,
    },
  });

  const expectedCollections = [...metaCollections, 'applicationPlugins'];

  // import custom collections
  for (const collectionName of collections.filter((collectionName) => !expectedCollections.includes(collectionName))) {
    if (ignore.includes(collectionName)) {
      continue;
    }

    await importCollection(ctx, {
      collectionName,
    });
  }
}

export async function importCollection(
  ctx: RestoreContext,
  options: {
    collectionName: string;
    insert?: boolean;
    clear?: boolean;
  },
) {
  const { app } = ctx;
  app.log.info(`start import ${options.collectionName}`);
  const { collectionName, insert } = options;
  const collection = ctx.app.db.getCollection(collectionName);
  const collectionDataPath = path.resolve(ctx.dir, 'collections', collectionName, 'data');
  const collectionMetaPath = path.resolve(ctx.dir, 'collections', collectionName, 'meta');

  const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
  const meta = JSON.parse(metaContent);
  app.log.info(`collection meta ${metaContent}`);
  const tableName = meta.tableName;

  if (options.clear !== false) {
    // truncate old data
    let sql = `TRUNCATE TABLE "${tableName}"`;

    if (ctx.app.db.inDialect('sqlite')) {
      sql = `DELETE FROM "${tableName}"`;
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

  const fields = columns
    .map((column) => [column, collection.getField(column)])
    .reduce((carry, [column, type]) => {
      carry[column] = type;
      return carry;
    }, {});

  const rowsWithMeta = rows.map((row) =>
    JSON.parse(row)
      .map((val, index) => [columns[index], val])
      .reduce((carry, [column, val]) => {
        if (val === null) {
          carry[column] = null;
          return carry;
        }

        const field = fields[column];

        if (!field) {
          carry[column] = val;
          return carry;
        }

        if (field.type === 'point') {
          val = `(${val.x}, ${val.y})`;
        }

        if (field.dataType === DataTypes.BOOLEAN) {
          val = Boolean(val);
        }

        if (field.dataType === DataTypes.JSON) {
          val = lodash.isString(val) ? JSON.parse(val) : val;
        }

        carry[column] = val;

        return carry;
      }, {}),
  );

  const model = collection.model;

  const fieldMappedAttributes = {};
  // @ts-ignore
  for (const attr in model.tableAttributes) {
    fieldMappedAttributes[model.rawAttributes[attr].field || attr] = model.rawAttributes[attr];
  }

  //@ts-ignore
  const sql = collection.model.queryInterface.queryGenerator.bulkInsertQuery(
    tableName,
    rowsWithMeta,
    {},
    fieldMappedAttributes,
  );

  if (insert === false) {
    return sql;
  }

  await ctx.app.db.sequelize.query(sql, {
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
