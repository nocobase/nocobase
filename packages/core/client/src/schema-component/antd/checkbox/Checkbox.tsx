/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Checkbox as AntdCheckbox, Tag } from 'antd';
import type {
  CheckboxGroupProps as AntdCheckboxGroupProps,
  CheckboxProps as AntdCheckboxProps,
} from 'antd/es/checkbox';
import uniq from 'lodash/uniq';
import React, { FC, useMemo } from 'react';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';

type ComposedCheckbox = React.ForwardRefExoticComponent<
  Pick<Partial<any>, string | number | symbol> & React.RefAttributes<unknown>
> & {
  Group?: React.FC<AntdCheckboxGroupProps>;
  __ANT_CHECKBOX?: boolean;
  ReadPretty?: React.FC<CheckboxReadPrettyProps>;
};

export interface CheckboxReadPrettyProps {
  showUnchecked?: boolean;
  value?: boolean;
}

const ReadPretty: FC<CheckboxReadPrettyProps> = (props) => {
  if (props.value) {
    return <CheckOutlined style={{ color: '#52c41a' }} />;
  }
  return props.showUnchecked ? <CloseOutlined style={{ color: '#ff4d4f' }} /> : <AntdCheckbox disabled />;
};

export const Checkbox: ComposedCheckbox = connect(
  (props: AntdCheckboxProps) => {
    const changeHandler = (val) => {
      props?.onChange(val);
    };
    return <AntdCheckbox {...props} onChange={changeHandler} />;
  },
  mapProps({
    value: 'checked',
    onInput: 'onChange',
  }),
  mapReadPretty(ReadPretty),
);
Checkbox.displayName = 'Checkbox';

Checkbox.ReadPretty = ReadPretty;
Checkbox.ReadPretty.displayName = 'Checkbox.ReadPretty';

Checkbox.__ANT_CHECKBOX = true;

export interface CheckboxGroupReadPrettyProps {
  value?: any[];
  ellipsis?: boolean;
}

Checkbox.Group = connect(
  AntdCheckbox.Group,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props: CheckboxGroupReadPrettyProps) => {
    if (!isValid(props.value)) {
      return null;
    }
    const field = useField<any>();
    const collectionField = useCollectionField();
    const tags = useMemo(() => {
      const dataSource = field.dataSource || collectionField?.uiSchema.enum || [];
      const value = uniq(field.value ? field.value : []);
      return dataSource.filter((option) => value.includes(option.value));
    }, [field.value]);

    return (
      <EllipsisWithTooltip ellipsis={props.ellipsis}>
        {tags.map((option, key) => (
          <Tag key={key} color={option.color} icon={option.icon}>
            {option.label}
          </Tag>
        ))}
      </EllipsisWithTooltip>
    );
  }),
);
Checkbox.Group.displayName = 'Checkbox.Group';

export default Checkbox;
