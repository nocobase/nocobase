/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@nocobase/client';
import { generatePluginTranslationTemplate } from '../../locale';

export const mobileTabBarItemSchemaFormFields: Record<string, ISchema> = {
  title: {
    title: generatePluginTranslationTemplate('title'),
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  icon: {
    title: generatePluginTranslationTemplate('Icon'),
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'IconPicker',
  },
  selectedIcon: {
    title: generatePluginTranslationTemplate('Selected icon'),
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'IconPicker',
  },
};
