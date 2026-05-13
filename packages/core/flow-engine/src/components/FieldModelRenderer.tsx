/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, FlowModelRendererProps } from '@nocobase/flow-engine';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';

const flowModelRendererPropKeys: (keyof FlowModelRendererProps)[] = [
  'model',
  'uid',
  'fallback',
  'key',
  'showFlowSettings',
  'flowSettingsVariant',
  'hideRemoveInSettings',
  'showTitle',
  'inputArgs',
  'showErrorFallback',
  'settingsMenuLevel',
  'extraToolbarItems',
];

export function FieldModelRenderer(props: any) {
  const { model, ...rest } = props;
  const composingRef = useRef(false);
  const pendingValueRef = useRef<any>(undefined);
  const lastEmittedValueRef = useRef<any>(Symbol('unset'));

  const resolveValueFromChange = (e: any) => {
    if (e && e.target && typeof e.target.value !== 'undefined') {
      return e.target.value;
    }
    if (
      typeof e === 'string' ||
      typeof e === 'number' ||
      typeof e === 'boolean' ||
      (typeof e === 'object' && !(e instanceof Event))
    ) {
      return e;
    }
    return null;
  };

  const handleChange = (e: any) => {
    const val = resolveValueFromChange(e);
    pendingValueRef.current = val;

    model.setProps({ value: val });
    const nativeIsComposing = !!e?.nativeEvent?.isComposing;
    const isComposing = composingRef.current || nativeIsComposing;
    if (isComposing) return;
    if (Object.is(lastEmittedValueRef.current, val)) return;
    lastEmittedValueRef.current = val;
    props.onChange?.(val);
  };
  const handleCompositionStart = () => {
    composingRef.current = true;
  };
  const handleCompositionUpdate = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, flag = true) => {
    composingRef.current = false;
    if (!flag) return;
    // Ensure the final value is propagated as a value (not a raw event),
    // and keep consistency with `handleChange` behavior.
    const val = resolveValueFromChange(e) ?? pendingValueRef.current;
    pendingValueRef.current = val;
    model.setProps({ value: val });
    if (Object.is(lastEmittedValueRef.current, val)) return;
    lastEmittedValueRef.current = val;
    props.onChange?.(val);
  };

  const modelProps = {
    onCompositionStart: handleCompositionStart,
    onCompositionUpdate: handleCompositionUpdate,
    onCompositionEnd: handleCompositionEnd,
    ..._.omit(rest, flowModelRendererPropKeys),
    onChange: handleChange,
  };
  useEffect(() => {
    model && model.setProps(modelProps);
  }, [modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
