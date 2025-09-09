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
  'skipApplyAutoFlows',
  'inputArgs',
  'showErrorFallback',
  'settingsMenuLevel',
  'extraToolbarItems',
];

export function FieldModelRenderer(props: any) {
  const { model, ...rest } = props;
  const modelProps = _.omit(rest, flowModelRendererPropKeys);

  useEffect(() => {
    model.setProps(modelProps);
  }, [model, modelProps]);

  return <FlowModelRenderer model={model} {...rest} />;
}
