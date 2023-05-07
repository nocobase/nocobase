import { defineCollection } from '@nocobase/database';
import { NAMESPACE } from '../constants';

export default defineCollection({
  namespace: 'custom-request.customRequest',
  duplicator: 'required',
  name: NAMESPACE,
  autoGenId: false,
  timestamps: false,
  title: '自定义请求',
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'json',
      name: 'options', // 配置的请求参数都放这里
    },
    // 建立和 roles 的多对多关系
    {
      type: 'belongsToMany',
      name: 'roles',
      target: 'roles',
    },
  ],
});
