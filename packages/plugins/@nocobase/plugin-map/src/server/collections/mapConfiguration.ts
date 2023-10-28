import { MapConfigurationCollectionName } from '../constants';
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'map.mapConfiguration',
  duplicator: {
    dataType: 'config',
  },
  name: MapConfigurationCollectionName,
  title: '{{t("Map Manager")}}',
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
