import path from 'path';
// import actions from '@nocobase/actions';

// 不从主入口导出，考虑到加载的数据量太大比较占内存，只在迁移时处理
// export * as seeders from './db/seeders';

export default async function (options = {}) {
  const { database, resourcer } = this;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  // resourcer.define({
  //   name: 'china_regions.china_regions',
  //   actions: actions.common
  // });
}
