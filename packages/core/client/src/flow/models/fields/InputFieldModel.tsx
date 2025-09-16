/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { Input } from 'antd';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { FieldModel } from '../base';

interface Props {
  value?: string;
  onChange?: (val: string) => void;
  [key: string]: any;
}

export const InputComponent: React.FC<Props> = ({ value = '', onChange, ...rest }) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, isComposing, internalValue]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    if (!isComposing) onChange?.(val);
  };

  const handleComposition: React.CompositionEventHandler<HTMLInputElement> = (e) => {
    if (e.type === 'compositionstart') {
      setIsComposing(true);
    } else if (e.type === 'compositionend') {
      setIsComposing(false);
      const val = e.currentTarget.value;
      setInternalValue(val);
      onChange?.(val);
    }
  };

  return (
    <Input
      {...rest}
      value={internalValue}
      onChange={handleChange}
      onCompositionStart={handleComposition}
      onCompositionEnd={handleComposition}
    />
  );
};

export class InputFieldModel extends FieldModel {
  render() {
    return <InputComponent {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface(
  'InputFieldModel',
  ['input', 'email', 'phone', 'uuid', 'url', 'sequence', 'nanoid'],
  {
    isDefault: true,
  },
);

FilterableItemModel.bindModelToInterface(
  'InputFieldModel',
  [
    'input',
    'email',
    'phone',
    'uuid',
    'url',
    'sequence',
    'nanoid',
    'textarea',
    'markdown',
    'richText',
    'password',
    'color',
  ],
  {
    isDefault: true,
  },
);
