/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generatePluginTranslationTemplate } from '../../../../../locale';
import { ActionColorSelect } from './ActionColorSelect';
import { ActionFillSelect } from './ActionFillSelect';

export const actionCommonInitializerSchema = {
  title: {
    type: 'string',
    title: generatePluginTranslationTemplate('Title'),
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-reactions': [
      {
        target: 'icon',
        fulfill: {
          state: {
            required: '{{!$self.value}}',
          },
        },
      },
    ],
  },
  icon: {
    type: 'string',
    title: generatePluginTranslationTemplate('Icon'),
    'x-decorator': 'FormItem',
    'x-component': 'IconPicker',
    'x-reactions': [
      {
        target: 'title',
        fulfill: {
          state: {
            required: '{{!$self.value}}',
          },
        },
      },
    ],
  },
  color: {
    type: 'string',
    title: generatePluginTranslationTemplate('Color'),
    'x-decorator': 'FormItem',
    'x-component': ActionColorSelect,
  },
  fill: {
    type: 'boolean',
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
};
