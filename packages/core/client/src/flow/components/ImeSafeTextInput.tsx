/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

type TextLikeComponent = React.ComponentType<any>;
type TextLikeElement = HTMLInputElement | HTMLTextAreaElement;

const getEventValue = (event: any) => {
  if (typeof event === 'string') {
    return event;
  }

  const currentTarget = event?.currentTarget as TextLikeElement | null | undefined;
  if (currentTarget && typeof currentTarget.value !== 'undefined') {
    return currentTarget.value;
  }

  const target = event?.target as TextLikeElement | null | undefined;
  if (target && typeof target.value !== 'undefined') {
    return target.value;
  }

  return event ?? '';
};

export function ImeSafeTextInput(props: {
  component: TextLikeComponent;
  value?: any;
  onChange?: (event: any) => void;
  onCompositionStart?: (event: any) => void;
  onCompositionUpdate?: (event: any) => void;
  onCompositionEnd?: (event: any) => void;
  [key: string]: any;
}) {
  const {
    component: Component,
    value,
    onChange,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    ...rest
  } = props;
  const [innerValue, setInnerValue] = useState(value ?? '');
  const composingRef = useRef(false);
  const pendingLocalRef = useRef(false);
  const lastLocalValueRef = useRef(value ?? '');

  useEffect(() => {
    const externalValue = value ?? '';

    if (composingRef.current) {
      return;
    }

    if (pendingLocalRef.current) {
      if (Object.is(externalValue, lastLocalValueRef.current)) {
        pendingLocalRef.current = false;
      } else {
        return;
      }
    }

    setInnerValue((prev) => (Object.is(prev, externalValue) ? prev : externalValue));
  }, [value]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
      const nextValue = getEventValue(event);
      lastLocalValueRef.current = nextValue;
      pendingLocalRef.current = true;
      setInnerValue(nextValue);

      const isComposing = composingRef.current || !!event?.nativeEvent?.isComposing;
      if (isComposing) {
        return;
      }

      onChange?.(event);
    },
    [onChange],
  );

  const handleCompositionStart = useCallback(
    (event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composingRef.current = true;
      onCompositionStart?.(event);
    },
    [onCompositionStart],
  );

  const handleCompositionUpdate = useCallback(
    (event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composingRef.current = true;
      onCompositionUpdate?.(event);
    },
    [onCompositionUpdate],
  );

  const handleCompositionEnd = useCallback(
    (event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composingRef.current = false;
      const nextValue = getEventValue(event) ?? lastLocalValueRef.current ?? '';
      lastLocalValueRef.current = nextValue;
      pendingLocalRef.current = true;
      setInnerValue(nextValue);
      onCompositionEnd?.(event);
    },
    [onCompositionEnd],
  );

  return (
    <Component
      {...rest}
      value={innerValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionUpdate={handleCompositionUpdate}
      onCompositionEnd={handleCompositionEnd}
    />
  );
}
