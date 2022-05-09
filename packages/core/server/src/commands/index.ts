import Application from '../application';
import console from './console';
import dbAuth from './db-auth';
import dbSync from './db-sync';
import install from './install';
import start from './start';

export function registerCli(app: Application) {
  app.command('build');
  console(app);
  dbAuth(app);
  dbSync(app);
  app.command('dev');
  install(app);
  start(app);
  app.command('test');
}
