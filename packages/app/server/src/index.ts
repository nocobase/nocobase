import { Application, readConfig } from '@nocobase/server';
import * as path from 'path';

(async () => {
  const config = await readConfig(path.join(__dirname, './config'));
  const app = new Application(config);
  await app.parse();
})();
