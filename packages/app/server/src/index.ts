import { Application } from '@nocobase/server';
import config from './config';

const app = new Application(config);

if (require.main === module) {
  app.runAsCLI();
}

export default app;
