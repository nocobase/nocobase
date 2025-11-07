/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowRuntimeContext, useFlowContext } from '@nocobase/flow-engine';
import { AICodingButton } from './AICodingButton';
import { CodeEditorExtension } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import _ from 'lodash';

export const setupAICoding = () => {
  CodeEditorExtension.registerRightExtra({
    name: 'ai-coding-button',
    extra: AICodingExtra,
  });
};

const AICodingExtra = (props) => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const uid = getUid(ctx, props.name);
  const scene = props.scene ?? 'unknown';
  return <AICodingButton {...props} uid={uid} scene={_.isArray(scene) ? scene[0] : scene} />;
};
const getUid = (context: FlowRuntimeContext, name: string) => {
  return `${context.model.uid}-${context.flowKey ?? uid()}-${context.currentStep ?? uid()}-${name}`;
};
