import { Collection, CollectionGroupManager as DBCollectionGroupManager, DumpRulesGroupType } from '@nocobase/database';
import archiver from 'archiver';
import dayjs from 'dayjs';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { default as _, default as lodash } from 'lodash';
import mkdirp from 'mkdirp';
import path from 'path';
import * as process from 'process';
import stream from 'stream';
import util from 'util';
import { AppMigrator } from './app-migrator';
import { FieldValueWriter } from './field-value-writer';
import { DUMPED_EXTENSION, humanFileSize, sqlAdapter } from './utils';

const finished = util.promisify(stream.finished);

type DumpOptions = {
  groups: Set<DumpRulesGroupType>;
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

  sqlContent: {
    [key: string]: {
      sql: string | string[];
      group: DumpRulesGroupType;
    };
  } = {};

  static getTaskPromise(taskId: string): Promise<any> | undefined {
    return this.dumpTasks.get(taskId);
  }

  static async getFileStatus(filePath: string): Promise<BackUpStatusOk | BackUpStatusDoing> {
    const lockFile = filePath + '.lock';
    const fileName = path.basename(filePath);

    return fs.promises
      .stat(lockFile)
      .then((lockFileStat) => {
        if (lockFileStat.isFile()) {
          return {
            name: fileName,
            inProgress: true,
            status: 'in_progress',
          } as BackUpStatusDoing;
        } else {
          throw new Error('Lock file is not a file');
        }
      })
      .catch((error) => {
        // 如果 Lock 文件不存在，检查备份文件
        if (error.code === 'ENOENT') {
          return fs.promises.stat(filePath).then((backupFileStat) => {
            if (backupFileStat.isFile()) {
              return {
                name: fileName,
                createdAt: backupFileStat.ctime,
                fileSize: humanFileSize(backupFileStat.size),
                status: 'ok',
              } as BackUpStatusOk;
            } else {
              throw new Error('Path is not a file');
            }
          });
        }
        // 其他错误直接抛出
        throw error;
      });
  }

  static generateFileName() {
    return `backup_${dayjs().format(`YYYYMMDD_HHmmss_${Math.floor(1000 + Math.random() * 9000)}`)}.${DUMPED_EXTENSION}`;
  }

  writeSQLContent(
    key: string,
    data: {
      sql: string | string[];
      group: DumpRulesGroupType;
    },
  ) {
    this.sqlContent[key] = data;
  }

  getSQLContent(key: string) {
    return this.sqlContent[key];
  }

  async getCollectionsByDataTypes(groups: Set<DumpRulesGroupType>): Promise<string[]> {
    const dumpableCollectionsGroupByDataTypes = await this.collectionsGroupByDataTypes();

    return [...groups].reduce((acc, key) => {
      return acc.concat(dumpableCollectionsGroupByDataTypes[key] || []);
    }, []);
  }

  async dumpableCollections() {
    return (
      await Promise.all(
        [...this.app.db.collections.values()].map(async (c) => {
          try {
            const dumpRules = DBCollectionGroupManager.unifyDumpRules(c.options.dumpRules);

            const options: any = {
              name: c.name,
              title: c.options.title || c.name,
              options: c.options,
              group: dumpRules?.group,
              isView: c.isView(),
              origin: c.origin,
            };

            if (c.options.inherits && c.options.inherits.length > 0) {
              options.inherits = c.options.inherits;
            }

            return options;
          } catch (e) {
            console.error(e);
            throw new Error(`collection ${c.name} has invalid dumpRules option`, { cause: e });
          }
        }),
      )
    ).map((item) => {
      if (!item.group) {
        item.group = 'unknown';
      }

      return item;
    });
  }

  async collectionsGroupByDataTypes() {
    const grouped = lodash.groupBy(await this.dumpableCollections(), 'group');

    return Object.fromEntries(Object.entries(grouped).map(([key, value]) => [key, value.map((item) => item.name)]));
  }

  backUpStorageDir() {
    return path.resolve(process.cwd(), 'storage', 'backups');
  }

  async allBackUpFilePaths(options?: { includeInProgress?: boolean; dir?: string }) {
    const dirname = options?.dir || this.backUpStorageDir();
    const includeInProgress = options?.includeInProgress;

    try {
      const files = await fsPromises.readdir(dirname);

      const lockFilesSet = new Set(
        files.filter((file) => path.extname(file) === '.lock').map((file) => path.basename(file, '.lock')),
      );

      const filteredFiles = files
        .filter((file) => {
          const baseName = path.basename(file);
          const isLockFile = path.extname(file) === '.lock';
          const isDumpFile = path.extname(file) === `.${DUMPED_EXTENSION}`;

          return (includeInProgress && isLockFile) || (isDumpFile && !lockFilesSet.has(baseName));
        })
        .map(async (file) => {
          const filePath = path.resolve(dirname, file);
          const stats = await fsPromises.stat(filePath);
          return { filePath, birthtime: stats.birthtime.getTime() };
        });

      const filesData = await Promise.all(filteredFiles);

      filesData.sort((a, b) => b.birthtime - a.birthtime);

      return filesData.map((fileData) => fileData.filePath);
    } catch (error) {
      if (!error.message.includes('no such file or directory')) {
        console.error('Error reading directory:', error);
      }
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
      groups: options.groups,
      fileName: backupFileName,
    }).finally(() => {
      this.cleanLockFile(backupFileName);
      Dumper.dumpTasks.delete(backupFileName);
    });

    Dumper.dumpTasks.set(backupFileName, promise);

    return backupFileName;
  }

  async dumpableCollectionsGroupByGroup() {
    return _(await this.dumpableCollections())
      .map((c) => _.pick(c, ['name', 'group', 'origin', 'title', 'isView', 'inherits']))
      .groupBy('group')
      .mapValues((items) => _.sortBy(items, (item) => item.name))
      .value();
  }

  async dump(options: DumpOptions) {
    const dumpingGroups = options.groups;
    dumpingGroups.add('required');

    const delayCollections = new Set();
    const dumpedCollections = await this.getCollectionsByDataTypes(dumpingGroups);

    for (const collectionName of dumpedCollections) {
      const collection = this.app.db.getCollection(collectionName);
      if (lodash.get(collection.options, 'dumpRules.delayRestore')) {
        delayCollections.add(collectionName);
      }

      await this.dumpCollection({
        name: collectionName,
      });
    }

    await this.dumpMeta({
      dumpableCollectionsGroupByGroup: lodash.pick(await this.dumpableCollectionsGroupByGroup(), [...dumpingGroups]),
      dumpedGroups: [...dumpingGroups],
      delayCollections: [...delayCollections],
    });

    await this.dumpDb(options);

    const backupFileName = options.fileName || Dumper.generateFileName();
    const filePath = await this.packDumpedDir(backupFileName);
    await this.clearWorkDir();
    return filePath;
  }

  async dumpDb(options: DumpOptions) {
    for (const collection of this.app.db.collections.values()) {
      const collectionOnDumpOption = this.app.db.collectionFactory.collectionTypes.get(
        collection.constructor as typeof Collection,
      )?.onDump;

      if (collectionOnDumpOption) {
        await collectionOnDumpOption(this, collection);
      }
    }

    if (this.hasSqlContent()) {
      const dbDumpPath = path.resolve(this.workDir, 'sql-content.json');

      await fsPromises.writeFile(
        dbDumpPath,
        JSON.stringify(
          Object.keys(this.sqlContent)
            .filter((key) => options.groups.has(this.sqlContent[key].group))
            .reduce((acc, key) => {
              acc[key] = this.sqlContent[key];
              return acc;
            }, {}),
        ),
        'utf8',
      );
    }
  }

  hasSqlContent() {
    return Object.keys(this.sqlContent).length > 0;
  }

  async dumpMeta(additionalMeta: object = {}) {
    const metaPath = path.resolve(this.workDir, 'meta');

    const metaObj = {
      version: await this.app.version.get(),
      dialect: this.app.db.sequelize.getDialect(),
      DB_UNDERSCORED: process.env.DB_UNDERSCORED,
      DB_TABLE_PREFIX: process.env.DB_TABLE_PREFIX,
      DB_SCHEMA: process.env.DB_SCHEMA,
      COLLECTION_MANAGER_SCHEMA: process.env.COLLECTION_MANAGER_SCHEMA,
      ...additionalMeta,
    };

    if (this.app.db.inDialect('postgres')) {
      if (this.app.db.inheritanceMap.nodes.size > 0) {
        metaObj['dialectOnly'] = true;
      }
    }

    if (this.hasSqlContent()) {
      metaObj['dialectOnly'] = true;
    }

    await fsPromises.writeFile(metaPath, JSON.stringify(metaObj), 'utf8');
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

    const collectionOnDumpOption = this.app.db.collectionFactory.collectionTypes.get(
      collection.constructor as typeof Collection,
    )?.onDump;

    if (collectionOnDumpOption) {
      return;
    }

    // @ts-ignore
    const attributes = collection.model.tableAttributes;

    // @ts-ignore
    const columns: string[] = [...new Set(lodash.map(attributes, 'field'))];

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

    const metaAttributes = lodash.mapValues(attributes, (attr, key) => {
      const collectionField = collection.getField(key);
      const fieldOptionKeys = ['field', 'primaryKey', 'autoIncrement', 'allowNull', 'defaultValue', 'unique'];

      if (collectionField) {
        // is a field
        const fieldAttributes: any = {
          field: attr.field,
          isCollectionField: true,
          type: collectionField.type,
          typeOptions: collectionField.options,
        };

        if (fieldAttributes.typeOptions?.defaultValue?.constructor?.name === 'UUIDV4') {
          delete fieldAttributes.typeOptions.defaultValue;
        }

        return fieldAttributes;
      }

      return {
        ...lodash.pick(attr, fieldOptionKeys),
        type: attr.type.constructor.toString(),
        isCollectionField: false,
        typeOptions: attr.type.options,
      };
    });

    const meta = {
      name: collectionName,
      tableName: collection.getTableNameWithSchema(),
      count,
      columns,
      attributes: metaAttributes,
    };

    if (collection.options.inherits) {
      meta['inherits'] = lodash.uniq(collection.options.inherits);
    }

    // @ts-ignore
    const autoIncrAttr = collection.model.autoIncrementAttribute;

    if (
      autoIncrAttr &&
      collection.model.rawAttributes[autoIncrAttr] &&
      collection.model.rawAttributes[autoIncrAttr].autoIncrement
    ) {
      const queryInterface = app.db.queryInterface;
      const autoIncrInfo = await queryInterface.getAutoIncrementInfo({
        tableInfo: {
          tableName: collection.model.tableName,
          schema: collection.collectionSchema(),
        },
        fieldName: autoIncrAttr,
      });

      meta['autoIncrement'] = {
        ...autoIncrInfo,
        fieldName: autoIncrAttr,
      };
    }

    // write meta file
    await fsPromises.writeFile(path.resolve(collectionDataDir, 'meta'), JSON.stringify(meta), 'utf8');
  }

  async packDumpedDir(fileName: string) {
    const dirname = this.backUpStorageDir();
    await mkdirp(dirname);

    const filePath = path.resolve(dirname, fileName);
    const output = fs.createWriteStream(filePath);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Create a promise that resolves when the 'close' event is fired
    const onClose = new Promise((resolve, reject) => {
      output.on('close', function () {
        console.log('dumped file size: ' + humanFileSize(archive.pointer(), true));
        resolve(true);
      });

      output.on('end', function () {
        console.log('Data has been drained');
      });

      archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
          // log warning
        } else {
          // throw error
          reject(err);
        }
      });

      archive.on('error', function (err) {
        reject(err);
      });
    });

    archive.pipe(output);

    archive.directory(this.workDir, false);

    // Finalize the archive
    await archive.finalize();

    // Wait for the 'close' event
    await onClose;

    return {
      filePath,
      dirname,
    };
  }
}
