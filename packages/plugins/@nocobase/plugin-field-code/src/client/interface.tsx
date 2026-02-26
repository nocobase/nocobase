/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, defaultProps } from '@nocobase/client';
import { NAMESPACE } from '../common/constants';
import { LANGUAGES_LIST } from './languages';

export class CodeFieldInterface extends CollectionFieldInterface {
  name = 'code';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = `{{t("Code", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("Programming code editor with syntax highlighting.", { ns: "${NAMESPACE}" })}}`;
  sortable = true;
  default = {
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'CodeEditor',
    },
  };
  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.language': {
      type: 'string',
      title: `{{t("Programming language", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: true,
        allowClear: true,
        placeholder: `{{t("Choose language", { ns: "${NAMESPACE}" })}}`,
      },
      enum: LANGUAGES_LIST.map((item) => ({
        label: item.label,
        value: item.value,
      })),
      default: 'javascript',
    },
  };
  titleUsable = false;
}
