import { AppMigrator } from './app-migrator';
import path from 'path';
import fsPromises from 'fs/promises';
import fs from 'fs';
import util from 'util';
import stream from 'stream';
import { DUMPED_EXTENSION, humanFileSize } from './utils';
import archiver from 'archiver';
import dayjs from 'dayjs';
import { CollectionGroupManager } from './collection-group-manager';
import inquirer from 'inquirer';

const finished = util.promisify(stream.finished);

export class Dumper extends AppMigrator {
  async dump() {
    const appPlugins = await this.getAppPlugins();

    // get system available collection groups
    const collectionGroups = CollectionGroupManager.collectionGroups.filter((collectionGroup) =>
      appPlugins.includes(collectionGroup.pluginName),
    );

    const coreCollections = ['applicationPlugins'];

    const customCollections = await this.getCustomCollections();
    const requiredGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'required');
    const optionalGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'optional');

    const pluginsCollections = CollectionGroupManager.getGroupsCollections(
      collectionGroups.map((collectionGroup) => `${collectionGroup.pluginName}.${collectionGroup.function}`),
    );

    const optionalCollections = [...customCollections.filter((collection) => !pluginsCollections.includes(collection))];

    const questions = [
      {
        type: 'checkbox',
        name: 'collectionGroups',
        message: '选择需要导出的插件数据',
        loop: false,
        pageSize: 100,
        choices: [
          new inquirer.Separator('== 必选数据 =='),
          ...requiredGroups.map((collectionGroup) => ({
            name: `${collectionGroup.function} (${collectionGroup.pluginName})`,
            value: `${collectionGroup.pluginName}.${collectionGroup.function}`,
            checked: true,
            disabled: true,
          })),

          new inquirer.Separator('== 可选数据 =='),
          ...optionalGroups.map((collectionGroup) => ({
            name: `${collectionGroup.function} (${collectionGroup.pluginName})`,
            value: `${collectionGroup.pluginName}.${collectionGroup.function}`,
          })),
        ],
      },
    ];

    if (optionalCollections.length > 0) {
      questions.push({
        type: 'checkbox',
        name: 'userCollections',
        message: '选择需要导出的Collection数据',
        loop: false,
        pageSize: 100,
        choices: optionalCollections.map((collection) => ({ name: collection, value: collection })),
      });
    }

    const results = await inquirer.prompt(questions);

    const dumpedCollections = [
      coreCollections,
      CollectionGroupManager.getGroupsCollections(
        requiredGroups.map((collectionGroup) => `${collectionGroup.pluginName}.${collectionGroup.function}`),
      ),
      CollectionGroupManager.getGroupsCollections(results.collectionGroups),
      results.userCollections,
    ].flat();

    for (const collection of dumpedCollections) {
      await this.dumpCollection({
        name: collection,
      });
    }

    await this.dumpMeta();
    await this.packDumpedDir();
    await this.clearWorkDir();
  }

  async dumpMeta() {
    const metaPath = path.resolve(this.workDir, 'meta');

    await fsPromises.writeFile(
      metaPath,
      JSON.stringify({ version: this.app.version.get(), dialect: this.app.db.sequelize.getDialect() }),
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

    const collectionDataDir = path.resolve(dir, 'collections', collectionName);

    await fsPromises.mkdir(collectionDataDir, { recursive: true });

    // write collection data
    const dataFilePath = path.resolve(collectionDataDir, 'data');
    const dataStream = fs.createWriteStream(dataFilePath);
    // @ts-ignore
    const columns = Object.keys(collection.model.tableAttributes);

    // read collection data
    const rows = await collection.repository.find({
      raw: true,
    });

    for (const row of rows) {
      const rowData = JSON.stringify(
        columns.map((col) => {
          return row[col];
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
    const filePath = path.resolve(process.cwd(), `dump-${dayjs().format('YYYYMMDDTHHmmss')}.${DUMPED_EXTENSION}`);

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
  }
}
