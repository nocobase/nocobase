import { Restorer } from '../restorer';
import * as os from 'os';
import path from 'path';
import { getApp } from './get-app';

export async function restoreAction(ctx, next) {
  const { restoreKey, dataTypes } = ctx.request.body;
  const appName = ctx.request.body.app;

  const tmpDir = os.tmpdir();
  const filePath = path.resolve(tmpDir, restoreKey);

  const app = await getApp(ctx, appName);

  const args = ['restore', '-f', filePath];

  for (const dataType of dataTypes) {
    args.push('-d', dataType);
  }

  await app.runCommand(...args);

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
