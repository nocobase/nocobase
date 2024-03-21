import Application from '../application';
import createMigration from './create-migration';
import dbAuth from './db-auth';
import dbClean from './db-clean';
import dbSync from './db-sync';
import destroy from './destroy';
import install from './install';
import pm from './pm';
import refresh from './refresh';
import restart from './restart';
import start from './start';
import stop from './stop';
import upgrade from './upgrade';
import consoleCommand from './console';
export function registerCli(app: Application) {
  consoleCommand(app);
  dbAuth(app);
  createMigration(app);
  dbClean(app);
  dbSync(app);
  install(app);
  // migrator(app);
  upgrade(app);
  pm(app);
  restart(app);
  stop(app);
  destroy(app);
  start(app);
  refresh(app);

  // development only with @nocobase/cli
  app.command('build').argument('[packages...]');
  app.command('clean');
  app.command('dev').usage('[options]').option('-p, --port [port]').option('--client').option('--server');
  app.command('doc').argument('[cmd]', '', 'dev');
  app.command('test').option('-c, --db-clean');
  app.command('umi');
}
