/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ActionGroupModel, ActionModel } from '@nocobase/client-v2';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  buildSubModelItems,
  type FlowModelContext,
  type ModelConstructor,
  type SubModelItem,
} from '@nocobase/flow-engine';
import { tExpr } from '../../locale';
import type { AIChatBoxBlockModel } from './AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from './AIChatBoxCoreModel';

export const AI_CHAT_BOX_ACTION_MODEL_NAMES = ['JSActionModel', 'AIEmployeeActionModel'] as const;
export const AI_CHAT_BOX_ITEM_MODEL_NAMES = ['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel'] as const;

export const isAIChatBoxCoreModel = (model: FlowModel) => model instanceof AIChatBoxCoreModel;

export class AIChatBoxItemGroupModel extends FlowModel {
  static async defineChildren(ctx: FlowModelContext): Promise<SubModelItem[]> {
    const items = await Promise.all(
      AI_CHAT_BOX_ITEM_MODEL_NAMES.map(async (modelName) => {
        const ModelClass = (await ctx.engine.getModelClassAsync(modelName)) as ModelConstructor | undefined;
        return ModelClass ? buildSubModelItems(ModelClass)(ctx) : [];
      }),
    );
    return items.flat();
  }
}

AIChatBoxItemGroupModel.define({
  hide: true,
  label: tExpr('AI chat box'),
});

export class AIChatBoxActionGroupModel extends ActionGroupModel {
  static baseClass = ActionModel;

  static async defineChildren(ctx: FlowModelContext): Promise<SubModelItem[]> {
    await Promise.all(AI_CHAT_BOX_ACTION_MODEL_NAMES.map((modelName) => ctx.engine.getModelClassAsync(modelName)));

    const allowedModelNames = new Set<string>(AI_CHAT_BOX_ACTION_MODEL_NAMES);
    const items = await super.defineChildren(ctx);
    return items.filter((item) => allowedModelNames.has(item.useModel || item.key));
  }
}

AIChatBoxActionGroupModel.define({
  label: tExpr('AI chat box'),
});

export const moveAddedItemBeforeCore = async (model: AIChatBoxBlockModel, addedModel: FlowModel) => {
  const items = model.subModels.items || [];
  const coreBlock = items.find(isAIChatBoxCoreModel);
  if (!coreBlock || coreBlock.uid === addedModel.uid) {
    return;
  }
  await model.flowEngine.moveModel(addedModel.uid, coreBlock.uid, { persist: false });
};

export const renderAIChatBoxActions = (model: AIChatBoxBlockModel) => {
  return (
    <DndProvider>
      {model.mapSubModels('actions', (action) => (
        <Droppable model={action} key={action.uid}>
          <FlowModelRenderer
            model={action}
            showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
            hideRemoveInSettings={false}
            extraToolbarItems={[
              {
                key: 'drag-handler',
                component: DragHandler,
                sort: 1,
              },
            ]}
          />
        </Droppable>
      ))}
    </DndProvider>
  );
};

export const renderAIChatBoxConfigureActions = (model: AIChatBoxBlockModel) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey="actions"
      subModelBaseClass={model.getModelClassName('AIChatBoxActionGroupModel')}
    >
      <FlowSettingsButton
        className={css`
          align-self: center !important;
        `}
        icon={<SettingOutlined />}
      >
        {model.translate('Actions')}
      </FlowSettingsButton>
    </AddSubModelButton>
  );
};

export const renderAIChatBoxConfigureItems = (model: AIChatBoxBlockModel) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey="items"
      subModelBaseClass={model.getModelClassName('AIChatBoxItemGroupModel')}
      afterSubModelAdd={(addedModel) => moveAddedItemBeforeCore(model, addedModel)}
    >
      <FlowSettingsButton icon={<PlusOutlined />}>{model.translate('Add block')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};
