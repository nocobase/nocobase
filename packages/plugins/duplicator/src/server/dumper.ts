import { CollectionGroup } from '@nocobase/database';
import archiver from 'archiver';
import dayjs from 'dayjs';
import fs from 'fs';
import fsPromises from 'fs/promises';
import lodash from 'lodash';
import mkdirp from 'mkdirp';
import path from 'path';
import stream from 'stream';
import util from 'util';
import { AppMigrator } from './app-migrator';
import { CollectionGroupManager } from './collection-group-manager';
import { FieldValueWriter } from './field-value-writer';
import { DUMPED_EXTENSION, humanFileSize, sqlAdapter } from './utils';

const finished = util.promisify(stream.finished);

export class Dumper extends AppMigrator {
  direction = 'dump' as const;

  async dumpableCollections(): Promise<{
    requiredGroups: CollectionGroup[];
    optionalGroups: CollectionGroup[];
    userCollections: Array<{
      name: string;
      title: string;
    }>;
  }> {
    const appCollectionGroups = CollectionGroupManager.getGroups(this.app);

    const { requiredGroups, optionalGroups } = CollectionGroupManager.classifyCollectionGroups(appCollectionGroups);
    const pluginsCollections = CollectionGroupManager.getGroupsCollections(appCollectionGroups);

    const userCollections = await this.getCustomCollections();
    return lodash.cloneDeep({
      requiredGroups,
      optionalGroups,
      userCollections: await Promise.all(
        userCollections
          .filter((collection) => !pluginsCollections.includes(collection)) //remove collection that is in plugins
          .map(async (name) => {
            // map user collection to { name, title }

            const collectionInstance = await this.app.db.getRepository('collections').findOne({
              filterByTk: name,
            });

            return {
              name,
              title: collectionInstance.get('title'),
            };
          }),
      ),
    });
  }

  async dump(options: { selectedOptionalGroupNames: string[]; selectedUserCollections: string[] }) {
    const { requiredGroups, optionalGroups } = await this.dumpableCollections();
    const { selectedOptionalGroupNames, selectedUserCollections = [] } = options;

    const throughCollections = this.findThroughCollections(selectedUserCollections);

    const selectedOptionalGroups = optionalGroups.filter((group) => {
      return selectedOptionalGroupNames.some((selectedOptionalGroupName) => {
        const [namespace, functionKey] = selectedOptionalGroupName.split('.');
        return group.function === functionKey && group.namespace === namespace;
      });
    });

    const dumpedCollections = lodash.uniq(
      [
        CollectionGroupManager.getGroupsCollections(requiredGroups),
        CollectionGroupManager.getGroupsCollections(selectedOptionalGroups),
        selectedUserCollections,
        throughCollections,
      ].flat(),
    );

    for (const collection of dumpedCollections) {
      await this.dumpCollection({
        name: collection,
      });
    }

    const mapGroupToMetaJson = (groups) =>
      groups.map((group: CollectionGroup) => {
        const data = {
          ...group,
        };

        if (group.delayRestore) {
          data['delayRestore'] = true;
        }

        return data;
      });

    await this.dumpMeta({
      requiredGroups: mapGroupToMetaJson(requiredGroups),
      selectedOptionalGroups: mapGroupToMetaJson(selectedOptionalGroups),
      selectedUserCollections: selectedUserCollections,
    });

    await this.dumpDb();

    const filePath = await this.packDumpedDir();
    await this.clearWorkDir();
    return filePath;
  }

