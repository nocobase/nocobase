/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect } from 'react';
import { App, Modal, Select, theme } from 'antd';
import { observer } from '@nocobase/flow-engine';
import { toToolsMap, ToolsUIProperties, useApp } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatToolsStore } from '../stores/chat-tools';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useToolCallActions } from '../hooks/useToolCallActions';

const useDefaultOnOk = (_decisions: ToolsUIProperties['decisions'], _adjustArgs: Record<string, unknown>) => {
  return {
    onOk: async () => {},
  };
};

export const ToolModal: React.FC = observer(() => {
  const t = useT();
  const app = useApp();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const aiConfigRepository = useAIConfigRepository();
  const tools = aiConfigRepository.aiTools;
  const toolsMap = toToolsMap(tools);

  const currentConversation = useChatConversationsStore.use.currentConversation();
  useEffect(() => {
    aiConfigRepository.getAITools(currentConversation).catch(console.error);
  }, [aiConfigRepository, currentConversation]);

  const open = useChatToolsStore.use.openToolModal();
  const setOpen = useChatToolsStore.use.setOpenToolModal();
  const activeTool = useChatToolsStore.use.activeTool();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const activeMessageId = useChatToolsStore.use.activeMessageId();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const toolsByMessageId = useChatToolsStore.use.toolsByMessageId();
  const toolsByName = useChatToolsStore.use.toolsByName();
  const readonly = useChatBoxStore.use.readonly();

  const { updateToolArgs } = useChatMessageActions();

  const resolvedActiveTool =
    (activeMessageId && activeTool?.id ? toolsByMessageId[activeMessageId]?.[activeTool.id] : null) || activeTool;

  const toolOption = toolsMap.get(resolvedActiveTool?.name);
  const modal = toolOption?.ui?.modal;
  const useOnOk = modal?.useOnOk || useDefaultOnOk;
  const C = modal?.Component;
  const FooterComponent = modal?.footer;
  const modalProps = modal?.props;

  const adjustArgs = useChatToolsStore.use.adjustArgs();
  const { getDecisionActions } = useToolCallActions({ messageId: activeMessageId });
  const decisions = getDecisionActions(resolvedActiveTool);
  const { onOk } = useOnOk(decisions, adjustArgs);

  const toolCalls = toolsByName[resolvedActiveTool?.name] || [];
  const versions = toolCalls.map((tool, index) => ({
    key: tool.id,
    value: tool.id,
    label: `Version ${index + 1}`,
  }));

  const closeModal = useCallback(() => {
    setOpen(false);
    setActiveTool(null);
  }, [setActiveTool, setOpen]);

  const saveToolArgs = useCallback(
    async (args: unknown) => {
      if (!resolvedActiveTool || !currentConversation || !activeMessageId) {
        return;
      }
      await updateToolArgs({
        sessionId: currentConversation,
        messageId: activeMessageId,
        tool: {
          id: resolvedActiveTool.id,
          args,
        },
      });
      message.success(t('Saved successfully'));
      setActiveTool({
        ...resolvedActiveTool,
        args,
      });
    },
    [activeMessageId, currentConversation, message, resolvedActiveTool, setActiveTool, t, updateToolArgs],
  );

  return (
    <Modal
      title={
        <>
          {modal?.title ? t(modal.title) : ''}
          {versions.length > 1 ? (
            <Select
              options={versions}
              value={resolvedActiveTool?.id}
              style={{
                marginLeft: token.marginXS,
              }}
              onChange={(value) => {
                const toolCall = toolCalls.find((tool) => tool.id === value);
                setActiveMessageId(toolCall?.messageId || '');
                setActiveTool(toolCall);
              }}
            />
          ) : null}
        </>
      }
      open={open}
      width={modalProps?.width || '90%'}
      styles={modalProps?.styles}
      onCancel={closeModal}
      okText={modal?.okText ? t(modal.okText) : t('Submit')}
      onOk={async () => {
        await onOk?.();
        setOpen(false);
      }}
      okButtonProps={{
        disabled: !['init', 'interrupted', 'pending'].includes(resolvedActiveTool?.invokeStatus) || readonly,
      }}
      footer={
        FooterComponent && resolvedActiveTool ? (
          <FooterComponent tool={resolvedActiveTool} />
        ) : modal?.hideOkButton ? null : (
          (_, { OkBtn }) => (
            <>
              <OkBtn />
            </>
          )
        )
      }
    >
      {C && resolvedActiveTool ? <C tool={resolvedActiveTool} saveToolArgs={saveToolArgs} /> : null}
    </Modal>
  );
});

ToolModal.displayName = 'ToolModal';
