import { Application } from '@nocobase/server';
import { Dumper } from '../dumper';

export default function addDumpCommand(app: Application) {
  app.command('dump').action(async () => {
    await dumpAction(app);
  });
}

async function dumpAction(app) {
  const dumper = new Dumper(app);
  await dumper.dump();

  await app.stop();
}
