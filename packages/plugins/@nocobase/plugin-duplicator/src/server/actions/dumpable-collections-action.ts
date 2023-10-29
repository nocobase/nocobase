import { Dumper } from '../dumper';
import { getApp } from './get-app';
import objectPath from 'object-path';

export default async function dumpableCollections(ctx, next) {
  ctx.withoutDataWrapping = true;

  const app = await getApp(ctx, ctx.request.query.app);
  const dumper = new Dumper(app);

  const dumpableCollections = dumper.dumpableCollections();

  const results = {};

  for (const collection of dumpableCollections) {
    let namespace = collection.options.namespace || 'core';
    if (namespace.includes('.')) {
      namespace = namespace.split('.')[0];
    }

    const dataType = collection.dataType;

    const collectionInfo = {
      name: collection.name,
    };

    objectPath.set(results, `${dataType}.${namespace}`, [
      ...(objectPath.get(results, `${dataType}.${namespace}`) || []),
      collectionInfo,
    ]);
  }

  ctx.body = results;
  await next();
}
