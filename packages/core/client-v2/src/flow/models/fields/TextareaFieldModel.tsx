/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import React, { useEffect, useRef, useState } from 'react';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base/FieldModel';

function IMESafeTextArea(props: TextAreaProps) {
  const { value, onChange, onCompositionStart, onCompositionEnd, ...rest } = props;
  const [textAreaValue, setTextAreaValue] = useState<TextAreaProps['value']>(() => normalizeTextAreaValue(value));
  const textAreaValueRef = useRef<TextAreaProps['value']>(textAreaValue);
  const pendingLocalValuesRef = useRef<TextAreaProps['value'][]>([]);

  useEffect(() => {
    const nextValue = normalizeTextAreaValue(value);
    const pendingValues = pendingLocalValuesRef.current;
    const pendingIndex = pendingValues.findIndex((item) => Object.is(item, nextValue));

    if (pendingIndex >= 0) {
      pendingValues.splice(0, pendingIndex + 1);
      if (!Object.is(textAreaValueRef.current, nextValue)) {
        return;
      }
    }

    pendingValues.length = 0;
    if (Object.is(textAreaValueRef.current, nextValue)) {
      return;
    }

    textAreaValueRef.current = nextValue;
    setTextAreaValue(nextValue);
  }, [value]);

  const getEventValue = (event: React.ChangeEvent<HTMLTextAreaElement> | React.CompositionEvent<HTMLTextAreaElement>) =>
    event.currentTarget.value;

  const recordLocalValue = (
    event: React.ChangeEvent<HTMLTextAreaElement> | React.CompositionEvent<HTMLTextAreaElement>,
  ) => {
    const nextValue = getEventValue(event);
    const pendingValues = pendingLocalValuesRef.current;
    pendingValues.push(nextValue);
    if (pendingValues.length > 20) {
      pendingValues.shift();
    }
    textAreaValueRef.current = nextValue;
    setTextAreaValue(nextValue);
  };

  return (
    <Input.TextArea
      {...rest}
      value={textAreaValue}
      onChange={(event) => {
        recordLocalValue(event);
        onChange?.(event);
      }}
      onCompositionStart={(event) => {
        recordLocalValue(event);
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        recordLocalValue(event);
        onCompositionEnd?.(event);
      }}
    />
  );
}

function normalizeTextAreaValue(nextValue: unknown): TextAreaProps['value'] {
  if (typeof nextValue === 'bigint') return String(nextValue);
  if (nextValue == null) return '';
  return nextValue as TextAreaProps['value'];
}

@largeField()
export class TextareaFieldModel extends FieldModel {
  render() {
    return <IMESafeTextArea {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('TextareaFieldModel', ['textarea'], {
  isDefault: true,
  defaultProps: {
    autoSize: {
      maxRows: 10,
      minRows: 3,
    },
  },
});
