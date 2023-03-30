import { Restorer } from '../restorer';
import * as os from 'os';
import path from 'path';
import { getApp } from './get-app';

export async function restoreAction(ctx, next) {
  const { restoreKey, selectedOptionalGroups, selectedUserCollections } = ctx.request.body;
  const appName = ctx.request.body.app;

  const tmpDir = os.tmpdir();
  const filePath = path.resolve(tmpDir, restoreKey);

  const app = await getApp(ctx, appName);

  const restorer = new Restorer(app, {
    backUpFilePath: filePath,
  });

  await restorer.restore({
    selectedOptionalGroupNames: selectedOptionalGroups,
    selectedUserCollections,
  });

  await next();
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
