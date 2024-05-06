/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@nocobase/database';

const fieldTypeMap = {
  bigint: {
    type: 'integer',
    format: 'int64',
  },
  datetime: {
    type: 'string',
    format: 'date-time',
  },
  string: {
    type: 'string',
  },
  text: {
    type: 'string',
  },

  jsontype: {
    type: 'string',
  },
};

function getTypeByField(field: Field) {
  const fieldType = field.dataType.toString().toLowerCase();
  const fieldAttributes = fieldTypeMap[fieldType];

  if (!fieldAttributes) {
    return {
      type: 'string',
    };
  }

  return fieldAttributes;
}

export { fieldTypeMap, getTypeByField };
