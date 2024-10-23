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
import React, { useMemo } from 'react';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { FieldNames, defaultFieldNames, getCurrentOptions } from './utils';

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
    const fieldNames = useMemo(() => ({ ...defaultFieldNames, ...props.fieldNames }), [props.fieldNames]);
    const field = useField<any>();
    const collectionField = useCollectionField();
    const currentOptions = useMemo(() => {
      const dataSource = field.dataSource || props.options || collectionField?.uiSchema.enum || [];
      return getCurrentOptions(field.value, dataSource, fieldNames);
    }, [collectionField?.uiSchema.enum, field.dataSource, field.value, fieldNames, props.options]);

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
