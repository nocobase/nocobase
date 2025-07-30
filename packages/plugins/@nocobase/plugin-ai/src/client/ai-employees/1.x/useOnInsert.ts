/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';

function setNativeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(
    new Event('input', {
      bubbles: true,
    }),
  );
}

export const useOnInsert = () => {
  const onInsert = useCallback((getTextArea: () => any, value: string) => {
    const textArea = getTextArea();
    if (!textArea) {
      return;
    }

    const nextValue =
      textArea.value.slice(0, textArea.selectionStart) + value + textArea.value.slice(textArea.selectionEnd);
    const nextPos = [textArea.selectionStart, textArea.selectionStart + value.length];
    setNativeInputValue(textArea, nextValue);
    textArea.setSelectionRange(...nextPos);
    textArea.focus();
  }, []);

  return { onInsert };
};
