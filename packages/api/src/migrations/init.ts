// @ts-ignore
global.sync = {
  force: true,
  alter: {
    drop: true,
  },
};

import Database from '@nocobase/database';
import api from '../app';
import * as uiSchema from './ui-schema';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await database.sync({
    // tables: ['collections', 'fields', 'actions', 'views', 'tabs'],
  });

  const config = require('@nocobase/plugin-users/src/collections/users').default;
  const Collection = database.getModel('collections');
  const collection = await Collection.create(config);
  await collection.updateAssociations({
    generalFields: config.fields.filter(field => field.state !== 0),
    systemFields: config.fields.filter(field => field.state === 0),
  });
  await collection.migrate();

  const Route = database.getModel('routes');

  const data = [
    {
      type: 'redirect',
      from: '/',
      to: '/admin',
      exact: true,
    },
    {
      type: 'route',
      path: '/admin/:name(.+)?',
      component: 'AdminLayout',
      title: `后台`,
      uiSchema: uiSchema.menu,
    },
    {
      type: 'route',
      component: 'AuthLayout',
      children: [
        {
          type: 'route',
          path: '/login',
          component: 'RouteSchemaRenderer',
          title: `登录`,
          uiSchema: uiSchema.login,
        },
        {
          type: 'route',
          path: '/register',
          component: 'RouteSchemaRenderer',
          title: `注册`,
          uiSchema: uiSchema.register,
        },
      ],
    },
  ];

  for (const item of data) {
    const route = await Route.create(item);
    await route.updateAssociations(item);
  }

  const Storage = database.getModel('storages');
  await Storage.create({
    title: '本地存储',
    name: `local`,
    type: 'local',
    baseUrl: process.env.LOCAL_STORAGE_BASE_URL,
    default: process.env.STORAGE_TYPE === 'local',
  });
  await Storage.create({
    name: `ali-oss`,
    type: 'ali-oss',
    baseUrl: process.env.ALI_OSS_STORAGE_BASE_URL,
    options: {
      region: process.env.ALI_OSS_REGION,
      accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALI_OSS_BUCKET,
    },
    default: process.env.STORAGE_TYPE === 'ali-oss',
  });

  // 导入地域数据
  const ChinaRegion = database.getModel('china_regions');
  ChinaRegion && await ChinaRegion.importData();

  await database.close();
})();
