import { Dumper } from '../dumper';
import { getApp } from './get-app';

export default async function dumpableCollections(ctx, next) {
  ctx.withoutDataWrapping = true;

  const app = await getApp(ctx, ctx.request.query.app);
  const dumper = new Dumper(app);

  ctx.body = await dumper.dumpableCollections();

  await next();
}
