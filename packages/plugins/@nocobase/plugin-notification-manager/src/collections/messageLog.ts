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
  name: COLLECTION_NAME.logs,
  migrationRules: ['schema-only'],
  title: 'MessageLogs',
  fields: [
    {
      name: 'id',
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
      name: 'channelName',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Channel name")}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'channelTitle',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Channel display name")}}',
      },
    },
    {
      name: 'triggerFrom',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Trigger from")}}',
      },
    },
    {
      name: 'notificationType',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Notification type")}}',
        'x-component': 'Select',
        enum: '{{notificationTypeOptions}}',
        required: true,
      },
    },
    {
      name: 'status',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Success")}}', value: 'success', color: 'green' },
          { label: '{{t("Failure")}}', value: 'failure', color: 'red' },
        ],
        title: '{{t("Status")}}',
      },
    },
    {
      name: 'message',
      type: 'json',
      interface: 'json',
      uiSchema: {
        'x-component': 'Input.JSON',
        title: '{{t("Message")}}',
        'x-component-props': { autoSize: { minRows: 5 } },
        autoSize: { minRows: 5 },
      },
    },
    {
      name: 'reason',
      type: 'text',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Failed reason")}}',
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
