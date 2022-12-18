import { Application } from '@nocobase/server';
import decompress from 'decompress';
import * as os from 'os';
import fsPromises from 'fs/promises';

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
  const restoreDir = `${tmpDir}/nocobase-restore-${Date.now()}`;

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
  const collectionsDir = `${ctx.dir}/collections`;
  const collections = await fsPromises.readdir(collectionsDir);

  for (const collectionName of collections) {
    const collectionDataPath = `${collectionsDir}/${collectionName}/data`;
  }
}

async function clearDump(ctx: RestoreContext) {
  await fsPromises.rm(ctx.dir, { recursive: true });
}
