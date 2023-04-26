import { CollectionOptions } from '@nocobase/database';
import { Notification } from '../models';

export default {
  name: 'notifications',
  model: Notification,
  title: '通知',
  fields: [
    {
      type: 'uid',
      name: 'name',
      prefix: 'n_',
    },
    {
      title: '主题',
      type: 'string',
      name: 'subject',
    },
    {
      title: '内容',
      type: 'text',
      name: 'body',
    },
    {
      title: '接收人配置',
      type: 'json',
      name: 'receiver_options',
    },
    {
      title: '发送服务',
      type: 'belongsTo',
      name: 'service',
      target: 'notification_services',
    },
    {
      title: '日志',
      type: 'hasMany',
      name: 'logs',
      target: 'notification_logs',
    },
  ],
} as CollectionOptions;
