import { defineCollection } from '@nocobase/database';
import { CustomRequestCollectionName } from '../constants';

export default defineCollection({
  namespace: 'custom-request.custom-request',
  duplicator: 'skip',
  name: CustomRequestCollectionName,
  title: '自定义请求',
  autoGenId: false,
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'json',
      name: 'options', // 配置的请求参数都放这里
    },
  ],
});
