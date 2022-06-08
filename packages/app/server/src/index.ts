import { Application } from '@nocobase/server';
import config from './config';

const app = new Application(config);

if (require.main === module) {
  app.parse();
}

export default app;
