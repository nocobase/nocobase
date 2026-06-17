/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { isValidFilter } from '@nocobase/utils/client';
import { FilterDynamicComponent } from '../../components/FilterDynamicComponent';
import { useT } from '../../locale';

export function NodeFilterField({
  collection,
  label,
  name = ['config', 'params', 'filter'],
  required = true,
}: {
  collection?: string;
  label?: string;
  name?: Array<string | number>;
  required?: boolean;
}) {
  const t = useT();

  return (
    <Form.Item
      name={name}
      label={label ?? t('Filter')}
      validateTrigger={['onChange', 'onBlur']}
      rules={
        required
          ? [
              {
                validator: async (_rule, value) => {
                  if (!isValidFilter(value)) {
                    throw new Error(t('Please add at least one condition'));
                  }
                },
              },
            ]
          : undefined
      }
    >
      <FilterDynamicComponent collection={collection} />
    </Form.Item>
  );
}

export default NodeFilterField;
