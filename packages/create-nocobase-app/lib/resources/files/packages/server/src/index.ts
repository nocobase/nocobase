import * as path from 'path';
import { readConfig, Application } from '@nocobase/server';

(async () => {
  const listenPort = process.env.SERVER_PORT as any;
  const listenHost = process.env.HOST;

  const config = await readConfig(path.join(__dirname, './config'));

  const app = new Application(config);

  await app.load();

  await app.start({
    listen: {
      port: listenPort,
      host: listenHost,
    },
  });

  console.log(`🚀 nocobase server had started at port http://${listenHost}:${listenPort}`);
})();
