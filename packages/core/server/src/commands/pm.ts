import axios from 'axios';
import Application from '../application';

export default (app: Application) => {
  app
    .command('pm')
    .argument('<method>')
    .arguments('<plugins...>')
    .action(async (method, plugins, ...args) => {
      const { APP_PORT, API_BASE_PATH = '/api/', API_BASE_URL } = process.env;
      const baseURL = API_BASE_URL || `http://localhost:${APP_PORT}${API_BASE_PATH}`;
      let started = true;
      try {
        const res = await axios.get(`${baseURL}app:getLang`);
      } catch (error) {
        started = false;
      }
      const pm = {
        async add() {
          if (started) {
            const res = await axios.get(`${baseURL}pm:add/${plugins.join(',')}`);
            console.log(res.data);
            return;
          }
          await app.pm.add(plugins);
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
