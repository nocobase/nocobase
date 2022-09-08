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
      const pm = {
        async add() {
          const res = await axios.get(`${baseURL}pm:add/${plugins.join(',')}`);
          console.log(res.data);
        },
        async enable() {
          const res = await axios.get(`${baseURL}pm:enable/${plugins.join(',')}`);
          console.log(res.data);
        },
        async disable() {
          const res = await axios.get(`${baseURL}pm:disable/${plugins.join(',')}`);
          console.log(res.data);
        },
      };
      await pm[method]();
    });
};
