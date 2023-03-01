import { Dumper } from '../dumper';
import send from 'koa-send';

export default async function dumpAction(ctx, next) {
  const app = ctx.app;
  const dumper = new Dumper(app);

  const data = <
    {
      selectedOptionalGroupNames: string[];
      selectedUserCollections: string[];
    }
  >ctx.request.body;

  const { filePath, dirname } = await dumper.dump(data);

  await send(ctx, filePath.replace(dirname, ''), {
    root: dirname,
  });

  await next();
}
