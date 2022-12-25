import { AppMigrator } from './app-migrator';
import { Application } from '@nocobase/server';
import path from 'path';
import fsPromises from 'fs/promises';
import fs from 'fs';
import util from 'util';
import stream from 'stream';
import { DUMPED_EXTENSION } from './utils';
import archiver from 'archiver';
import lodash from 'lodash';

const finished = util.promisify(stream.finished);

export class Dumper extends AppMigrator {
  dumpCtx: {
    dir: string;
    app: Application;
  };

  constructor(
    app,
    options?: {
      workDir: string;
    },
  ) {
    super(app);

    this.dumpCtx = {
      app,
      dir: lodash.get(options, 'workDir', this.tmpDir()),
    };
  }

  async dump() {
    const fixedPlugins = [
      'collection-manager',
      'ui-schema-storage',
      'ui-routes-storage',
      'acl',
      'workflow',
      'sequence-field',
    ];

    const ignorePlugins = [
      'error-handler',
      'client',
      'export',
      'import',
      'sample-hello',
      'audit-logs',
      'china-region',
      'system-settings',
      'verification',
      'oidc',
      'saml',
      'map',
      'duplicator',
    ];

    const fixedCollections = ['applicationPlugins'];

    const appPlugins = await this.getAppPlugins();
    const excludePlugins = [...fixedPlugins, ...ignorePlugins];
    const usersPlugins = appPlugins.filter((pluginName) => !excludePlugins.includes(pluginName));

    const dumpedCollections = [
      ...fixedCollections,
      ...this.getPluginCollections(fixedPlugins),
      ...this.getPluginCollections(usersPlugins),
      ...(await this.getCustomCollections()),
    ];

    for (const collection of dumpedCollections) {
      await this.dumpCollection({
        name: collection,
      });
    }

    await this.dumpMeta();
    await this.packDumpedDir();
    await this.clearDump();
  }

  async dumpMeta() {
    const metaPath = path.resolve(this.dumpCtx.dir, 'meta');

    await fsPromises.writeFile(
      metaPath,
      JSON.stringify({ version: this.app.version.get(), dialect: this.app.db.sequelize.getDialect() }),
      'utf8',
    );
  }

  async dumpCollection(options: { name: string }) {
    const { app, dir } = this.dumpCtx;
    const collectionName = options.name;
    app.log.info(`dumping collection ${collectionName}`);

    const collection = app.db.getCollection(collectionName);

    const collectionDataDir = path.resolve(dir, 'collections', collectionName);

    await fsPromises.mkdir(collectionDataDir, { recursive: true });

    // write collection data
    const dataFilePath = path.resolve(collectionDataDir, 'data');
    const dataStream = fs.createWriteStream(dataFilePath);
    const columns = Object.keys(collection.model.rawAttributes);

    // read collection data
    const rows = await collection.repository.find({
      raw: true,
    });

    for (const row of rows) {
      dataStream.write(
        JSON.stringify(
          columns.map((col) => {
            return row[col];
          }),
        ) + '\r\n',
        'utf8',
      );
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
    const filePath = path.resolve(
      process.cwd(),
      `dump-${new Date().toISOString().replace(/T/, '-').replace(/\..+/, '')}.${DUMPED_EXTENSION}`,
    );

    const output = fs.createWriteStream(filePath);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
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

    archive.directory(this.dumpCtx.dir, false);

    await archive.finalize();
    console.log('dumped to', filePath);
  }

  async clearDump() {
    await this.rmDir(this.dumpCtx.dir);
  }
}
