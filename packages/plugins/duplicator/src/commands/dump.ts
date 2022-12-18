import { Application } from '@nocobase/server';
import * as os from 'os';
import * as stream from 'stream';
import * as fs from 'fs';
import * as util from 'util';
import fsPromises from 'fs/promises';
import * as process from 'process';
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
  const dumpedDir = `${os.tmpdir()}/nocobase-dump-${Date.now()}`;

  const ctx: DumpContext = {
    dir: dumpedDir,
    app: app,
  };

  const uiCollections = ['uiSchemas', 'uiSchemaTreePath', 'uiSchemaTemplates', 'uiSchemaServerHooks'];

  for (const collection of uiCollections) {
    await dumpCollection(ctx, {
      collectionName: collection,
    });
  }

  await packDumpedDir(ctx);
  await clearDump(ctx);

  await app.stop();
}

async function dumpCollection(ctx: DumpContext, options: { collectionName: string }) {
  const { collectionName } = options;

  const collection = ctx.app.db.getCollection(collectionName);
  const rows = await collection.repository.find();
  const collectionDataDir = `${ctx.dir}/collections/${collectionName}`;

  await fsPromises.mkdir(collectionDataDir, { recursive: true });

  const dataFilePath = `${collectionDataDir}/data`;

  const dataStream = fs.createWriteStream(dataFilePath);

  for (const row of rows) {
    dataStream.write(JSON.stringify(row) + '\n', 'utf8');
  }

  dataStream.end();
  await finished(dataStream);

  console.log('dumped', collectionName, rows.length);
}

async function packDumpedDir(ctx: DumpContext) {
  const workDir = process.cwd();
  const filePath = `${workDir}/dump.zip`;

  const output = fs.createWriteStream(filePath);

  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
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
  await fsPromises.rename(filePath, `${workDir}/dump-${Date.now()}.${DUMPED_EXTENSION}`);
}

async function clearDump(ctx: DumpContext) {
  await fsPromises.rm(ctx.dir, { recursive: true });
}
