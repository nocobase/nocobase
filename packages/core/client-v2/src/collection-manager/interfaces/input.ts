/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isArr, isEmpty, isValid } from '@formily/shared';
import { registerValidateRules } from '@formily/validator';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';
import { i18n } from '../../i18n';
import { defaultProps, primaryKey, unique } from './properties';

const isValidateEmpty = (value: any) => {
  if (isArr(value)) {
    for (let i = 0; i < value.length; i++) {
      if (isValid(value[i])) return false;
    }
    return true;
  } else {
    //compat to draft-js
    if (value?.getCurrentContent) {
      /* istanbul ignore next */
      return !value.getCurrentContent()?.hasText();
    }
    return isEmpty(value);
  }
};

registerValidateRules({
  username(value) {
    return /^[^@<>"'/]{1,50}$/.test(value) || i18n.t('Must be 1-50 characters in length (excluding @<>"\'/)');
  },
  required(value, rule) {
    if (rule.required === false) return '';
    if (typeof value === 'string') {
      value = value.trim();
    }
    return isValidateEmpty(value) ? rule.message : '';
  },
});

export class InputFieldInterface extends CollectionFieldInterface {
  name = 'input';
  type = 'object';
  group = 'basic';
  order = 1;
  title = '{{t("Single line text")}}';
  primaryKeyDescription = '{{t("Primary key, unique identifier")}}';
  sortable = true;
  default = {
    interface: 'input',
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  };
  availableTypes = ['string', 'uid'];
  hasDefaultValue = true;
  validationType = 'string';
  availableValidationOptions = ['min', 'max', 'length', 'pattern'];
  properties = {
    ...defaultProps,
    trim: {
      type: 'boolean',
      'x-content': '{{t("Automatically remove heading and tailing spaces")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    layout: {
      type: 'void',
      title: '{{t("Index")}}',
      'x-component': 'Space',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        style: {
          marginBottom: '0px',
        },
      },
      properties: {
        primaryKey,
        unique,
      },
    },
  };
  filterable = {
    operators: 'string',
  };
  titleUsable = true;
}
