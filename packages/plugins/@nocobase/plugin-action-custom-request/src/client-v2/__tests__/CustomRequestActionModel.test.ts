/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionSceneEnum } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { CustomRequestActionModel, registerCustomRequestActionGroups } from '../CustomRequestActionModel';
import { CUSTOM_REQUEST_ACTION_NAME } from '../customRequestFlowAction';

describe('CustomRequestActionModel', () => {
  it('exposes metadata and click flow settings', () => {
    const model = new CustomRequestActionModel({
      uid: 'custom-request-action',
      flowEngine: new FlowEngine(),
    } as never);
    const flow = model.getFlow('customRequestClickSettings');
    const confirmStep = flow?.getStep('confirm')?.serialize();
    const sendRequestStep = flow?.getStep('sendRequest')?.serialize();

    expect(CustomRequestActionModel.scene).toBe(ActionSceneEnum.all);
    expect(CustomRequestActionModel.meta).toMatchObject({
      sort: 5000,
      createModelOptions: {
        use: 'CustomRequestActionModel',
      },
    });
    expect(model.defaultProps).toHaveProperty('title');
    expect(flow?.serialize()).toMatchObject({
      key: 'customRequestClickSettings',
      on: 'click',
    });
    expect(confirmStep).toMatchObject({
      use: 'confirm',
      defaultParams: {
        enable: false,
      },
    });
    expect(sendRequestStep).toMatchObject({
      use: CUSTOM_REQUEST_ACTION_NAME,
    });
  });

  it('registers custom request actions into supported action groups', () => {
    const registerActionModels = vi.fn();
    const getModelClass = vi.fn((modelName: string) =>
      modelName === 'RecordActionGroupModel'
        ? undefined
        : {
            registerActionModels,
          },
    );

    registerCustomRequestActionGroups({
      getModelClass,
    });

    expect(getModelClass).toHaveBeenCalledTimes(4);
    expect(getModelClass).toHaveBeenCalledWith('CollectionActionGroupModel');
    expect(getModelClass).toHaveBeenCalledWith('RecordActionGroupModel');
    expect(getModelClass).toHaveBeenCalledWith('FormActionGroupModel');
    expect(getModelClass).toHaveBeenCalledWith('PopupSubTableFormActionGroupModel');
    expect(registerActionModels).toHaveBeenCalledTimes(3);
    expect(registerActionModels).toHaveBeenCalledWith({
      CustomRequestActionModel,
    });
  });
});
