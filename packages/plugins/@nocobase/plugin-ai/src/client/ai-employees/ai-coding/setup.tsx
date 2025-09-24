/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel, FlowRuntimeContext } from '@nocobase/flow-engine';
import { AICodingButton } from './AICodingButton';
import {
  JSBlockModel,
  JSCollectionActionModel,
  JSColumnModel,
  JSFieldModel,
  JSFormActionModel,
  JSItemModel,
  JSRecordActionModel,
} from '@nocobase/client';

export const setupAICoding = () => {
  FlowModel.registerFlow({
    key: 'AIEmployeeHandleInjectableRending',
    on: 'InjectableRending',
    steps: {
      injectAIEmployeeShortcut: {
        handler(ctx) {
          const settingContext = ctx.inputArgs.ctx;
          const name = ctx.inputArgs.name ?? 'code';
          const language = ctx.inputArgs.language ?? 'javascript';
          const setProps = ctx.inputArgs.setProps;

          setProps((prev) => ({
            ...prev,
            rightExtra: [
              (editorRef) => {
                const props = {
                  uid: getUid(settingContext, name),
                  scene: getScene(settingContext),
                  language,
                  editorRef,
                };
                return <AICodingButton {...props} />;
              },
            ],
          }));
        },
      },
    },
  });
};

const getUid = (context: FlowRuntimeContext, name: string) =>
  `${context.model.uid}-${context.flowKey}-${context.currentStep}-${name}`;

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
