import api from './app';
import { middlewares } from '@nocobase/server';

(async () => {
  api.resourcer.use(middlewares.actionParams());

  api.on('plugins.afterLoad', async () => {
    console.log('plugins.afterLoad')
    if (process.env.NOCOBASE_ENV === 'demo') {
      api.resourcer.use(middlewares.demoBlacklistedActions({
        emails: [process.env.ADMIN_EMAIL],
      }));
    }
    api.use(middlewares.appDistServe({
      root: process.env.APP_DIST,
      useStaticServer: !(process.env.APP_USE_STATIC_SERVER === 'false' || !process.env.APP_USE_STATIC_SERVER),
    }));
  });

  const start = Date.now();

  if (process.argv.length < 3) {
    process.argv.push('start', '--port', process.env.API_PORT);
  }

  await api.start(process.argv);
  console.log(api.db.getTables().map(t => t.getName()));
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
  console.log(`http://localhost:${process.env.API_PORT}/`);
})();
