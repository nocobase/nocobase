import { CollectionGroupManager as DBCollectionGroupManager, DumpDataType } from '@nocobase/database';
import archiver from 'archiver';
import dayjs from 'dayjs';
import fs from 'fs';
import fsPromises from 'fs/promises';
import lodash from 'lodash';
import _ from 'lodash';
import mkdirp from 'mkdirp';
import path from 'path';
import stream from 'stream';
import util from 'util';
import { AppMigrator } from './app-migrator';
import { FieldValueWriter } from './field-value-writer';
import { DUMPED_EXTENSION, humanFileSize, sqlAdapter } from './utils';

const finished = util.promisify(stream.finished);

type DumpOptions = {
  dataTypes: Set<DumpDataType>;
  fileName?: string;
};

type BackUpStatusOk = {
  name: string;
  createdAt: Date;
  fileSize: string;
  status: 'ok';
};

type BackUpStatusDoing = {
  name: string;
  inProgress: true;
  status: 'in_progress';
};

export class Dumper extends AppMigrator {
  static dumpTasks: Map<string, Promise<any>> = new Map();

  direction = 'dump' as const;

  static getTaskPromise(taskId: string): Promise<any> | undefined {
    return this.dumpTasks.get(taskId);
  }

  static async getFileStatus(filePath: string): Promise<BackUpStatusOk | BackUpStatusDoing> {
    const lockFile = filePath + '.lock';
    const fileName = path.basename(filePath);

    return fs.promises
      .stat(filePath)
      .then((backupFileStat) => {
        if (backupFileStat.isFile()) {
          return {
            name: fileName,
            createdAt: backupFileStat.birthtime,
            fileSize: humanFileSize(backupFileStat.size),
            status: 'ok',
          } as BackUpStatusOk;
        } else {
          throw new Error('Path is not a file');
        }
      })
      .catch((error) => {
        if (error.code === 'ENOENT') {
          return fs.promises.stat(lockFile).then((lockFileStat) => {
            if (lockFileStat.isFile()) {
              return {
                name: fileName,
                inProgress: true,
                status: 'in_progress',
              } as BackUpStatusDoing;
            }

            throw new Error('Lock file is not a file');
          });
        }

        throw error;
      });
  }

  static generateFileName() {
    return `backup_${dayjs().format(`YYYYMMDD_HHmmss_${Math.floor(1000 + Math.random() * 9000)}`)}.${DUMPED_EXTENSION}`;
  }

  async getCollectionsByDataTypes(dataTypes: Set<DumpDataType>): Promise<string[]> {
    const dumpableCollectionsGroupByDataTypes = await this.collectionsGroupByDataTypes();

    return [...dataTypes].reduce((acc, key) => {
      return acc.concat(dumpableCollectionsGroupByDataTypes[key] || []);
    }, []);
  }

  async dumpableCollections() {
    return (
      await Promise.all(
        [...this.app.db.collections.values()].map(async (c) => {
          try {
            const options = DBCollectionGroupManager.unifyDuplicatorOption(c.options.duplicator);
            let origin = c.origin;
            let originTitle = origin;

            // plugin collections
            if (origin.startsWith('plugin:')) {
              const plugin = this.app.pm.get(origin.replace(/^plugin:/, ''));
              const pluginInfo = await plugin.toJSON();
              originTitle = pluginInfo.displayName;
              origin = pluginInfo.packageName;
            }

            // user collections
            if (origin === 'collection-manager') {
              originTitle = 'user';
              origin = 'user';
            }

            return {
              name: c.name,
              title: c.options.title || c.name,
              options: c.options,
              dataType: options?.dataType,
              origin: {
                name: origin,
                title: originTitle,
              },
            };
          } catch (e) {
            console.error(e);
            throw new Error(`collection ${c.name} has invalid duplicator option`, { cause: e });
          }
        }),
      )
    ).filter(({ dataType }) => {
      return !!dataType;
    });
  }

  async collectionsGroupByDataTypes() {
    const grouped = lodash.groupBy(await this.dumpableCollections(), 'dataType');

    return Object.fromEntries(Object.entries(grouped).map(([key, value]) => [key, value.map((item) => item.name)]));
  }

