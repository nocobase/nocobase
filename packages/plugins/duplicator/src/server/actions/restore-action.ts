import * as os from 'os';
import path from 'path';
import { Restorer } from '../restorer';
import { getApp } from './get-app';
import * as process from 'process';

export async function restoreAction(ctx, next) {
  const { restoreKey, groups = [], collections = [] } = ctx.request.body;
  const appName = ctx.request.body.app;

  const tmpDir = os.tmpdir();
  const filePath = path.resolve(tmpDir, restoreKey);

  const app = await getApp(ctx, appName);

  const restorer = new Restorer(app, {
    backUpFilePath: filePath,
  });

  await restorer.restore({
    selectedOptionalGroupNames: groups,
    selectedUserCollections: collections,
  });

  ctx.body = {
    success: true,
  };

  await next();
  app.log.info('Restore complete, exiting now...');

  process.exit(100);
}

export const getPackageContent = async (ctx, next) => {
  const file = ctx.file;
  const fileName = file.filename;

  const restorer = new Restorer(ctx.app, {
    backUpFilePath: file.path,
  });

  const restoreMeta = await restorer.parseBackupFile();

  ctx.body = {
    key: fileName,
    meta: restoreMeta,
  };

  await next();
};
