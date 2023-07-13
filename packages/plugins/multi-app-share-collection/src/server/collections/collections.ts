import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'collections',
  fields: [
    {
      type: 'belongsToMany',
      name: 'collectionBlacklist',
      through: 'appCollectionBlacklist',
      target: 'applications',
      targetKey: 'name',
      otherKey: 'applicationName',
      sourceKey: 'name',
      foreignKey: 'collectionName',
    },
  ],
});
