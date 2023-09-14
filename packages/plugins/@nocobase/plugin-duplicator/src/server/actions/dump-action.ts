import { Dumper } from '../dumper';
import send from 'koa-send';
import { getApp } from './get-app';

export default async function dumpAction(ctx, next) {
  const data = <
    {
      selectedOptionalGroupNames: string[];
      selectedUserCollections: string[];
      app?: string;
    }
  >ctx.request.body;

  const app = await getApp(ctx, data.app);

  const dumper = new Dumper(app);

  const { filePath, dirname } = await dumper.dump(data);

  await send(ctx, filePath.replace(dirname, ''), {
    root: dirname,
  });

  await next();
}
