/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/client';
import { COLLECTION_NAME } from '../constant';

const collectionOption: CollectionOptions = {
  name: COLLECTION_NAME.messageLogs,
  title: 'MessageLogs',
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
      name: 'message',
      target: COLLECTION_NAME.messages,
      targetKey: 'id',
      foreignKey: 'messageId',
      interface: 'm2o',
      type: 'belongsTo',
      onDelete: 'SET NULL',
      uiSchema: {
        type: 'number',
        title: '{{t("message")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: false,
        },
      },
    },
    {
      name: 'channel',
      target: COLLECTION_NAME.channels,
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
      name: 'updatedAt',
      type: 'date',
      interface: 'updatedAt',
      field: 'updatedAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
  ],
};

export default collectionOption;
