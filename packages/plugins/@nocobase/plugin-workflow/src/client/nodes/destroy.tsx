/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';

import { useCollectionDataSource } from '@nocobase/client';
import { isValidFilter } from '@nocobase/utils/client';

import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { collection, filter } from '../schemas/collection';
import { Instruction, useNodeSavedConfig } from '.';
import { NAMESPACE, lang } from '../locale';

export default class extends Instruction {
  title = '{{t("Delete record")}}';
  type = 'destroy';
  group = 'collection';
  description = `{{t("Delete records of a collection. Could use variables in workflow context as filter. All records match the filter will be deleted.", { ns: "${NAMESPACE}" })}}`;
  icon = (<DeleteOutlined style={{}} />);
  fieldset = {
    collection: {
      ...collection,
      'x-disabled': '{{ useNodeSavedConfig(["collection"]) }}',
      'x-reactions': [
        ...collection['x-reactions'],
        {
          target: 'params',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
        {
          target: 'params',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: '{{Object.create({})}}',
            },
          },
        },
      ],
    },
    params: {
      type: 'object',
      properties: {
        filter: {
          ...filter,
          ['x-validator'](value) {
            return isValidFilter(value) ? '' : lang('Please add at least one condition');
          },
        },
      },
    },
  };
  scope = {
    useNodeSavedConfig,
    useCollectionDataSource,
  };
  components = {
    FilterDynamicComponent,
  };
}
