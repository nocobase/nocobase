/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { COLLECTION_NAME } from '../constant';

export default {
  name: COLLECTION_NAME.channels,
  migrationRules: ['overwrite', 'schema-only'],
  filterTargetKey: 'name',
  autoGenId: false,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  fields: [
    {
      name: 'name',
      type: 'uid',
      prefix: 's_',
      primaryKey: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Channel name")}}',
        'x-component': 'Input',
        required: true,
        description:
          "{{t('Randomly generated and can not be modified. Support letters, numbers and underscores, must start with an letter.')}}",
      },
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Channel display name")}}',
        required: true,
      },
    },
    {
      name: 'options',
      type: 'json',
      interface: 'json',
      uiSchema: {
        type: 'object',
        'x-component': 'ConfigForm',
      },
    },
    {
      name: 'meta',
      type: 'json',
      interface: 'json',
    },
    {
      interface: 'input',
      type: 'string',
      name: 'notificationType',
      uiSchema: {
        type: 'string',
        title: '{{t("Notification type")}}',
        'x-component': 'Select',
        enum: '{{notificationTypeOptions}}',
        required: true,
      },
    },
    {
      name: 'description',
      type: 'text',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        'x-component': 'Input.TextArea',
        title: '{{t("Description")}}',
      },
    },
  ],
};
