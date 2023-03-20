import send from 'koa-send';
import { Dumper } from '../dumper';
import { getApp } from './get-app';

export default async function dumpAction(ctx, next) {
  const data = <
    {
      groups: string[];
      collections: string[];
      app?: string;
    }
  >ctx.request.body;

  const app = await getApp(ctx, data.app);

  const dumper = new Dumper(app);

  const { filePath, dirname } = await dumper.dump({
    selectedOptionalGroupNames: data.groups,
    selectedUserCollections: data.collections,
  });

  ctx.attachment(filePath);

  await send(ctx, filePath.replace(dirname, ''), {
    root: dirname,
  });

  await next();
}
