/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
