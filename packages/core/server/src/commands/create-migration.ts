import dayjs from 'dayjs';
import fs from 'fs';
import { dirname, resolve } from 'path';
import Application from '../application';

export default (app: Application) => {
  app
    .command('create-migration')
    .argument('<name>')
    .option('--pkg <pkg>')
    .option('--on [on]')
    .action(async (name, options) => {
      const pkg = options.pkg;
      const dir = await fs.promises.realpath(resolve(process.env.NODE_MODULES_PATH, pkg));
      const filename = resolve(
        dir,
        pkg === '@nocobase/server' ? 'src' : 'src/server',
        'migrations',
        `${dayjs().format('YYYYMMDDHHmmss')}-${name}.ts`,
      );
      const version = app.getVersion();
      const keys: any[] = version.split('.');
      keys.push(1 * keys.pop() + 1);
      const nextVersion = keys.join('.');
      const from = pkg === '@nocobase/server' ? `../migration` : '@nocobase/server';
      const data = `import { Migration } from '${from}';

export default class extends Migration {
  on = '${options.on || 'afterLoad'}'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<${nextVersion}';

  async up() {
    // coding
  }
}
`;
      await fs.promises.mkdir(dirname(filename), { recursive: true });
      await fs.promises.writeFile(filename, data, 'utf8');
      app.log.info(`migration file in ${filename}`);
    });
};
