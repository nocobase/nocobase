/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/client';
import { InAppMessagesDefinition, ChatsDefinition } from './index';

export const messageCollection: CollectionOptions = {
  name: InAppMessagesDefinition.name,
  title: 'in-app messages',
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
      name: 'userId',
      type: 'string',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("User ID")}}',
        required: true,
      },
    },
    {
      name: 'chat',
      type: 'belongsTo',
      interface: 'm2o',
      target: ChatsDefinition.name,
      targetKey: ChatsDefinition.fieldNameMap.id,
      foreignKey: InAppMessagesDefinition.fieldNameMap.chatId,
      uiSchema: {
        type: 'string',
        'x-component': 'AssociationField',
        title: '{{t("Chat")}}',
      },
    },
    {
      name: 'title',
      type: 'string',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Title")}}',
        required: true,
      },
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.content,
      type: 'string',
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
      name: 'receiveTimestamp',
      type: 'bigInt',
    },
  ],
};
