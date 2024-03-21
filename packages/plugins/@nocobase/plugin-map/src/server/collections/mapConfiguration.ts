import { defineCollection } from '@nocobase/database';
import { MapConfigurationCollectionName } from '../constants';

export default defineCollection({
  dumpRules: {
    group: 'third-party',
  },
  name: MapConfigurationCollectionName,
  shared: true,
  fields: [
    {
      title: 'Access key',
      comment: '访问密钥',
      name: 'accessKey',
      type: 'string',
    },
    {
      title: 'securityJsCode',
      comment: 'securityJsCode or serviceHOST',
      name: 'securityJsCode',
      type: 'string',
    },
    {
      title: 'Map type',
      comment: '地图类型',
      name: 'type',
      type: 'string',
    },
  ],
});
