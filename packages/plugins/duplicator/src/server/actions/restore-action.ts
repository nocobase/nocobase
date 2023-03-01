import { Restorer } from '../restorer';
import * as os from 'os';
import path from 'path';

export async function restoreAction(ctx, next) {
  const { restoreKey, selectedOptionalGroups, selectedUserCollections } = ctx.request.body;
  const tmpDir = os.tmpdir();
  const filePath = path.resolve(tmpDir, restoreKey);

  const restorer = new Restorer(ctx.app, filePath);

  await restorer.restore({
    selectedOptionalGroupNames: selectedOptionalGroups,
    selectedUserCollections,
  });

  await next();
}

export const getPackageContent = async (ctx, next) => {
  const file = ctx.file;
  const fileName = file.filename;

  const restorer = new Restorer(ctx.app, file.path);
  const restoreMeta = await restorer.parseBackupFile();

  ctx.body = {
    key: fileName,
    meta: restoreMeta,
  };

  await next();
};
