import api from './app';
import { middlewares } from '@nocobase/server';

(async () => {
  api.resourcer.use(middlewares.actionParams());

  await api.loadPlugins();

  if (process.env.NOCOBASE_ENV === 'demo') {
    api.resourcer.use(middlewares.demoBlacklistedActions({
      emails: [process.env.ADMIN_EMAIL],
    }));
  }

  api.use(middlewares.appDistServe({
    root: process.env.APP_DIST,
    useStaticServer: !(process.env.APP_USE_STATIC_SERVER === 'false' || !process.env.APP_USE_STATIC_SERVER),
  }));

  await api.database.getModel('collections').load({ skipExisting: true });

  api.listen(process.env.API_PORT, () => {
    console.log(`http://localhost:${process.env.API_PORT}/`);
  });
})();
