/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tStr, useT } from '../locale';

export const blockTemplatesCollection = {
  name: 'blockTemplates',
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
      type: 'string',
      name: 'key',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: "{{t('Name')}}",
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        type: 'string',
        required: true,
        title: tStr('Type'),
        'x-component': 'Select',
        'x-use-component-props': function useComponentProps() {
          const t = useT();
          return {
            defaultValue: 'Desktop',
            options: [
              { label: t('Desktop'), value: 'Desktop' },
              { label: t('Mobile'), value: 'Mobile' },
            ],
          };
        },
      },
    },
    {
      type: 'string',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: "{{t('Description')}}",
        'x-component': 'Input.TextArea',
      },
    },
  ],
};
