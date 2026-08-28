/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import {
  ChatBoxRuntimeProvider,
  createChatBoxRuntime,
  type ChatBoxRuntime,
} from '../../ai-employees/chatbox/stores/runtime';
import { tExpr } from '../../locale';
import { AIChatBoxView } from './components/AIChatBoxView';
import { registerAIChatBoxBlockSettings } from './settings';
import { renderAIChatBoxActions, renderAIChatBoxConfigureActions, renderAIChatBoxConfigureItems } from './sub-models';
import { getDefaultAIChatBoxSettings } from './utils';
import type { AIChatBoxBlockProps, AIChatBoxBlockStructure } from './types';

const getOrCreateBlockRuntime = (model: AIChatBoxBlockModel) => {
  model.chatBoxRuntime ??= createChatBoxRuntime({ mode: 'block' });
  return model.chatBoxRuntime;
};

export class AIChatBoxBlockModel extends BlockModel<AIChatBoxBlockStructure> {
  declare props: AIChatBoxBlockProps;
  chatBoxRuntime?: ChatBoxRuntime;

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    if (this.props.scope === undefined) {
      this.setProps({ scope: this.uid });
    }
  }

  renderComponent() {
    return (
      <ChatBoxRuntimeProvider runtime={getOrCreateBlockRuntime(this)}>
        <AIChatBoxView />
      </ChatBoxRuntimeProvider>
    );
  }

  renderActions() {
    return renderAIChatBoxActions(this);
  }

  renderConfigureActions() {
    return renderAIChatBoxConfigureActions(this);
  }

  renderConfigureItems() {
    return renderAIChatBoxConfigureItems(this);
  }
}

AIChatBoxBlockModel.define({
  label: tExpr('AI chat box'),
  sort: 359,
  createModelOptions: {
    use: 'AIChatBoxBlockModel',
    props: {
      ...getDefaultAIChatBoxSettings(),
    },
    subModels: {
      items: [
        {
          use: 'AIChatBoxCoreModel',
        },
      ],
      actions: [],
    },
  },
});

registerAIChatBoxBlockSettings(AIChatBoxBlockModel);
