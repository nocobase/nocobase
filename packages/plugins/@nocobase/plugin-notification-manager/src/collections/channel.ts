/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { COLLECTION_NAME } from '../constant';
import { CollectionOptions } from '@nocobase/client';

const channelCollection: CollectionOptions = {
  name: COLLECTION_NAME.channels,
  filterTargetKey: 'name',
  prefix: 's_',
  fields: [
    {
      name: 'name',
      type: 'uid',
      primaryKey: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Channel name")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
        required: true,
        description:
          "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
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
    {
      name: 'CreatedAt',
      type: 'date',
      interface: 'createdAt',
      field: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
    {
      name: 'createdBy',
      type: 'belongsTo',
      interface: 'createdBy',
      description: null,
      parentKey: null,
      reverseKey: null,
      target: 'users',
      foreignKey: 'createdById',
      uiSchema: {
        type: 'object',
        title: '{{t("Created by")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
      targetKey: 'id',
    },
    {
      name: 'updatedAt',
      type: 'date',
      interface: 'updatedAt',
      field: 'updatedAt',
      uiSchema: {
        type: 'string',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
  ],
};
export default channelCollection;
