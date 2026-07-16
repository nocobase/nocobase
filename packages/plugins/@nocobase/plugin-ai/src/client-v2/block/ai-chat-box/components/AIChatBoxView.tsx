/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  FlowsFloatContextMenu,
  buildSubModelGroups,
  buildSubModelItem,
  observer,
  type FlowModelContext,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import { Empty, Button, Flex, Layout, Tooltip, theme, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { NAMESPACE, useT } from '../../../locale';
import { Messages } from '../../../ai-employees/chatbox/components/Messages';
import { useChat } from '../../../ai-employees/chatbox/hooks/useChat';
import { useChatBoxActions } from '../../../ai-employees/chatbox/hooks/useChatBoxActions';
import { useChatMessageActions } from '../../../ai-employees/chatbox/hooks/useChatMessageActions';
import { registerMountedChatBox } from '../../../ai-employees/chatbox/stores/mounted-chat-boxes';
import { useChatBoxRuntime } from '../../../ai-employees/chatbox/stores/runtime';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from '../AIChatBoxCoreModel';
import { getAIChatBoxSettings } from '../utils';
import { Conversations } from './Conversations';

const { Header } = Layout;

export const AI_CHAT_BOX_ACTION_MODEL_NAMES = ['JSActionModel', 'AIEmployeeActionModel'] as const;

const nestedChatBoxModelNames = new Set(['AIChatBoxBlockModel', 'AIChatDemoBlockModel']);

const compactHeaderClassName = css`
  .ant-btn {
    padding-inline: 4px;
  }

  .ant-btn-icon-only {
    width: 28px;
  }
`;

const headerActionsClassName = css`
  height: 100%;
  flex-shrink: 0;
`;

const headerActionItemsClassName = css`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  min-width: 0;

  > div {
    display: flex;
    align-items: center;
    height: 40px;
    line-height: normal;
  }
`;

const headerActionAddButtonClassName = css`
  align-self: center !important;
`;

const bodySubModelsClassName = css`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const bodySubModelItemClassName = css`
  flex: 0 0 auto;
  min-height: 0;
`;

const bodyCoreItemClassName = css`
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > div,
  > div > div,
  > div > div > div,
  > div > div > div > div {
    flex: 1 1 auto;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ant-layout {
    min-height: 0;
  }
`;

export const isAIChatBoxCoreModel = (model: FlowModel) => model instanceof AIChatBoxCoreModel;

export const filterNestedAIChatBoxBlockItems = (items: SubModelItem[]): SubModelItem[] => {
  return items
    .map((item) => {
      if (nestedChatBoxModelNames.has(String(item.key)) || nestedChatBoxModelNames.has(String(item.useModel))) {
        return undefined;
      }

      let children = item.children;
      if (Array.isArray(children)) {
        children = filterNestedAIChatBoxBlockItems(children);
      } else if (typeof children === 'function') {
        const childrenGetter = children as Exclude<SubModelItemsType, SubModelItem[]>;
        children = async (ctx: FlowModelContext) => {
          const resolvedChildren = await childrenGetter(ctx);
          return filterNestedAIChatBoxBlockItems(resolvedChildren);
        };
      }

      if (Array.isArray(children) && children.length === 0 && (item.type === 'group' || !item.createModelOptions)) {
        return undefined;
      }

      return {
        ...item,
        children,
      };
    })
    .filter((item): item is SubModelItem => !!item);
};

export const getAIChatBoxBodyBlockItems = async (ctx: FlowModelContext): Promise<SubModelItem[]> => {
  const items = await buildSubModelGroups(['DataBlockModel', 'FilterBlockModel', 'BlockModel'])(ctx);
  return filterNestedAIChatBoxBlockItems(items);
};

export const getAIChatBoxActionItems = async (ctx: FlowModelContext): Promise<SubModelItem[]> => {
  const items = await Promise.all(
    AI_CHAT_BOX_ACTION_MODEL_NAMES.map(async (modelName) => {
      const ModelClass = await ctx.engine.getModelClassAsync(modelName);
      if (!ModelClass) {
        return undefined;
      }
      const item = await buildSubModelItem(ModelClass, ctx);
      if (modelName === 'AIEmployeeActionModel' && item) {
        item.label = ctx.t('AI employee', { ns: NAMESPACE });
      }
      return item;
    }),
  );
  return items.filter((item): item is SubModelItem => !!item);
};

export const moveAddedBlockBeforeCore = async (model: AIChatBoxBlockModel, addedModel: FlowModel) => {
  const bodyBlocks = model.subModels.bodyBlocks || [];
  const coreBlock = bodyBlocks.find(isAIChatBoxCoreModel);
  if (!coreBlock || coreBlock.uid === addedModel.uid) {
    return;
  }
  await model.flowEngine.moveModel(addedModel.uid, coreBlock.uid, { persist: false });
};

export const getAIChatBoxViewHeight = (model: AIChatBoxBlockModel, fallbackHeight: number) => {
  const heightMode = model.decoratorProps?.heightMode;
  if (heightMode === 'specifyValue' || heightMode === 'fullHeight') {
    return '100%';
  }
  return fallbackHeight;
};

const ActionAddButton: React.FC<{
  model: AIChatBoxBlockModel;
}> = ({ model }) => {
  const t = useT();
  return (
    <AddSubModelButton model={model} subModelKey="actions" items={getAIChatBoxActionItems}>
      <FlowSettingsButton className={headerActionAddButtonClassName} icon={<SettingOutlined />}>
        {t('Actions')}
      </FlowSettingsButton>
    </AddSubModelButton>
  );
};

const BodyAddButton: React.FC<{
  model: AIChatBoxBlockModel;
}> = ({ model }) => {
  const t = useT();
  return (
    <AddSubModelButton
      model={model}
      subModelKey="bodyBlocks"
      items={getAIChatBoxBodyBlockItems}
      afterSubModelAdd={(addedModel) => moveAddedBlockBeforeCore(model, addedModel)}
    >
      <FlowSettingsButton icon={<PlusOutlined />}>{t('Add block')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};

const ActionRenderer: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const flowSettings = model.context.flowSettingsEnabled
    ? ({ showBackground: false, showBorder: false, toolbarPosition: 'above' } as const)
    : false;

  return (
    <>
      {model.mapSubModels('actions', (action) => (
        <Droppable model={action} key={action.uid}>
          <FlowModelRenderer
            model={action}
            showFlowSettings={flowSettings}
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
    </>
  );
});

const BodySlot: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const flowSettingsEnabled = !!model.context.flowSettingsEnabled;
  const flowSettings = flowSettingsEnabled
    ? ({ showBackground: false, showBorder: false, toolbarPosition: 'above' } as const)
    : false;
  const nodes = model.mapSubModels('bodyBlocks', (subModel) => {
    const isCore = isAIChatBoxCoreModel(subModel);
    const renderer =
      flowSettings && isCore ? (
        <FlowsFloatContextMenu
          model={subModel}
          showBackground={false}
          showBorder={false}
          toolbarPosition="inside"
          showDeleteButton={false}
          showCopyUidButton={false}
          showDynamicFlowsEditor={false}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        >
          <FlowModelRenderer model={subModel} showFlowSettings={false} />
        </FlowsFloatContextMenu>
      ) : (
        <FlowModelRenderer
          model={subModel}
          showFlowSettings={flowSettings}
          hideRemoveInSettings={isCore}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        />
      );
    const className = isCore ? bodyCoreItemClassName : bodySubModelItemClassName;

    return (
      <div key={subModel.uid} className={className}>
        <Droppable model={subModel}>{renderer}</Droppable>
      </div>
    );
  });

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DndProvider>
        {flowSettingsEnabled ? (
          <div style={{ padding: '10px 8px 6px', flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            <BodyAddButton model={model} />
          </div>
        ) : null}
        <div className={bodySubModelsClassName}>
          {nodes.length ? (
            nodes
          ) : (
            <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No chat blocks')} />
            </Flex>
          )}
        </div>
      </DndProvider>
    </div>
  );
});

const SidePanel: React.FC<{
  title: string;
  children?: React.ReactNode;
}> = ({ title, children }) => {
  const { token } = theme.useToken();
  if (children) {
    return (
      <Flex
        vertical
        style={{
          height: '100%',
          minHeight: 0,
          padding: `0 ${token.paddingSM}px`,
        }}
      >
        {children}
      </Flex>
    );
  }
  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{
        height: '100%',
        padding: token.paddingLG,
      }}
    >
      <Typography.Text type="secondary">{title}</Typography.Text>
    </Flex>
  );
};

export const AIChatBoxView: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const { token } = theme.useToken();
  const runtime = useChatBoxRuntime();
  const { clear, startNewConversation, triggerTask } = useChatBoxActions(runtime);
  const { syncContextAttachments } = useChatMessageActions(runtime);
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
  const [showConversations, setShowConversations] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const flowSettingsEnabled = !!model.context.flowSettingsEnabled;
  const settings = getAIChatBoxSettings(model.props);
  const minWidth = model.props.minWidth ?? 300;
  const height = getAIChatBoxViewHeight(model, settings.height);
  const conversationPanelWidth = 300;
  const messagesPanelWidth = 420;
  const headerHeight = 48;
  const isSidePanelOpen = showConversations || showMessagesPanel;
  const closeSidePanel = () => {
    setShowConversations(false);
    setShowMessagesPanel(false);
  };

  useEffect(() => {
    return registerMountedChatBox({
      uid: model.uid,
      runtime,
      triggerTask,
      clear,
      syncContextItems: (items) => {
        if (!items.length) {
          return;
        }
        chat.addContextItems(items);
        syncContextAttachments(items);
      },
    });
  }, [chat, clear, model.uid, runtime, syncContextAttachments, triggerTask]);

  return (
    <Layout
      style={{
        width: '100%',
        minWidth,
        height,
        minHeight: 420,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: token.colorBgContainer,
      }}
    >
      {isSidePanelOpen ? (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label={showConversations ? t('Close conversation list') : t('Messages')}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              cursor: 'pointer',
            }}
            onClick={closeSidePanel}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                closeSidePanel();
              }
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: showMessagesPanel ? undefined : 0,
              right: showMessagesPanel ? 0 : undefined,
              width: showMessagesPanel ? messagesPanelWidth : conversationPanelWidth,
              height: '100%',
              backgroundColor: token.colorBgContainer,
              zIndex: 11,
              borderLeft: showMessagesPanel ? `1px solid ${token.colorBorder}` : undefined,
              borderRight: showMessagesPanel ? undefined : `1px solid ${token.colorBorder}`,
              overflow: 'hidden',
            }}
          >
            <SidePanel title={showConversations ? t('Conversation list') : t('Messages')}>
              {showConversations ? <Conversations model={model} onOpen={closeSidePanel} /> : null}
              {showMessagesPanel ? <Messages /> : null}
            </SidePanel>
          </div>
        </>
      ) : null}
      <Layout
        style={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Header
          className={compactHeaderClassName}
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            height: headerHeight,
            flex: '0 0 auto',
            lineHeight: `${headerHeight}px`,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Flex align="center" gap={0}>
            <Tooltip title={t('Conversation list')}>
              <Button
                aria-label={t('Conversation list')}
                icon={showConversations ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                type="text"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowMessagesPanel(false);
                  setShowConversations(!showConversations);
                }}
              />
            </Tooltip>
          </Flex>
          <Flex className={headerActionsClassName} align="center" gap={6}>
            <div className={headerActionItemsClassName}>
              <DndProvider>
                <ActionRenderer model={model} />
              </DndProvider>
            </div>
            {flowSettingsEnabled ? <ActionAddButton model={model} /> : null}
            <Tooltip title={t('New conversation')}>
              <Button
                aria-label={t('New conversation')}
                icon={<PlusCircleOutlined />}
                type="text"
                onClick={(event) => {
                  event.stopPropagation();
                  startNewConversation();
                }}
              />
            </Tooltip>
            {settings.showMessages ? null : (
              <Tooltip title={t('Messages')}>
                <Button
                  aria-label={t('Messages')}
                  icon={<MessageOutlined />}
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowConversations(false);
                    setShowMessagesPanel(!showMessagesPanel);
                  }}
                />
              </Tooltip>
            )}
          </Flex>
        </Header>
        <BodySlot model={model} />
      </Layout>
    </Layout>
  );
});
