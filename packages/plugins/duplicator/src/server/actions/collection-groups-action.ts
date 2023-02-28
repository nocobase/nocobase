import { Dumper } from '../dumper';

export default async function collectionGroupAction(ctx, next) {
  ctx.withoutDataWrapping = true;

  const dumper = new Dumper(ctx.app);

  ctx.body = await dumper.dumpableCollections();

  await next();
}
