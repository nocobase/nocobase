import * as path from 'path';
import { readConfig, Application } from '@nocobase/server';

(async () => {
  const config = await readConfig(path.join(__dirname, './config'));
  const app = new Application(config);
  await app.parse();
})();
