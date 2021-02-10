import { init } from '@nocobase/plugin-china-region/src/db/seeders';
import api from '../app';

(async () => {
  await api.loadPlugins();
  await api.database.sync();
  await init(api);
})().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
