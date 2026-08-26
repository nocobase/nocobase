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
import type { TextAreaRef } from 'antd/es/input/TextArea';
import React, { useEffect, useRef } from 'react';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base/FieldModel';

function IMESafeTextArea(props: TextAreaProps) {
  const { value, onChange, onCompositionStart, onCompositionEnd, ...rest } = props;
  const textAreaRef = useRef<TextAreaRef>(null);
  const previousValueRef = useRef(value);
  const defaultValue = typeof value === 'bigint' ? String(value) : value;

  useEffect(() => {
    if (Object.is(previousValueRef.current, value)) {
      return;
    }
    previousValueRef.current = value;

    const textArea = textAreaRef.current?.resizableTextArea?.textArea;
    if (textArea) {
      const nextValue = value == null ? '' : String(value);
      if (textArea.value !== nextValue) {
        textArea.value = nextValue;
      }
    }
  }, [value]);

  const getEventValue = (event: React.ChangeEvent<HTMLTextAreaElement> | React.CompositionEvent<HTMLTextAreaElement>) =>
    event.currentTarget.value;

  return (
    <Input.TextArea
      {...rest}
      ref={textAreaRef}
      defaultValue={defaultValue}
      onChange={(event) => {
        previousValueRef.current = getEventValue(event);
        onChange?.(event);
      }}
      onCompositionStart={(event) => {
        previousValueRef.current = getEventValue(event);
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        previousValueRef.current = getEventValue(event);
        onCompositionEnd?.(event);
      }}
    />
  );
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
