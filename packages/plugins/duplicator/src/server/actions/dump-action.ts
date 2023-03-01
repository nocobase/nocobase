import { Dumper } from '../dumper';
import send from 'koa-send';

export default async function dumpAction(ctx, next) {
  const app = ctx.app;
  const dumper = new Dumper(app);
  const { requiredGroups } = await dumper.dumpableCollections();

  const { filePath, dirname } = await dumper.dump({
    requiredGroups,
    selectedOptionalGroups: ctx.request.body.selectedOptionalGroups,
    selectedUserCollections: ctx.request.body.selectedUserCollections,
  });

  await send(ctx, filePath.replace(dirname, ''), {
    root: dirname,
  });

  await next();
}
