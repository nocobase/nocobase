/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

interface Props {
  value?: string;
  onChange?: (val: string) => void;
  [key: string]: any;
}

const TextareaComponent: React.FC<Props> = ({ value = '', onChange, ...rest }) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, isComposing, internalValue]);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    if (!isComposing) onChange?.(val);
  };

  const handleComposition: React.CompositionEventHandler<HTMLTextAreaElement> = (e) => {
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
    <Input.TextArea
      {...rest}
      value={internalValue}
      onChange={handleChange}
      onCompositionStart={handleComposition}
      onCompositionEnd={handleComposition}
    />
  );
};

@largeField()
export class TextareaFieldModel extends FieldModel {
  render() {
    return <TextareaComponent {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('TextareaFieldModel', ['textarea', 'markdown'], {
  isDefault: true,
  defaultProps: {
    autoSize: {
      maxRows: 10,
      minRows: 3,
    },
  },
});
