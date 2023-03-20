import { Application } from '@nocobase/server';
import { Dumper } from '../dumper';
import { getApp } from './get-app';

export default async function dumpableCollections(ctx, next) {
  ctx.withoutDataWrapping = true;

  const app = (await getApp(ctx, ctx.request.query.app)) as Application;
  const dumper = new Dumper(app);

  const dumpableCollections = await dumper.dumpableCollections();

  for (const groupCategory of ['requiredGroups', 'optionalGroups']) {
    const groups = dumpableCollections[groupCategory];
    for (const group of groups) {
      group.collections = group.collections.map((collectionName) => {
        const collection = app.db.getCollection(collectionName);
        return {
          name: collectionName,
          title: collection.options.title || collectionName,
        };
      });
    }
  }

  ctx.body = dumpableCollections;

  await next();
}
