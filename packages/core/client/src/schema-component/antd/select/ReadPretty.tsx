/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isArrayField } from '@formily/core';
import { observer, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Tag } from 'antd';
import React from 'react';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { FieldNames, defaultFieldNames, getCurrentOptions } from './utils';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';

export interface SelectReadPrettyProps {
  value: any;
  options?: any[];
  ellipsis?: boolean;
  /**
   * format options
   * @default { label: 'label', value: 'value', color: 'color', children: 'children' }
   */
  fieldNames?: FieldNames;
}

export const ReadPretty = observer(
  (props: SelectReadPrettyProps) => {
    const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
    const field = useField<any>();
    const collectionField = useCollectionField();
    const dataSource = field.dataSource || props.options || collectionField?.uiSchema.enum || [];
    const currentOptions = getCurrentOptions(field.value, dataSource, fieldNames);

    if (!isValid(props.value) && !currentOptions.length) {
      return <div />;
    }
    if (isArrayField(field) && field?.value?.length === 0) {
      return <div />;
    }

    return (
      <div>
        <EllipsisWithTooltip ellipsis={props.ellipsis}>
          {currentOptions.map((option, key) => (
            <Tag key={key} color={option[fieldNames.color]} icon={option.icon}>
              {option[fieldNames.label]}
            </Tag>
          ))}
        </EllipsisWithTooltip>
      </div>
    );
  },
  { displayName: 'ReadPretty' },
);
