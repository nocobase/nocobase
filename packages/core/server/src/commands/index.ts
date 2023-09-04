import Application from '../application';
import console from './console';
import dbAuth from './db-auth';
import dbClean from './db-clean';
import dbSync from './db-sync';
import destroy from './destroy';
import install from './install';
import migrator from './migrator';
import pm from './pm';
import restart from './restart';
import start from './start';
import stop from './stop';
import upgrade from './upgrade';

export function registerCli(app: Application) {
  console(app);
  dbAuth(app);
  dbClean(app);
  dbSync(app);
  install(app);
  migrator(app);
  start(app);
  upgrade(app);
  pm(app);
  restart(app);
  stop(app);
  destroy(app);

  // development only with @nocobase/cli
  app.command('build').argument('[packages...]');
  app.command('clean');
  app.command('dev').usage('[options]').option('-p, --port [port]').option('--client').option('--server');
  app.command('doc').argument('[cmd]', '', 'dev');
  app.command('test').option('-c, --db-clean');
  app.command('umi');
}
