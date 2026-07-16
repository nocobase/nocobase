/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Bubble, Conversations as AntConversations, Sender as AntSender } from '@ant-design/x';
import { css, injectGlobal } from '@emotion/css';
import { App as AntdApp, Button, Empty, Flex, Input, Layout, Space, Tooltip, Typography, theme } from 'antd';
import {
  AppstoreAddOutlined,
  CheckOutlined,
  CopyOutlined,
  EditOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { BlockModel, ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  FlowsFloatContextMenu,
  buildSubModelItem,
  buildSubModelGroups,
  observer,
  type FlowModelContext,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd';
import { AIEmployeeSwitcher } from '../ai-employees/chatbox/components/AIEmployeeSwitcher';
import { useChatBoxActions } from '../ai-employees/chatbox/hooks/useChatBoxActions';
import {
  ChatBoxRuntimeProvider,
  createChatBoxRuntime,
  type ChatBoxRuntime,
  useChatBoxRuntime,
} from '../ai-employees/chatbox/stores/runtime';
import { ModelSwitcher } from '../ai-employees/chatbox/components/ModelSwitcher';
import type { AIEmployee, ContextItem } from '../ai-employees/types';
import type { LLMServiceItem } from '../repositories/AIConfigRepository';
import { useAIConfigRepository } from '../repositories/hooks/useAIConfigRepository';
import { NAMESPACE, tExpr, useT } from '../locale';
import { WorkContext } from '../models/ai-employees/AIEmployeeShortcutModel';

const { Header } = Layout;
const defaultChatBoxScope = '';

injectGlobal`
  .nb-toolbar-container .nb-toolbar-container-icons .ant-space-item:empty {
    display: none;
  }
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

const bodyMessageListItemClassName = css`
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;

  > div,
  > div > div,
  > div > div > div {
    height: 100%;
    min-height: 0;
  }
`;

const isMessagesAndSenderBlockModel = (model: FlowModel) =>
  ['AIChatDemoMessagesAndSenderBlockModel', 'AIChatDemoChatContentBlockModel'].includes(model.constructor.name);

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

type AIChatDemoBlockStructure = {
  subModels: {
    bodyBlocks: FlowModel[];
    drawerBlocks: FlowModel[];
    actions: ActionModel[];
  };
};

type AIChatDemoBlockProps = {
  height?: number;
  minWidth?: number;
  showNewAction?: boolean;
  scope?: string;
  systemPrompt?: string;
  defaultUserMessage?: string;
  allowedAIEmployees?: string[];
  allowedModels?: string[];
  selectedBlocks?: ContextItem[];
  showMessages?: boolean;
  showContextSelector?: boolean;
  showUpload?: boolean;
  showWebSearch?: boolean;
  showEmployeeSelect?: boolean;
  showModelSelect?: boolean;
  showDisclaimer?: boolean;
  senderPlaceholder?: string;
};

type AIChatDemoChatBoxSettings = Pick<
  AIChatDemoBlockProps,
  | 'scope'
  | 'systemPrompt'
  | 'defaultUserMessage'
  | 'allowedAIEmployees'
  | 'allowedModels'
  | 'selectedBlocks'
  | 'showMessages'
  | 'showContextSelector'
  | 'showUpload'
  | 'showWebSearch'
  | 'showEmployeeSelect'
  | 'showModelSelect'
  | 'showDisclaimer'
  | 'senderPlaceholder'
>;

type AIChatDemoFlowContext = FlowModelContext & {
  aiConfigRepository?: {
    getAIEmployees: () => Promise<AIEmployee[]>;
    getLLMServices: () => Promise<LLMServiceItem[]>;
  };
};

type SettingsSectionProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
};

type ChatBoxRuntimeOwner = {
  chatBoxRuntime?: ChatBoxRuntime;
};

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    {title ? (
      <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
        {title}
      </Typography.Text>
    ) : null}
    <div>{children}</div>
  </div>
);

const getDefaultChatBoxSettings = (): Required<AIChatDemoChatBoxSettings> => ({
  scope: defaultChatBoxScope,
  systemPrompt: '',
  defaultUserMessage: '',
  allowedAIEmployees: [],
  allowedModels: [],
  selectedBlocks: [],
  showMessages: true,
  showContextSelector: true,
  showUpload: true,
  showWebSearch: true,
  showEmployeeSelect: true,
  showModelSelect: true,
  showDisclaimer: true,
  senderPlaceholder: 'Enter your question',
});

const isContextItem = (value: unknown): value is ContextItem => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as Partial<ContextItem>).type === 'string' &&
    typeof (value as Partial<ContextItem>).uid === 'string'
  );
};

const getChatBoxSettings = (props: AIChatDemoBlockProps): Required<AIChatDemoChatBoxSettings> => {
  const settings = {
    ...getDefaultChatBoxSettings(),
    ...props,
  };

  return {
    ...settings,
    selectedBlocks: Array.isArray(settings.selectedBlocks) ? settings.selectedBlocks.filter(isContextItem) : [],
  };
};

const getChatBoxScope = (model: AIChatDemoBlockModel) => getChatBoxSettings(model.props).scope || model.uid;

type DemoMessage = {
  key: string;
  role: 'assistant' | 'user';
  content: string;
};

const defaultMessages: DemoMessage[] = [
  {
    key: 'assistant-1',
    role: 'assistant',
    content: 'I can help summarize records, draft replies, and prepare workflow actions.',
  },
  {
    key: 'user-1',
    role: 'user',
    content: 'Show the recent customer follow-up plan.',
  },
  {
    key: 'assistant-2',
    role: 'assistant',
    content: 'Here is a draft plan: prioritize overdue accounts, prepare reminders, and schedule owner reviews.',
  },
];

const filterAIChatDemoBlockItems = (items: SubModelItem[]): SubModelItem[] => {
  return items
    .map((item) => {
      if (item.key === 'AIChatDemoBlockModel' || item.useModel === 'AIChatDemoBlockModel') {
        return undefined;
      }

      let children = item.children;
      if (Array.isArray(children)) {
        children = filterAIChatDemoBlockItems(children);
      } else if (typeof children === 'function') {
        const childrenGetter = children as Exclude<SubModelItemsType, SubModelItem[]>;
        children = async (ctx: FlowModelContext) => {
          const resolvedChildren = await childrenGetter(ctx);
          return filterAIChatDemoBlockItems(resolvedChildren);
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

const getBodyBlockItems = async (ctx: FlowModelContext): Promise<SubModelItem[]> => {
  const items = await buildSubModelGroups(['DataBlockModel', 'FilterBlockModel', 'BlockModel'])(ctx);
  return filterAIChatDemoBlockItems(items);
};

const getActionItems = async (ctx: FlowModelContext): Promise<SubModelItem[]> => {
  const actionModelNames = ['JSActionModel', 'AIEmployeeActionModel'];
  const items = await Promise.all(
    actionModelNames.map(async (modelName) => {
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

const getAIEmployeeOptions = async (ctx: AIChatDemoFlowContext) => {
  const employees = (await ctx.aiConfigRepository?.getAIEmployees()) || [];
  return employees
    .filter((employee) => employee.category === 'business' && employee.deprecated !== true)
    .map((employee) => ({
      label: employee.nickname || employee.username,
      value: employee.username,
    }));
};

const getModelOptions = async (ctx: AIChatDemoFlowContext) => {
  const services = (await ctx.aiConfigRepository?.getLLMServices()) || [];
  return services.flatMap((service) =>
    service.enabledModels.map((model) => ({
      label: `${service.llmServiceTitle} / ${model.label}`,
      value: `${service.llmService}:${model.value}`,
    })),
  );
};

const SlotAddButton: React.FC<{
  model: FlowModel;
  subModelKey: string;
  items: (ctx: FlowModelContext) => Promise<SubModelItem[]>;
  title: string;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
}> = ({ model, subModelKey, items, title, afterSubModelAdd }) => (
  <AddSubModelButton model={model} subModelKey={subModelKey} items={items} afterSubModelAdd={afterSubModelAdd}>
    <FlowSettingsButton icon={<PlusOutlined />}>{title}</FlowSettingsButton>
  </AddSubModelButton>
);

const ActionAddButton: React.FC<{
  model: FlowModel;
}> = ({ model }) => {
  const t = useT();
  return (
    <AddSubModelButton model={model} subModelKey="actions" items={getActionItems}>
      <FlowSettingsButton className={headerActionAddButtonClassName} icon={<SettingOutlined />}>
        {t('Actions')}
      </FlowSettingsButton>
    </AddSubModelButton>
  );
};

const RenderSubModels: React.FC<{
  model: AIChatDemoBlockModel;
  subModelKey: keyof AIChatDemoBlockStructure['subModels'];
  empty?: React.ReactNode;
  itemClassName?: (subModel: FlowModel) => string | undefined;
}> = observer(({ model, subModelKey, empty, itemClassName }) => {
  const flowSettings = model.context.flowSettingsEnabled
    ? ({ showBackground: false, showBorder: false, toolbarPosition: 'above' } as const)
    : false;
  const nodes = model.mapSubModels(subModelKey, (subModel) => {
    const isMessagesAndSenderBlock = isMessagesAndSenderBlockModel(subModel);
    const subModelFlowSettings = flowSettings
      ? {
          ...flowSettings,
          showDynamicFlowsEditor: isMessagesAndSenderBlock ? false : flowSettings.showDynamicFlowsEditor,
        }
      : false;
    const renderer =
      flowSettings && isMessagesAndSenderBlock ? (
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
          showFlowSettings={subModelFlowSettings}
          hideRemoveInSettings={isMessagesAndSenderBlock}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        />
      );
    const node = (
      <Droppable model={subModel} key={subModel.uid}>
        {renderer}
      </Droppable>
    );
    const className = itemClassName?.(subModel);

    return className ? (
      <div key={subModel.uid} className={className}>
        {node}
      </div>
    ) : (
      node
    );
  });

  if (!nodes.length) {
    return <>{empty}</>;
  }

  return <>{nodes}</>;
});

const DemoActionRenderer: React.FC<{
  model: AIChatDemoBlockModel;
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

const AIChatDemoBlockView: React.FC<{
  model: AIChatDemoBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const { token } = theme.useToken();
  const [showConversations, setShowConversations] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const flowSettingsEnabled = !!model.context.flowSettingsEnabled;
  const props = model.props;
  const settings = getChatBoxSettings(props);
  const height = props.height ?? 620;
  const minWidth = props.minWidth ?? 300;
  const conversationPanelWidth = 300;
  const messagesPanelWidth = 420;
  const isSidePanelOpen = showConversations || showMessagesPanel;
  const closeSidePanel = () => {
    setShowConversations(false);
    setShowMessagesPanel(false);
  };
  const headerHeight = 48;

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
            {showConversations ? (
              <AIChatDemoDrawerSlot model={model} />
            ) : (
              <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
                <AIChatDemoMessages />
              </div>
            )}
          </div>
        </>
      ) : null}
      <Layout style={{ minHeight: 0 }}>
        <Header
          className={compactHeaderClassName}
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            height: headerHeight,
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
                <DemoActionRenderer model={model} />
              </DndProvider>
            </div>
            {flowSettingsEnabled ? <ActionAddButton model={model} /> : null}
            {props.showNewAction !== false ? (
              <Tooltip title={t('New conversation')}>
                <Button aria-label={t('New conversation')} icon={<PlusCircleOutlined />} type="text" />
              </Tooltip>
            ) : null}
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
        <AIChatDemoBodySlot model={model} />
      </Layout>
    </Layout>
  );
});

const AIChatDemoBodySlot: React.FC<{
  model: AIChatDemoBlockModel;
}> = ({ model }) => {
  const t = useT();
  const flowSettingsEnabled = !!model.context.flowSettingsEnabled;
  const moveAddedBlockBeforeMessagesAndSender = async (addedModel: FlowModel) => {
    const bodyBlocks = model.subModels.bodyBlocks || [];
    const messagesAndSenderBlock = bodyBlocks.find(isMessagesAndSenderBlockModel);
    if (!messagesAndSenderBlock || messagesAndSenderBlock.uid === addedModel.uid) {
      return;
    }
    await model.flowEngine.moveModel(addedModel.uid, messagesAndSenderBlock.uid, { persist: false });
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <DndProvider>
        {flowSettingsEnabled ? (
          <div style={{ padding: '10px 8px 6px', flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            <SlotAddButton
              model={model}
              subModelKey="bodyBlocks"
              items={getBodyBlockItems}
              title={t('Add block')}
              afterSubModelAdd={moveAddedBlockBeforeMessagesAndSender}
            />
          </div>
        ) : null}
        <div className={bodySubModelsClassName}>
          <RenderSubModels
            model={model}
            subModelKey="bodyBlocks"
            itemClassName={(subModel) =>
              ['AIChatDemoMessagesAndSenderBlockModel', 'AIChatDemoChatContentBlockModel'].includes(
                subModel.constructor.name,
              )
                ? bodyMessageListItemClassName
                : bodySubModelItemClassName
            }
            empty={
              <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No chat blocks')} />
              </Flex>
            }
          />
        </div>
      </DndProvider>
    </div>
  );
};

const AIChatDemoDrawerSlot: React.FC<{
  model: AIChatDemoBlockModel;
}> = ({ model }) => <AIChatDemoConversations scope={getChatBoxScope(model)} />;

const getOrCreateDemoRuntime = (model: ChatBoxRuntimeOwner) => {
  model.chatBoxRuntime ??= createChatBoxRuntime();
  return model.chatBoxRuntime;
};

export class AIChatDemoBlockModel extends BlockModel<AIChatDemoBlockStructure> {
  declare props: AIChatDemoBlockProps;
  chatBoxRuntime?: ChatBoxRuntime;

  renderComponent() {
    return (
      <ChatBoxRuntimeProvider runtime={getOrCreateDemoRuntime(this)}>
        <AIChatDemoBlockView model={this} />
      </ChatBoxRuntimeProvider>
    );
  }
}

AIChatDemoBlockModel.define({
  label: tExpr('AI chat box'),
  sort: 360,
  createModelOptions: {
    use: 'AIChatDemoBlockModel',
    props: {
      height: 620,
      showNewAction: true,
      ...getDefaultChatBoxSettings(),
    },
    subModels: {
      bodyBlocks: [
        {
          use: 'AIChatDemoMessagesAndSenderBlockModel',
        },
      ],
    },
  },
});

AIChatDemoBlockModel.registerFlow({
  key: 'aiChatDemoBlockSettings',
  title: tExpr('AI chat box settings'),
  on: 'beforeRender',
  steps: {
    editChatBox: {
      title: tExpr('Edit chat box'),
      uiMode() {
        return {
          type: 'dialog' as const,
          props: {
            width: 720,
          },
        };
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        const model = ctx.model as AIChatDemoBlockModel;
        return {
          ...getChatBoxSettings(model.props),
          scope: getChatBoxScope(model),
        };
      },
      uiSchema: async (ctx: AIChatDemoFlowContext) => {
        const [aiEmployeeOptions, modelOptions] = await Promise.all([getAIEmployeeOptions(ctx), getModelOptions(ctx)]);

        return {
          basic: {
            type: 'void',
            'x-component': SettingsSection,
            properties: {
              scope: {
                type: 'string',
                title: tExpr('Scope'),
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              systemPrompt: {
                type: 'string',
                title: tExpr('Background'),
                'x-decorator': 'FormItem',
                'x-component': 'FlowSettingsVariableTextArea',
              },
              defaultUserMessage: {
                type: 'string',
                title: tExpr('Default user message'),
                'x-decorator': 'FormItem',
                'x-component': 'FlowSettingsVariableTextArea',
              },
              selectedBlocks: {
                type: 'array',
                title: tExpr('Work context'),
                'x-decorator': 'FormItem',
                'x-component': WorkContext,
              },
              allowedAIEmployees: {
                type: 'array',
                title: tExpr('AI employees'),
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': {
                  mode: 'multiple',
                  allowClear: true,
                  options: aiEmployeeOptions,
                },
              },
              allowedModels: {
                type: 'array',
                title: tExpr('Models'),
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': {
                  mode: 'multiple',
                  allowClear: true,
                  options: modelOptions,
                },
              },
            },
          },
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Required<AIChatDemoChatBoxSettings>) {
        ctx.model.setProps({
          scope: params.scope || ctx.model.uid,
          systemPrompt: params.systemPrompt,
          defaultUserMessage: params.defaultUserMessage,
          allowedAIEmployees: params.allowedAIEmployees || [],
          allowedModels: params.allowedModels || [],
          selectedBlocks: params.selectedBlocks || [],
        });
      },
    },
    showMessages: {
      title: tExpr('Show messages'),
      uiMode: {
        type: 'switch',
        key: 'showMessages',
      },
      uiSchema: {
        showMessages: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showMessages: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showMessages,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showMessages'>) {
        ctx.model.setProps({
          showMessages: params.showMessages !== false,
        });
      },
    },
    senderPlaceholder: {
      title: tExpr('Sender placeholder'),
      uiMode() {
        return {
          type: 'dialog' as const,
          props: {
            width: 520,
          },
        };
      },
      uiSchema: {
        senderPlaceholder: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          senderPlaceholder: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).senderPlaceholder,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'senderPlaceholder'>) {
        ctx.model.setProps({
          senderPlaceholder: params.senderPlaceholder || 'Enter your question',
        });
      },
    },
    showContextSelector: {
      title: tExpr('Enable add context'),
      uiMode: {
        type: 'switch',
        key: 'showContextSelector',
      },
      uiSchema: {
        showContextSelector: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showContextSelector: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showContextSelector,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showContextSelector'>) {
        ctx.model.setProps({
          showContextSelector: params.showContextSelector !== false,
        });
      },
    },
    showUpload: {
      title: tExpr('Enable upload files'),
      uiMode: {
        type: 'switch',
        key: 'showUpload',
      },
      uiSchema: {
        showUpload: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showUpload: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showUpload,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showUpload'>) {
        ctx.model.setProps({
          showUpload: params.showUpload !== false,
        });
      },
    },
    showWebSearch: {
      title: tExpr('Enable web search'),
      uiMode: {
        type: 'switch',
        key: 'showWebSearch',
      },
      uiSchema: {
        showWebSearch: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showWebSearch: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showWebSearch,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showWebSearch'>) {
        ctx.model.setProps({
          showWebSearch: params.showWebSearch !== false,
        });
      },
    },
    showEmployeeSelect: {
      title: tExpr('Enable employee select'),
      uiMode: {
        type: 'switch',
        key: 'showEmployeeSelect',
      },
      uiSchema: {
        showEmployeeSelect: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showEmployeeSelect: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showEmployeeSelect,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showEmployeeSelect'>) {
        ctx.model.setProps({
          showEmployeeSelect: params.showEmployeeSelect !== false,
        });
      },
    },
    showModelSelect: {
      title: tExpr('Enable model select'),
      uiMode: {
        type: 'switch',
        key: 'showModelSelect',
      },
      uiSchema: {
        showModelSelect: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showModelSelect: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showModelSelect,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showModelSelect'>) {
        ctx.model.setProps({
          showModelSelect: params.showModelSelect !== false,
        });
      },
    },
    showDisclaimer: {
      title: tExpr('Show disclaimer'),
      uiMode: {
        type: 'switch',
        key: 'showDisclaimer',
      },
      uiSchema: {
        showDisclaimer: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx: AIChatDemoFlowContext) {
        return {
          showDisclaimer: getChatBoxSettings((ctx.model as AIChatDemoBlockModel).props).showDisclaimer,
        };
      },
      handler(ctx: AIChatDemoFlowContext, params: Pick<Required<AIChatDemoChatBoxSettings>, 'showDisclaimer'>) {
        ctx.model.setProps({
          showDisclaimer: params.showDisclaimer !== false,
        });
      },
    },
  },
});

export class AIChatDemoMessagesAndSenderBlockModel extends FlowModel {
  render() {
    return (
      <AIChatDemoMessagesAndSender
        settings={getChatBoxSettings((this.parent as AIChatDemoBlockModel | undefined)?.props || {})}
      />
    );
  }
}

AIChatDemoMessagesAndSenderBlockModel.define({
  label: tExpr('Messages and sender block'),
  hide: true,
});

export class AIChatDemoChatContentBlockModel extends FlowModel {
  render() {
    return (
      <AIChatDemoMessagesAndSender
        settings={getChatBoxSettings((this.parent as AIChatDemoBlockModel | undefined)?.props || {})}
      />
    );
  }
}

AIChatDemoChatContentBlockModel.define({
  label: tExpr('Messages and sender block'),
  hide: true,
});

const AIChatDemoMessagesAndSender: React.FC<{
  settings: Required<AIChatDemoChatBoxSettings>;
}> = ({ settings }) => {
  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {settings.showMessages ? (
        <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
          <AIChatDemoMessages />
        </div>
      ) : null}
      <AIChatDemoSender settings={settings} />
    </div>
  );
};

export class AIChatDemoMessageListBlockModel extends FlowModel {
  render() {
    return <AIChatDemoMessages />;
  }
}

AIChatDemoMessageListBlockModel.define({
  label: tExpr('Message list block'),
  hide: true,
});

const AIChatDemoMessages: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();
  const [messages, setMessages] = useState(defaultMessages);

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        overflow: 'auto',
        position: 'relative',
        padding: '8px 0 16px',
      }}
    >
      {messages.length ? (
        messages.map((message) => (
          <AIChatDemoMessageBubble
            key={message.key}
            message={message}
            onSave={(content) => {
              setMessages((items) =>
                items.map((item) =>
                  item.key === message.key ? { ...item, content: content.trim() || item.content } : item,
                ),
              );
            }}
          />
        ))
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: token.colorTextDescription,
          }}
        >
          {t('Work with your AI crew')}
        </div>
      )}
    </div>
  );
};

const messageFooterWeakStyle: React.CSSProperties = {
  marginTop: 4,
  display: 'flex',
};

const AIChatDemoMessageBubble: React.FC<{
  message: DemoMessage;
  onSave: (content: string) => void;
}> = ({ message: demoMessage, onSave }) => {
  const t = useT();
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(demoMessage.content);
  const footerButtonStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    height: token.controlHeightSM,
    padding: `0 ${token.paddingXS}px`,
  };
  const footerIconStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  };
  const copy = () => {
    navigator.clipboard
      ?.writeText(demoMessage.content)
      .then(() => {
        message.success(t('Copied'));
      })
      .catch(() => {
        message.error(t('Request failed'));
      });
  };

  if (demoMessage.role === 'user') {
    return (
      <Bubble
        placement="end"
        variant="borderless"
        styles={{
          content: {
            maxWidth: '80%',
            margin: '0 8px 8px 0',
          },
        }}
        content={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {editing ? (
              <Input.TextArea
                value={editingValue}
                autoSize={{ minRows: 2, maxRows: 6 }}
                onChange={(event) => {
                  setEditingValue(event.target.value);
                }}
              />
            ) : (
              <Bubble
                content={demoMessage.content}
                styles={{
                  content: {
                    whiteSpace: 'pre-wrap',
                  },
                }}
              />
            )}
            <div style={messageFooterWeakStyle}>
              <Space>
                {editing ? (
                  <Button
                    aria-label={t('Save')}
                    color="default"
                    variant="text"
                    size="small"
                    style={footerButtonStyle}
                    icon={<CheckOutlined style={footerIconStyle} />}
                    onClick={() => {
                      onSave(editingValue);
                      setEditing(false);
                    }}
                  />
                ) : (
                  <Button
                    aria-label={t('Edit')}
                    color="default"
                    variant="text"
                    size="small"
                    style={footerButtonStyle}
                    icon={<EditOutlined style={footerIconStyle} />}
                    onClick={() => {
                      setEditingValue(demoMessage.content);
                      setEditing(true);
                    }}
                  />
                )}
                <Button
                  aria-label={t('Copy')}
                  color="default"
                  variant="text"
                  size="small"
                  style={footerButtonStyle}
                  icon={<CopyOutlined style={footerIconStyle} />}
                  onClick={copy}
                />
              </Space>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <Bubble
      placement="start"
      variant="borderless"
      styles={{
        content: {
          width: '95%',
          margin: '8px 16px',
          marginInlineEnd: 16,
          minHeight: 0,
        },
      }}
      content={
        <div>
          <Bubble
            variant="borderless"
            styles={{
              content: {
                width: '100%',
                minHeight: 0,
                whiteSpace: 'pre-wrap',
              },
            }}
            content={demoMessage.content}
          />
          <div style={messageFooterWeakStyle}>
            <Button
              aria-label={t('Copy')}
              color="default"
              variant="text"
              size="small"
              style={footerButtonStyle}
              icon={<CopyOutlined style={footerIconStyle} />}
              onClick={copy}
            />
          </div>
        </div>
      }
    />
  );
};

export class AIChatDemoSenderBlockModel extends FlowModel {
  chatBoxRuntime?: ChatBoxRuntime;

  render() {
    return (
      <ChatBoxRuntimeProvider runtime={getOrCreateDemoRuntime(this)}>
        <AIChatDemoSender settings={getDefaultChatBoxSettings()} />
      </ChatBoxRuntimeProvider>
    );
  }
}

AIChatDemoSenderBlockModel.define({
  label: tExpr('Message sender block'),
  hide: true,
});

const AIChatDemoSender: React.FC<{
  settings: Required<AIChatDemoChatBoxSettings>;
}> = observer(({ settings }) => {
  const t = useT();
  const { message } = AntdApp.useApp();
  const [value, setValue] = useState('');
  const runtime = useChatBoxRuntime();
  const { chatBoxModel } = runtime;
  const currentEmployee = chatBoxModel.currentEmployee;
  const aiConfigRepository = useAIConfigRepository();
  const { switchAIEmployee } = useChatBoxActions(runtime);
  const allowedAIEmployees = settings.allowedAIEmployees;
  const allowedModels = settings.allowedModels;

  useEffect(() => {
    if (currentEmployee && (!allowedAIEmployees.length || allowedAIEmployees.includes(currentEmployee.username))) {
      return;
    }
    aiConfigRepository
      .getAIEmployees()
      .then((employees) => {
        const availableEmployees = allowedAIEmployees.length
          ? employees.filter((employee) => allowedAIEmployees.includes(employee.username))
          : employees;
        const targetEmployee =
          availableEmployees.find((employee) => employee.username === 'atlas') || availableEmployees[0];
        if (targetEmployee && chatBoxModel.currentEmployee?.username !== targetEmployee.username) {
          switchAIEmployee(targetEmployee, {
            clear: {
              sender: false,
              attachments: false,
              contextItems: false,
            },
          });
        }
      })
      .catch(console.error);
  }, [aiConfigRepository, allowedAIEmployees, chatBoxModel, currentEmployee, switchAIEmployee]);

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <div style={{ margin: '4px 8px' }}>
        <AntSender
          value={value}
          onChange={setValue}
          placeholder={settings.senderPlaceholder ? t(settings.senderPlaceholder) : t('Enter your question')}
          autoSize={{ minRows: 2, maxRows: 8 }}
          actions={false}
          footer={({ components }) => {
            const { SendButton } = components;
            return (
              <Flex justify="space-between" align="center">
                <Flex gap="middle" align="center">
                  {settings.showContextSelector ? (
                    <Tooltip title={t('Add context')} arrow={false}>
                      <Button type="text" icon={<AppstoreAddOutlined />} />
                    </Tooltip>
                  ) : null}
                  {settings.showUpload ? (
                    <Tooltip title={t('Upload files')} arrow={false}>
                      <Button type="text" icon={<PaperClipOutlined />} />
                    </Tooltip>
                  ) : null}
                  {settings.showWebSearch ? (
                    <Tooltip title={t('Enable search')} arrow={false}>
                      <Button type="text" icon={<GlobalOutlined />} />
                    </Tooltip>
                  ) : null}
                  {settings.showEmployeeSelect ? <AIEmployeeSwitcher allowedUsernames={allowedAIEmployees} /> : null}
                  {settings.showModelSelect ? <ModelSwitcher allowedModelKeys={allowedModels} /> : null}
                </Flex>
                <SendButton
                  type="primary"
                  disabled={false}
                  onClick={() => {
                    message.success(t('Mock message sent'));
                    setValue('');
                  }}
                />
              </Flex>
            );
          }}
        />
      </div>
      {settings.showDisclaimer ? (
        <Typography.Text
          type="secondary"
          style={{
            display: 'block',
            textAlign: 'center',
            margin: '2px 0',
            fontSize: 12,
          }}
        >
          {t('AI disclaimer')}
        </Typography.Text>
      ) : null}
    </div>
  );
});

export class AIChatDemoConversationListBlockModel extends FlowModel {
  render() {
    return <AIChatDemoConversations />;
  }
}

AIChatDemoConversationListBlockModel.define({
  label: tExpr('Conversation list block'),
  hide: true,
});

const AIChatDemoConversations: React.FC<{
  scope?: string;
}> = ({ scope = defaultChatBoxScope }) => {
  const t = useT();
  const [keyword, setKeyword] = useState('');
  const [activeKey, setActiveKey] = useState('demo-2');
  const items = [
    {
      key: 'demo-1',
      scope: defaultChatBoxScope,
      label: t('Customer follow-up'),
      title: t('Customer follow-up'),
      timestamp: Date.now() - 3600 * 1000,
    },
    {
      key: 'demo-2',
      scope: defaultChatBoxScope,
      label: t('Sales report draft'),
      title: t('Sales report draft'),
      timestamp: Date.now() - 600 * 1000,
    },
    {
      key: 'demo-3',
      scope: 'demo-secondary-scope',
      label: t('Proposal outline'),
      title: t('Proposal outline'),
      timestamp: Date.now() - 24 * 3600 * 1000,
    },
  ].filter((item) => item.scope === scope && item.label.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          flexShrink: 0,
        }}
      >
        <Input.Search value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t('Search')} />
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {items.length ? (
          <AntConversations
            activeKey={activeKey}
            items={items}
            onActiveChange={(key) => {
              setActiveKey(key);
            }}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

class AIChatDemoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  enableEditType = false;
  enableEditDanger = false;
  enableEditIconOnly = false;

  defaultProps: ButtonProps = {
    type: 'text',
  };
}

export class AIChatDemoNewActionModel extends AIChatDemoActionModel {
  defaultProps: ButtonProps = {
    type: 'text',
    icon: 'PlusCircleOutlined',
    title: tExpr('New conversation'),
    children: tExpr('New conversation'),
  };
}

AIChatDemoNewActionModel.define({
  label: tExpr('New conversation'),
  hide: true,
});

AIChatDemoNewActionModel.registerFlow({
  key: 'aiChatDemoNewAction',
  title: tExpr('New conversation'),
  on: 'click',
  steps: {
    mock: {
      handler(ctx) {
        ctx.message?.success(ctx.t('Mock new conversation created', { ns: NAMESPACE }));
      },
    },
  },
});
