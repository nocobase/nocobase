import { Application } from '@nocobase/server';
import config from './config';
import { reportStatus } from './rpc/report-status';

const app = new Application(config);

if (require.main === module) {
  reportStatus(app);
  app.runAsCLI();
}

export default app;
