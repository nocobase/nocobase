import { CollectionOptions } from '@nocobase/database';
import { NotificationService } from '../models';

export default {
  name: 'notification_services',
  model: NotificationService,
  title: '通知服务',
  fields: [
    {
      title: '类型',
      type: 'string',
      name: 'type',
    },
    {
      title: '服务名称',
      type: 'string',
      name: 'title',
    },
    {
      title: '配置信息',
      type: 'json',
      name: 'options',
    },
  ],
} as CollectionOptions;
