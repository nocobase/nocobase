/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, defaultProps } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { tStr } from './locale';

export class EncryptionFieldInterface extends CollectionFieldInterface {
  name = 'encryption';
  type = 'object';
  group = 'advanced';
  order = 10;
  title = tStr('Encryption');
  default = {
    type: 'encryption',
    iv: uid(16),
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    hidden: {
      type: 'boolean',
      title: '{{t("Hidden")}}',
      required: true,
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      description: tStr('The response result does not return the value of this field'),
    },
  };
  filterable = {
    operators: [
      { label: '{{t("is")}}', value: '$encryptionEq', selected: true },
      { label: '{{t("is not")}}', value: '$encryptionNe' },
      { label: '{{t("exists")}}', value: '$exists', noValue: true },
      { label: '{{t("not exists")}}', value: '$notExists', noValue: true },
    ],
  };
}
