/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { NAMESPACE } from '../locale';

export const publicFormsCollection = {
  name: 'publicForms',
  filterTargetKey: 'key',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: "{{t('Title')}}",
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'text',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: "{{t('Description')}}",
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'string',
      name: 'type',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: `{{t("Type",{ns:"public-forms"})}}`,
        'x-component': 'Radio.Group',
        enum: '{{ formTypes }}',
      },
    },
    {
      type: 'string',
      name: 'collection',
      interface: 'collection',
      uiSchema: {
        type: 'string',
        title: "{{t('Collection')}}",
        required: true,
        'x-component': 'DataSourceCollectionCascader',
      },
    },
    {
      type: 'password',
      name: 'password',
      interface: 'password',
      uiSchema: {
        type: 'string',
        title: "{{t('Password')}}",
        'x-component': 'TextAreaWithGlobalScope',
        'x-component-props': {
          autocomplete: 'new-password',
          password: true,
        },
      },
    },
    {
      type: 'boolean',
      name: 'enabled',
      interface: 'checkbox',
      uiSchema: {
        type: 'string',
        title: `{{t("Enable form",{ns:"${NAMESPACE}"})}}`,
        'x-component': 'Checkbox',
        default: true,
      },
    },
    // {
    //   type: 'date',
    //   name: 'createdAt',
    //   interface: 'createdAt',
    //   uiSchema: {
    //     type: 'string',
    //     title: "{{t('CreatedAt')}}",
    //     'x-component': 'DatePicker',
    //     'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: true, timeFormat: 'HH:mm:ss' },
    //   },
    // },
    // {
    //   type: 'date',
    //   name: 'createdBy',
    //   interface: 'createdBy',
    //   target: 'users',
    //   foreignKey: 'createdById',
    //   uiSchema: {
    //     title: '{{t("Created by")}}',
    //     'x-component': 'RecordPicker',
    //     'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
    //     'x-read-pretty': true,
    //   },
    // },
    // {
    //   type: 'object',
    //   name: 'updatedAt',
    //   interface: 'updatedAt',
    //   uiSchema: {
    //     type: 'string',
    //     title: "{{t('updatedAt')}}",
    //     'x-component': 'DatePicker',
    //     'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: true, timeFormat: 'HH:mm:ss' },
    //   },
    // },
    // {
    //   type: 'object',
    //   name: 'updatedBy',
    //   interface: 'updatedBy',
    //   target: 'users',
    //   foreignKey: 'updatedById',
    //   uiSchema: {
    //     title: '{{t("Last updated by")}}',
    //     'x-component': 'RecordPicker',
    //     'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
    //     'x-read-pretty': true,
    //   },
    // },
  ],
};
