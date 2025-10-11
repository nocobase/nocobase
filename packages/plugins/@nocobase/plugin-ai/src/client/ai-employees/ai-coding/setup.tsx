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
import {
  CodeEditorExtension,
  JSBlockModel,
  JSCollectionActionModel,
  JSColumnModel,
  JSFieldModel,
  JSFormActionModel,
  JSItemModel,
  JSRecordActionModel,
} from '@nocobase/client';
import { uid } from '@nocobase/utils/client';

export const setupAICoding = () => {
  CodeEditorExtension.registerRightExtra({
    name: 'ai-coding-button',
    extra: AICodingExtra,
  });
};

const AICodingExtra = (props) => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const uid = getUid(ctx, props.name);
  const scene = props.scene ?? getScene(ctx);
  return <AICodingButton {...props} uid={uid} scene={scene} />;
};
const getUid = (context: FlowRuntimeContext, name: string) => {
  return `${context.model.uid}-${context.flowKey ?? uid()}-${context.currentStep ?? uid()}-${name}`;
};

const getScene = (context: FlowRuntimeContext) => {
  const flowModel = context.model;
  if (flowModel instanceof JSBlockModel) {
    return 'JSBlockModel';
  } else if (flowModel instanceof JSItemModel) {
    return 'JSItemModel';
  } else if (flowModel instanceof JSFieldModel) {
    return 'JSFieldModel';
  } else if (flowModel instanceof JSColumnModel) {
    return 'JSColumnModel';
  } else if (flowModel instanceof JSFormActionModel) {
    return 'JSFormActionModel';
  } else if (flowModel instanceof JSRecordActionModel) {
    return 'JSRecordActionModel';
  } else if (flowModel instanceof JSCollectionActionModel) {
    return 'JSCollectionActionModel';
  } else {
    return 'unknown';
  }
};
