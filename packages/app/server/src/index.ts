import { Application } from '@nocobase/server';
import config from './config';

const app = new Application(config);

app.command('test').action(() => {});

if (require.main.filename === __filename) {
  app.parse();
}

export default app;
