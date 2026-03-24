/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'aiMcpClients',
  fields: [
    {
      name: 'name',
      type: 'uid',
      primaryKey: true,
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'description',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("Description")}}',
        'x-component': 'Input.TextArea',
      },
    },
    {
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'transport',
      type: 'string',
      interface: 'select',
      uiSchema: {
        title: '{{t("Transport")}}',
        'x-component': 'Select',
      },
    },
    {
      name: 'command',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("Command")}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'args',
      type: 'json',
      defaultValue: [],
    },
    {
      name: 'env',
      type: 'json',
      defaultValue: {},
    },
    {
      name: 'url',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("URL")}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'headers',
      type: 'json',
      defaultValue: {},
    },
    {
      name: 'restart',
      type: 'json',
      defaultValue: {},
    },
  ],
};
