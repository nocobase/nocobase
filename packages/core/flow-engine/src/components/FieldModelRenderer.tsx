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
import React, { useEffect } from 'react';

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

  // IME (Korean / Chinese / Japanese) composition handling:
  // - Do not branch on composition state. rc-input already tracks its own
  //   composition ref internally and handles composition-specific concerns
  //   (e.g. skipping max-length truncation while composing).
  // - Important: invoke `props.onChange(val)` on every change event, including
  //   during composition. If form state stays stale while the DOM is composing,
  //   React's controlled-input updateWrapper overwrites the DOM with the stale
  //   `props.value` on the next commit (it runs `node.value = props.value`
  //   whenever `node.value !== props.value`), which cancels the in-progress
  //   IME composition and turns syllables into separate jamo. Formily v1's
  //   Input forwards onChange on every keystroke the same way and works with
  //   Korean / Chinese / Japanese input correctly.
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
    props.onChange?.(val);
  };

  const modelProps = {
    ..._.omit(rest, flowModelRendererPropKeys),
    onChange: handleChange,
  };
  useEffect(() => {
    model && model.setProps(modelProps);
  }, [modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
