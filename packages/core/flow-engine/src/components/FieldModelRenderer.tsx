/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelRendererProps } from './FlowModelRenderer';
import { FlowModelRenderer } from './FlowModelRenderer';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

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
  const { model, onChange, ...rest } = props;
  const composingRef = useRef(false);

  const handleChange = useCallback(
    (e: any) => {
      let val;
      if (e && e.target && typeof e.target.value !== 'undefined') {
        val = e.target.value;
      } else if (
        typeof e === 'string' ||
        typeof e === 'number' ||
        typeof e === 'boolean' ||
        (typeof e === 'object' && !(e instanceof Event))
      ) {
        val = e;
      } else {
        val = null;
      }

      const isComposing = composingRef.current || e?.nativeEvent?.isComposing;
      if (isComposing) {
        return;
      }

      model.setProps({ value: val });
      if (!composingRef.current) {
        onChange?.(val);
      }
    },
    [model, onChange],
  );
  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>, flag = true) => {
      composingRef.current = false;
      if (flag) {
        handleChange(e);
      }
    },
    [handleChange],
  );

  const modelProps = useMemo(
    () => ({
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      ..._.omit(rest, flowModelRendererPropKeys),
      onChange: handleChange,
    }),
    [handleChange, handleCompositionEnd, handleCompositionStart, rest],
  );
  useEffect(() => {
    model && model.setProps(modelProps);
  }, [model, modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
