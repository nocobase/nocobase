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
import { FlowModelRenderer, observer } from '@nocobase/flow-engine';
import { Empty, Flex, Layout, theme } from 'antd';
import {
  ChatBoxRuntimeProvider,
  createChatBoxRuntime,
  type ChatBoxRuntime,
} from '../../ai-employees/chatbox/stores/runtime';
import { tExpr, useT } from '../../locale';
import { AIChatBoxCoreModel } from './AIChatBoxCoreModel';
import { getDefaultAIChatBoxSettings } from './utils';
import type { AIChatBoxBlockProps, AIChatBoxBlockStructure } from './types';

const getOrCreateBlockRuntime = (model: AIChatBoxBlockModel) => {
  model.chatBoxRuntime ??= createChatBoxRuntime({ mode: 'block' });
  return model.chatBoxRuntime;
};

const AIChatBoxBlockView: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const { token } = theme.useToken();
  const minWidth = model.props.minWidth ?? 300;
  const bodyBlocks = model.mapSubModels('bodyBlocks', (subModel) => (
    <FlowModelRenderer
      key={subModel.uid}
      model={subModel}
      showFlowSettings={false}
      hideRemoveInSettings={subModel instanceof AIChatBoxCoreModel}
    />
  ));

  return (
    <Layout
      style={{
        width: '100%',
        minWidth,
        minHeight: 420,
        overflow: 'hidden',
        backgroundColor: token.colorBgContainer,
      }}
    >
      {bodyBlocks.length ? (
        <Flex vertical style={{ flex: 1, minHeight: 0 }}>
          {bodyBlocks}
        </Flex>
      ) : (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No chat blocks')} />
        </Flex>
      )}
    </Layout>
  );
});

export class AIChatBoxBlockModel extends BlockModel<AIChatBoxBlockStructure> {
  declare props: AIChatBoxBlockProps;
  chatBoxRuntime?: ChatBoxRuntime;

  renderComponent() {
    return (
      <ChatBoxRuntimeProvider runtime={getOrCreateBlockRuntime(this)}>
        <AIChatBoxBlockView model={this} />
      </ChatBoxRuntimeProvider>
    );
  }
}

AIChatBoxBlockModel.define({
  label: tExpr('AI chat box'),
  sort: 359,
  createModelOptions: {
    use: 'AIChatBoxBlockModel',
    props: {
      minWidth: 300,
      ...getDefaultAIChatBoxSettings(),
    },
    subModels: {
      bodyBlocks: [
        {
          use: 'AIChatBoxCoreModel',
        },
      ],
      actions: [],
    },
  },
});
