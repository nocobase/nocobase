/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CodeEditorExtension, type CodeEditorExtra } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import type { FlowRuntimeContext } from '@nocobase/flow-engine';

import { AICodingButton } from './AICodingButton';

export const setupAICoding = () => {
  CodeEditorExtension.registerRightExtra({
    name: 'ai-coding-button',
    extra: AICodingExtra,
  });
};

const AICodingExtra: CodeEditorExtra = (props) => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const fallbackFlowKey = React.useRef(randomId()).current;
  const fallbackStep = React.useRef(randomId()).current;
  const name = props.name ?? 'code';
  const scene = props.scene ?? 'unknown';
  const normalizedScene = Array.isArray(scene) ? scene[0] : scene;
  const uid = getUid(ctx, name, fallbackFlowKey, fallbackStep);

  return (
    <AICodingButton
      {...props}
      uid={uid}
      name={name}
      language={props.language ?? 'javascript'}
      scene={normalizedScene ?? 'unknown'}
      authoringSurfaceId={props.authoringSurfaceId}
    />
  );
};

const getUid = (context: FlowRuntimeContext, name: string, fallbackFlowKey: string, fallbackStep: string) => {
  return `${context.model.uid}-${context.flowKey ?? fallbackFlowKey}-${context.currentStep ?? fallbackStep}-${name}`;
};
