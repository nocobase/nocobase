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

    model.setProps({ value: val });
    if (!composingRef.current) {
      props.onChange?.(val);
    }
  };
  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, flag = true) => {
    composingRef.current = false;
    if (flag) {
      props.onChange(e);
    }
  };

  const modelProps = {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    ..._.omit(rest, flowModelRendererPropKeys),
    onChange: handleChange,
  };
  useEffect(() => {
    model && model.setProps(modelProps);
  }, [modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
