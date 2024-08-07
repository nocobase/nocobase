/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * id title channelId template
 */

import { CollectionOptions } from '@nocobase/client';
import { COLLECTION_NAME } from '../constant';
import { MessageComponentNames } from '../client/manager/message/types';

const collectionOption: CollectionOptions = {
  name: COLLECTION_NAME.messages,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
      interface: 'integer',
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: 'title',
      },
    },
    {
      name: 'channel',
      target: 'channels',
      targetKey: 'id',
      foreignKey: 'channelId',
      interface: 'm2o',
      type: 'belongsTo',
      onDelete: 'SET NULL',
      uiSchema: {
        type: 'number',
        title: '{{t("channel")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: false,
        },
      },
    },
    {
      name: 'receiveOption',
      type: 'json',
      interface: 'json',
      uiSchema: {
        type: 'object',
        'x-component': `${MessageComponentNames.ReceiverConfigForm}`,
        title: 'receiveOption',
      },
    },
    {
      name: 'message',
      type: 'json',
      interface: 'json',
      uiSchema: {
        type: 'void',
        'x-component': `${MessageComponentNames.MessageInput}`,
        title: 'message',
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

export default collectionOption;
