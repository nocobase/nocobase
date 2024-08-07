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
      type: 'nanoid',
      primaryKey: true,
      allowNull: false,
      autoFill: true,
      customAlphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      interface: 'nanoid',
      uiSchema: {
        type: 'string',
        title: '{{t("ID")}}',
        'x-component': 'NanoIDInput',
        'x-read-pretty': true,
      },
      unique: true,
      size: 10,
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
        type: 'string',
        title: '{{t("Channel")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: false,
        },
      },
    },
    {
      name: 'triggerFrom',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Trigger From")}}',
      },
    },
    {
      name: 'status',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Status")}}',
      },
    },
    {
      name: 'receiver',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Receiver")}}',
      },
    },
    {
      name: 'reason',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Reason")}}',
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
