import { DataSource, DataSourceManager } from '@nocobase/flow-engine';

export const dsm = new DataSourceManager();

const ds = new DataSource({
  key: 'main',
  displayName: 'Main',
  description: 'This is the main data source',
});

dsm.addDataSource(ds);

ds.addCollection({
  name: 'roles',
  title: 'Roles',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
    },
    {
      name: 'uid',
      type: 'string',
      title: 'UID',
    },
  ],
});

ds.addCollection({
  name: 'users',
  title: 'Users',
  fields: [
    {
      name: 'username',
      type: 'string',
      title: 'Username',
    },
    {
      name: 'nickname',
      type: 'string',
      title: 'Nickname',
    },
  ],
});
