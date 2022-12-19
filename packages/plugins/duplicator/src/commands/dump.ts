import { Application } from '@nocobase/server';
import * as os from 'os';
import * as stream from 'stream';
import * as fs from 'fs';
import * as util from 'util';
import fsPromises from 'fs/promises';
import * as process from 'process';
import path from 'path';
import archiver from 'archiver';
import { DUMPED_EXTENSION } from '../utils';

const finished = util.promisify(stream.finished);

export default function addDumpCommand(app: Application) {
  app.command('dump').action(async () => {
    await dumpAction(app);
  });
}

interface DumpContext {
  app: Application;
  dir: string;
}

async function dumpAction(app) {
  const dumpedDir = path.resolve(os.tmpdir(), `nocobase-dump-${Date.now()}`);

  const ctx: DumpContext = {
    dir: dumpedDir,
    app: app,
  };

  const uiCollections = ['uiSchemas', 'uiSchemaTreePath', 'uiSchemaTemplates', 'uiSchemaServerHooks', 'uiRoutes'];

  for (const collection of uiCollections) {
    await dumpCollection(ctx, {
      collectionName: collection,
    });
  }

  await packDumpedDir(ctx);
  await clearDump(ctx);

  await app.stop();
}

export async function dumpCollection(ctx: DumpContext, options: { collectionName: string }) {
  const { collectionName } = options;

  const collection = ctx.app.db.getCollection(collectionName);
  const rows = await collection.repository.find({
    raw: true,
  });
  const collectionDataDir = path.resolve(ctx.dir, 'collections', collectionName);

  await fsPromises.mkdir(collectionDataDir, { recursive: true });

  // write collection data
  const dataFilePath = path.resolve(collectionDataDir, 'data');

  const dataStream = fs.createWriteStream(dataFilePath);

  const columns = Object.keys(collection.model.rawAttributes);

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
    count: rows.length,
    columns,
  };

  // write meta file
  await fsPromises.writeFile(path.resolve(collectionDataDir, 'meta'), JSON.stringify(meta), 'utf8');
}

async function packDumpedDir(ctx: DumpContext) {
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

  archive.directory(ctx.dir, false);

  await archive.finalize();
  console.log('dumped to', filePath);
}

async function clearDump(ctx: DumpContext) {
  await fsPromises.rm(ctx.dir, { recursive: true });
}
