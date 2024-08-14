/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { operators, autoFill, primaryKey, unique } from './properties';
export class NanoidFieldInterface extends CollectionFieldInterface {
  name = 'nanoid';
  type = 'object';
  group = 'advanced';
  order = 0;
  title = '{{t("Nano ID")}}';
  hidden = false;
  sortable = true;
  default = {
    type: 'nanoid',
    uiSchema: {
      type: 'string',
      'x-component': 'NanoIDInput',
    },
  };
  availableTypes = ['string', 'nanoid'];
  properties = {
    customAlphabet: {
      type: 'string',
      title: '{{t("Alphabet")}}',
      default: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    size: {
      type: 'number',
      title: '{{t("Length")}}',
      default: 21,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
    },
    autoFill,
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
    operators: operators.string,
  };
  titleUsable = true;
}
