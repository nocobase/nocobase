/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
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
    interface: 'code',
    type: 'text',
    uiSchema: {
      type: 'string',
      'x-component': 'Input.TextArea',
    },
  };
  availableTypes = ['text', 'string'];
  filterable = {
    operators: 'bigField',
  };
  titleUsable = false;
  configure = {
    properties: {
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
    },
  };
}
