/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, defaultProps, operators } from '@nocobase/client';

export class EncryptionFieldInterface extends CollectionFieldInterface {
  name = 'encryption';
  type = 'object';
  group = 'advanced';
  order = 10;
  title = '{{t("Encryption")}}';
  default = {
    type: 'encryption',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
}
