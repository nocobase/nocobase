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
  await api.start(process.env.API_PORT);
  console.log(api.database.getTables().map(t => t.getName()));
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
  console.log(`http://localhost:${process.env.API_PORT}/`);
})();
