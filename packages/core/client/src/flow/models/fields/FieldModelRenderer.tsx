/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { FlowModelRenderer, FlowModelRendererProps } from '@nocobase/flow-engine';

const flowModelRendererPropKeys: (keyof FlowModelRendererProps)[] = [
  'model',
  'uid',
  'fallback',
  'key',
  'showFlowSettings',
  'flowSettingsVariant',
  'hideRemoveInSettings',
  'showTitle',
  'skipApplyAutoFlows',
  'inputArgs',
  'showErrorFallback',
  'settingsMenuLevel',
  'extraToolbarItems',
];

export function FieldModelRenderer(props: any) {
  const { model, ...rest } = props;

  const modelProps = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !flowModelRendererPropKeys.includes(key as keyof FlowModelRendererProps)),
  );
  useEffect(() => {
    console.log(modelProps);
    model.setProps(modelProps);
  }, [modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
