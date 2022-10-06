import axios from 'axios';
import { resolve } from 'path';
import Application from '../application';

export default (app: Application) => {
  app
    .command('pm')
    .argument('<method>')
    .arguments('<plugins...>')
    .action(async (method, plugins, options, ...args) => {
      const { APP_PORT, API_BASE_PATH = '/api/', API_BASE_URL } = process.env;
      const baseURL = API_BASE_URL || `http://localhost:${APP_PORT}${API_BASE_PATH}`;
      let started = true;
      try {
        await axios.get(`${baseURL}app:getLang`);
      } catch (error) {
        started = false;
      }
      const pm = {
        async create() {
          const name = plugins[0];
          const { run } = require('@nocobase/cli/src/util');
          const { PluginGenerator } = require('@nocobase/cli/src/plugin-generator');
          const generator = new PluginGenerator({
            cwd: resolve(process.cwd(), name),
            args: options,
            context: {
              name,
            },
          });
          await generator.run();
          await run('yarn', ['install']);
        },
        async add() {
          try {
            if (started) {
              const res = await axios.get(`${baseURL}pm:add/${plugins.join(',')}`);
            } else {
              await app.pm.add(plugins);
            }
          } catch (error) {}
          const fs = require('fs/promises');
          await Promise.all(
            plugins.map((plugin) => {
              const file = resolve(
                process.cwd(),
                'packages',
                process.env.APP_PACKAGE_ROOT || 'app',
                'client/src/plugins',
                `${plugin}.ts`,
              );
              console.log(file);
              return fs.writeFile(file, `export { default } from '@nocobase/plugin-${plugin}/client';`);
            }),
          );
          const { run } = require('@nocobase/cli/src/util');
          await run('yarn', ['nocobase', 'postinstall']);
        },
        async enable() {
          if (started) {
            const res = await axios.get(`${baseURL}pm:enable/${plugins.join(',')}`);
            console.log(res.data);
            return;
          }
          const repository = app.db.getRepository('applicationPlugins');
          await repository.update({
            filter: {
              'name.$in': plugins,
            },
            values: {
              enabled: true,
            },
          });
        },
        async disable() {
          if (started) {
            const res = await axios.get(`${baseURL}pm:disable/${plugins.join(',')}`);
            console.log(res.data);
            return;
          }
          const repository = app.db.getRepository('applicationPlugins');
          await repository.update({
            filter: {
              'name.$in': plugins,
            },
            values: {
              enabled: false,
            },
          });
        },
        async remove() {
          if (started) {
            const res = await axios.get(`${baseURL}pm:disable/${plugins.join(',')}`);
            console.log(res.data);
            return;
          }
          const repository = app.db.getRepository('applicationPlugins');
          await repository.destroy({
            filter: {
              'name.$in': plugins,
            },
          });
          plugins.map((name) => app.pm.remove(name));
        },
      };
      await pm[method]();
    });
};
