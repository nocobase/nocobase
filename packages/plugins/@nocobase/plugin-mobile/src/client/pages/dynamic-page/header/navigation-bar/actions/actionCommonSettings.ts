/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, createModalSettingsItem } from '@nocobase/client';
import { generatePluginTranslationTemplate } from '../../../../../locale';
import { ActionColorSelect } from './ActionColorSelect';
import { ActionFillSelect } from './ActionFillSelect';

export const editAction = (extraProperties?: (values: any) => Record<string, ISchema>) => {
  return createModalSettingsItem({
    title: generatePluginTranslationTemplate('Edit button'),
    name: 'action',
    parentSchemaKey: 'x-component-props',
    schema: (values) => ({
      type: 'object',
      title: generatePluginTranslationTemplate('Edit'),
      properties: {
        ...(extraProperties ? extraProperties(values) : {}),
        title: {
          title: generatePluginTranslationTemplate('Title'),
          type: 'string',
          default: values.title,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-reactions': {
            target: 'icon',
            fulfill: {
              state: {
                required: '{{!$self.value}}',
              },
            },
          },
        },
        icon: {
          title: generatePluginTranslationTemplate('Icon'),
          type: 'string',
          default: values.icon,
          'x-decorator': 'FormItem',
          'x-component': 'IconPicker',
          'x-reactions': {
            target: 'title',
            fulfill: {
              state: {
                required: '{{!$self.value}}',
              },
            },
          },
        },
        color: {
          type: 'string',
          default: values.color,
          title: generatePluginTranslationTemplate('Color'),
          'x-decorator': 'FormItem',
          'x-component': ActionColorSelect,
        },
        fill: {
          type: 'boolean',
          default: values.fill,
          title: generatePluginTranslationTemplate('Fill'),
          'x-decorator': 'FormItem',
          'x-component': ActionFillSelect,
          'x-reactions': [
            {
              dependencies: ['title', 'icon'],
              fulfill: {
                state: {
                  visible: '{{!!$deps[0] && !!$deps[1]}}',
                },
              },
            },
          ],
        },
      },
    }),
  });
};
