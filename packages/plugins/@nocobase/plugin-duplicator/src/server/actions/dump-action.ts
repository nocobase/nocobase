import { Dumper } from '../dumper';
import send from 'koa-send';
import { getApp } from './get-app';
import { DumpDataType } from '@nocobase/database';
import contentDisposition from 'content-disposition';

export default async function dumpAction(ctx, next) {
  const data = <
    {
      dataTypes: string[];
      app?: string;
    }
  >ctx.request.body;

  const app = await getApp(ctx, data.app);

  const dumper = new Dumper(app);

  const { filePath, dirname } = await dumper.dump({
    dataTypes: new Set(data.dataTypes) as Set<DumpDataType>,
  });

  ctx.set('Content-Disposition', contentDisposition(filePath));

  await send(ctx, filePath.replace(dirname, ''), {
    root: dirname,
  });

  await next();
}
