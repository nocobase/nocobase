/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PrintTemplateActionNameLowercase } from '../constants';
import { printTemplateActionSettings } from '../settings';
export function usePrintTemplateActionProps() {
  return {
    title: '打印模板',
    type: 'primary',
    onClick() {
      console.log(PrintTemplateActionNameLowercase);
    },
  };
}
export const createPrintTemplateActionSchema = (blockComponent: string) => {
  return {
    type: 'void',
    'x-component': 'Action',
    'x-use-component-props': 'usePrintTemplateActionProps',
    'x-settings': printTemplateActionSettings.name,
  };
};
