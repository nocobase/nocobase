/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState, useRef, useCallback, useLayoutEffect } from 'react';

export const useVariableInput = (value: any) => {
  const inputRef = useRef<any>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const prevValueRef = useRef(value);

  // 焦点管理
  useLayoutEffect(() => {
    const valueChanged = prevValueRef.current !== value;
    prevValueRef.current = value;

    if (valueChanged && hasFocus && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, hasFocus]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>, originalOnFocus?: any) => {
    setHasFocus(true);
    originalOnFocus?.(e);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>, originalOnBlur?: any) => {
    setHasFocus(false);
    originalOnBlur?.(e);
  }, []);

  return {
    inputRef,
    handleFocus,
    handleBlur,
  };
};
