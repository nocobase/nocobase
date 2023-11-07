import { getApp } from './get-app';
import { Dumper } from '../dumper';
import fs from 'fs';

export async function downloadAction(ctx, next) {
  const { key } = ctx.action.params;
  const { app: appName } = ctx.request.query;

  const app = await getApp(ctx, appName);
  const dumper = new Dumper(app);

  const filePath = dumper.backUpFilePath(key);

  const fileState = await Dumper.getFileStatus(filePath);

  if (fileState.status !== 'ok') {
    throw new Error(`Backup file ${key} not found`);
  }

  ctx.attachment(filePath);
  ctx.body = fs.createReadStream(filePath);
  await next();
}
