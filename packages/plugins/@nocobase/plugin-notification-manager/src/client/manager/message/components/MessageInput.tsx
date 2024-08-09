/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { Variable, useVariableOptions, useDatetimeVariable } from '@nocobase/client';
import { ObjectField, useField, Field, observer } from '@formily/react';
import { ObjectField as ObjectFieldType } from '@formily/core';

const MessageInput = observer(
  () => {
    const inputRef = useRef<TextAreaRef>(null);
    const [curPos, setCurPos] = useState(null);

    const field = useField<ObjectFieldType>();
    // useEffect(() => {
    //   const inputEle = inputRef?.current?.resizableTextArea?.textArea;
    //   if (curPos && inputEle) {
    //     inputEle.setSelectionRange(curPos, curPos);
    //   }
    // }, [curPos]);

    const { datetimeSettings } = useDatetimeVariable({ noDisabled: true });
    // const onInsert = useCallback(
    //   function (paths: string[]) {
    //     const variable: string[] = paths.filter((key) => Boolean(key.trim()));
    //     const { current } = inputRef;
    //     const inputEle = current?.resizableTextArea?.textArea;
    //     if (!inputEle || !variable) {
    //       return;
    //     }
    //     current.focus();
    //     const templateVar = `{{${paths.join('.')}}}`;
    //     const startPos = inputEle.selectionStart || 0;
    //     const newVal = value.substring(0, startPos) + templateVar + value.substring(startPos, value.length);
    //     const newPos = startPos + templateVar.length;
    //     setValue(newVal);
    //     setCurPos(newPos);
    //   },
    //   [value],
    // );

    return (
      <div style={{ position: 'relative', paddingTop: '20px' }}>
        <Field
          name={'body'}
          component={[
            Variable.TextArea,
            { scope: [datetimeSettings], autoSize: { minRows: 3 }, style: { paddingBottom: '40px' } },
          ]}
        ></Field>
      </div>
    );
  },
  {
    displayName: 'MessageInput',
  },
);

const Message = () => {
  return <MessageInput />;
};

export default Message;
