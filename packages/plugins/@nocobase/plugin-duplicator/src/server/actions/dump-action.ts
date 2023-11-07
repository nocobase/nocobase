import { Dumper } from '../dumper';
import { getApp } from './get-app';
import { DumpDataType } from '@nocobase/database';

export default async function dumpAction(ctx, next) {
  const data = <
    {
      dataTypes: string[];
      app?: string;
    }
  >ctx.request.body;

  const app = await getApp(ctx, data.app);

  const dumper = new Dumper(app);

  const taskId = await dumper.runDumpTask({
    dataTypes: new Set(data.dataTypes) as Set<DumpDataType>,
  });

  ctx.body = {
    key: taskId,
  };

  await next();
}
