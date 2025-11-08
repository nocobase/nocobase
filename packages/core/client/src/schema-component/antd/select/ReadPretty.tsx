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
import React, { useEffect, useState } from 'react';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { FieldNames, defaultFieldNames, getCurrentOptions } from './utils';
import { withPopupWrapper } from '../../common/withPopupWrapper';
import { Icon } from '../../../icon';

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

const ReadPrettyInternal = observer(
  (props: SelectReadPrettyProps) => {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<React.ReactNode[]>([]);
    const field = useField<any>();
    const collectionField = useCollectionField();

    // The map method here maybe quite time-consuming, especially in table blocks.
    // Therefore, we use an asynchronous approach to render the list,
    // which allows us to avoid blocking the main rendering process.
    useEffect(() => {
      const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
      const dataSource = field.dataSource || props.options || collectionField?.uiSchema.enum || [];
      const currentOptions = getCurrentOptions(field.value, dataSource, fieldNames);

      if (!isValid(props.value) && !currentOptions.length) {
        return;
      }

      if (isArrayField(field) && field?.value?.length === 0) {
        return;
      }

      const content =
        field.value !== null &&
        currentOptions.map((option, index) => (
          <Tag
            key={index}
            color={option[fieldNames.color]}
            icon={typeof option.icon === 'string' ? <Icon type={option.icon} /> : option.icon}
          >
            {option[fieldNames.label]}
          </Tag>
        ));
      setContent(content);
      setLoading(false);
    }, [
      collectionField?.uiSchema.enum,
      field,
      field.dataSource,
      field.value,
      props.fieldNames,
      props.options,
      props.value,
    ]);

    if (loading) {
      return null;
    }

    return <EllipsisWithTooltip ellipsis={props.ellipsis}>{content}</EllipsisWithTooltip>;
  },
  { displayName: 'SelectReadPretty' },
);

export const ReadPretty = withPopupWrapper(ReadPrettyInternal);
