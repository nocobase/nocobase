/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/client';
import { InAppMessagesDefinition, ChannelsDefinition } from './index';

export const messageCollection: CollectionOptions = {
  name: InAppMessagesDefinition.name,
  title: 'in-app messages',
  migrationRules: ['schema-only'],
  fields: [
    {
      name: InAppMessagesDefinition.fieldNameMap.id,
      type: 'uuid',
      primaryKey: true,
      allowNull: false,
      interface: 'uuid',
      uiSchema: {
        type: 'string',
        title: '{{t("ID")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.userId,
      type: 'bigInt',
      uiSchema: {
        type: 'number',
        'x-component': 'Input',
        title: '{{t("User ID")}}',
        required: true,
      },
    },
    {
      name: 'channel',
      type: 'belongsTo',
      interface: 'm2o',
      target: 'notificationChannels',
      targetKey: 'name',
      foreignKey: InAppMessagesDefinition.fieldNameMap.channelName,
      uiSchema: {
        type: 'string',
        'x-component': 'AssociationField',
        title: '{{t("Channel")}}',
      },
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.title,
      type: 'text',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Title")}}',
        required: true,
      },
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.content,
      type: 'text',
      interface: 'string',
      uiSchema: {
        type: 'string',
        title: '{{t("Content")}}',
        'x-component': 'Input',
      },
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.status,
      type: 'string',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Status")}}',
        required: true,
      },
    },
    {
      name: 'createdAt',
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
      name: InAppMessagesDefinition.fieldNameMap.receiveTimestamp,
      type: 'bigInt',
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.options,
      type: 'json',
    },
  ],
};
