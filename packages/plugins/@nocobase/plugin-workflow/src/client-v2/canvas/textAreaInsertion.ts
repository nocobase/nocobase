/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function insertTextAtSelection(value: string, insertText: string, start: number, end: number) {
  const nextValue = value.slice(0, start) + insertText + value.slice(end);
  const nextSelectionStart = start;
  const nextSelectionEnd = start + insertText.length;

  return {
    nextValue,
    nextSelectionStart,
    nextSelectionEnd,
  };
}

export function setNativeTextAreaValue(input: HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(
    new Event('input', {
      bubbles: true,
    }),
  );
}
