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

  const handleChange = (e: any) => {
    let val;
    if (e && e.target && typeof e.target.value !== 'undefined') {
      val = e.target.value;
    } else if (typeof e === 'string' || typeof e === 'number' || (typeof e === 'object' && !(e instanceof Event))) {
      val = e;
    } else {
      val = '';
    }

    model.setProps({ value: val });
    if (!composingRef.current) {
      props.onChange?.(val);
    }
  };
  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    props.onChange(e);
  };

  const modelProps = {
    ..._.omit(rest, flowModelRendererPropKeys),
    onChange: handleChange,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
  };
  useEffect(() => {
    model && model.setProps(modelProps);
  }, [modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