  async dumpDb() {
    const db = this.app.db;
    const dialect = db.sequelize.getDialect();
    const sqlContent = [];
    if (dialect === 'postgres') {
      // get user defined functions in postgres
      const functions = await db.sequelize.query(
        `SELECT n.nspname                 AS function_schema,
                p.proname                 AS function_name,
                pg_get_functiondef(p.oid) AS def
         FROM pg_proc p
                LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
         ORDER BY function_schema,
                  function_name;`,
        {
          type: 'SELECT',
        },
      );

      for (const f of functions) {
        sqlContent.push(f['def']);
      }

      // get user defined triggers in postgres
      const triggers = await db.sequelize.query(
        `select pg_get_triggerdef(oid)
         from pg_trigger`,
        {
          type: 'SELECT',
        },
      );

      for (const t of triggers) {
        sqlContent.push(t['pg_get_triggerdef']);
      }

      // get user defined views in postgres
      const views = await db.sequelize.query(
        `SELECT n.nspname    AS schema_name,
                v.viewname   AS view_name,
                v.definition AS view_definition
         FROM pg_views v
                JOIN
              pg_namespace n ON v.schemaname = n.nspname
         WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
         ORDER BY schema_name,
                  view_name;`,
        {
          type: 'SELECT',
        },
      );

      for (const v of views) {
        sqlContent.push(`CREATE OR REPLACE VIEW ${v['view_name']} AS ${v['view_definition']}`);
      }
    }

    if (sqlContent.length > 0) {
      const dbDumpPath = path.resolve(this.workDir, 'db.sql');
      await fsPromises.writeFile(dbDumpPath, JSON.stringify(sqlContent), 'utf8');
    }
  }

  async dumpMeta(additionalMeta: object = {}) {
    const metaPath = path.resolve(this.workDir, 'meta');

    await fsPromises.writeFile(
      metaPath,
      JSON.stringify({
        version: await this.app.version.get(),
        dialect: this.app.db.sequelize.getDialect(),
        ...additionalMeta,
      }),
      'utf8',
    );
  }

  async dumpCollection(options: { name: string }) {
    const app = this.app;
    const dir = this.workDir;

    const collectionName = options.name;
    app.log.info(`dumping collection ${collectionName}`);

    const collection = app.db.getCollection(collectionName);

    if (!collection) {
      this.app.log.warn(`collection ${collectionName} not found`);
      return;
    }

    // @ts-ignore
    const columns: string[] = [...new Set(lodash.map(collection.model.tableAttributes, 'field'))];

    if (columns.length == 0) {
      this.app.log.warn(`collection ${collectionName} has no columns`);
      return;
    }

    const collectionDataDir = path.resolve(dir, 'collections', collectionName);

    await fsPromises.mkdir(collectionDataDir, { recursive: true });

    // write collection data
    const dataFilePath = path.resolve(collectionDataDir, 'data');
    const dataStream = fs.createWriteStream(dataFilePath);

    const rows = await app.db.sequelize.query(
      sqlAdapter(
        app.db,
        `SELECT *
         FROM ${collection.isParent() ? 'ONLY' : ''} ${collection.quotedTableName()}`,
      ),
      {
        type: 'SELECT',
      },
    );

    for (const row of rows) {
      const rowData = JSON.stringify(
        columns.map((col) => {
          const val = row[col];
          const field = collection.getField(col);

          return field ? FieldValueWriter.toDumpedValue(field, val) : val;
        }),
      );

      dataStream.write(rowData + '\r\n', 'utf8');
    }

    dataStream.end();
    await finished(dataStream);

    const meta = {
      name: collectionName,
      tableName: collection.model.tableName,
      count: rows.length,
      columns,
    };

    // write meta file
    await fsPromises.writeFile(path.resolve(collectionDataDir, 'meta'), JSON.stringify(meta), 'utf8');
  }

  async packDumpedDir() {
    const dirname = path.resolve(process.cwd(), 'storage', 'duplicator');
    mkdirp.sync(dirname);
    const filePath = path.resolve(dirname, `dump-${dayjs().format('YYYYMMDDTHHmmss')}.${DUMPED_EXTENSION}`);

    const output = fs.createWriteStream(filePath);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', function () {
      console.log('dumped file size: ' + humanFileSize(archive.pointer(), true));
    });

    output.on('end', function () {
      console.log('Data has been drained');
    });

    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    archive.on('error', function (err) {
      throw err;
    });

    archive.pipe(output);

    archive.directory(this.workDir, false);

    await archive.finalize();
    console.log('dumped to', filePath);
    return {
      filePath,
      dirname,
    };
  }
}
