import { extend } from '@nocobase/database';

export default extend({
  name: 'collections',
  fields: [
    {
      interface: 'linkTo',
      title: '权限',
      type: 'belongsToMany',
      name: 'roles',
      through: 'permissions',
      sourceKey: 'name'
    },
    // {
    //   type: 'hasMany',
    //   name: 'permissions',
    //   sourceKey: 'name',
    //   foreignKey: 'collection_name'
    // }
  ],
});
