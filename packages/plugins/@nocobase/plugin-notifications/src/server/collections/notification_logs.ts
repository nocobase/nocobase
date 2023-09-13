import { CollectionOptions } from '@nocobase/database';
import { NotificationLog } from '../models';

export default {
  name: 'notification_logs',
  model: NotificationLog,
  title: '通知日志',
  fields: [
    {
      title: '接收人',
      type: 'json',
      name: 'receiver',
    },
    {
      title: '状态',
      type: 'string',
      name: 'state',
    },
    {
      title: '详情',
      type: 'json',
      name: 'response',
    },
  ],
} as CollectionOptions;
