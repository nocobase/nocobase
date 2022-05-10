import Application from '../application';
import console from './console';
import dbAuth from './db-auth';
import dbSync from './db-sync';
import install from './install';
import start from './start';

export function registerCli(app: Application) {
  console(app);
  dbAuth(app);
  dbSync(app);
  install(app);
  start(app);

  // development only with @nocobase/cli
  app.command('build').description('development only');
  app.command('dev').description('development only');
  app.command('test').description('development only');
  app.command('umi').description('development only');
}