  backUpStorageDir() {
    return path.resolve(process.cwd(), 'storage', 'duplicator');
  }

  async allBackUpFilePaths(options?: { includeInProgress?: boolean }) {
    const dirname = this.backUpStorageDir();
    const includeInProgress = options?.includeInProgress;

    try {
      const files = await fsPromises.readdir(dirname);

      const filesData = await Promise.all(
        files
          .filter((file) => {
            const extension = path.extname(file);

            if (includeInProgress) {
              return extension === `.${DUMPED_EXTENSION}` || extension === '.lock';
            }

            return extension === `.${DUMPED_EXTENSION}`;
          })
          .map(async (file) => {
            const filePath = path.resolve(dirname, file);
            const stats = await fsPromises.stat(filePath);
            return { filePath, birthtime: stats.birthtime.getTime() };
          }),
      );

      // 按创建时间逆序排序
      filesData.sort((a, b) => b.birthtime - a.birthtime);

      // 返回排序后的文件路径数组
      return filesData.map((fileData) => fileData.filePath);
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  backUpFilePath(fileName: string) {
    const dirname = this.backUpStorageDir();
    return path.resolve(dirname, fileName);
  }

  lockFilePath(fileName: string) {
    const lockFile = fileName + '.lock';
    const dirname = this.backUpStorageDir();
    return path.resolve(dirname, lockFile);
  }

  async writeLockFile(fileName: string) {
    const dirname = this.backUpStorageDir();
    await mkdirp(dirname);

    const filePath = this.lockFilePath(fileName);
    await fsPromises.writeFile(filePath, 'lock', 'utf8');
  }

  async cleanLockFile(fileName: string) {
    const filePath = this.lockFilePath(fileName);
    await fsPromises.unlink(filePath);
  }

  async runDumpTask(options: Omit<DumpOptions, 'fileName'>) {
    const backupFileName = Dumper.generateFileName();
    await this.writeLockFile(backupFileName);

    const promise = this.dump({
      dataTypes: options.dataTypes,
      fileName: backupFileName,
    }).finally(() => {
      this.cleanLockFile(backupFileName);
      Dumper.dumpTasks.delete(backupFileName);
    });

    Dumper.dumpTasks.set(backupFileName, promise);

    return backupFileName;
  }

  async dumpableCollectionsGroupByDataTypes() {
    const dumpableCollections = (await this.dumpableCollections()).map((c) => {
      return {
        name: c.name,
        dataType: c.dataType,
        origin: c.origin,
        title: c.title,
      };
    });

    return _(dumpableCollections)
      .groupBy('dataType')
      .mapValues((items) => _.sortBy(items, (item) => item.origin.name))
      .value();
  }

  async dump(options: DumpOptions) {
    const dumpDataTypes = options.dataTypes;
    dumpDataTypes.add('meta');

    const dumpedCollections = await this.getCollectionsByDataTypes(dumpDataTypes);

    for (const collection of dumpedCollections) {
      await this.dumpCollection({
        name: collection,
      });
    }

    await this.dumpMeta({
      dumpableCollectionsGroupByDataTypes: lodash.pick(await this.dumpableCollectionsGroupByDataTypes(), [
        ...dumpDataTypes,
      ]),
      dataTypes: [...dumpDataTypes],
    });

    await this.dumpDb();

    const backupFileName = options.fileName || Dumper.generateFileName();
    const filePath = await this.packDumpedDir(backupFileName);
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

    const collectionDataDir = path.resolve(dir, 'collections', collectionName);

    await fsPromises.mkdir(collectionDataDir, { recursive: true });

    let count = 0;

    if (columns.length !== 0) {
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

      count = rows.length;
    }

    const meta = {
      name: collectionName,
      tableName: collection.model.tableName,
      count,
      columns,
    };

    // write meta file
    await fsPromises.writeFile(path.resolve(collectionDataDir, 'meta'), JSON.stringify(meta), 'utf8');
  }

  async packDumpedDir(fileName: string) {
    const dirname = path.resolve(process.cwd(), 'storage', 'duplicator');
    await mkdirp(dirname);

    const filePath = path.resolve(dirname, fileName);
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
