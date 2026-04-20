/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect } from 'react';
import { Modal, Select, message } from 'antd';
import { useChatToolsStore } from '../stores/chat-tools';
import { ToolsUIProperties, toToolsMap } from '@nocobase/client';
import { Schema } from '@formily/react';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useToolCallActions } from '../hooks/useToolCallActions';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
const useDefaultOnOk = (decisions: ToolsUIProperties['decisions']) => {
  return {
    onOk: async () => {},
  };
};

export const ToolModal: React.FC = observer(() => {
  const t = useT();
  const aiConfigRepository = useAIConfigRepository();
  const tools = aiConfigRepository.aiTools;
  const toolsMap = toToolsMap(tools);

  useEffect(() => {
    aiConfigRepository.getAITools();
  }, [aiConfigRepository]);

  const open = useChatToolsStore.use.openToolModal();
  const setOpen = useChatToolsStore.use.setOpenToolModal();
  const activeTool = useChatToolsStore.use.activeTool();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const activeMessageId = useChatToolsStore.use.activeMessageId();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const toolsByMessageId = useChatToolsStore.use.toolsByMessageId();
  const toolsByName = useChatToolsStore.use.toolsByName();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const { updateToolArgs, messagesService } = useChatMessageActions();

  const resolvedActiveTool =
    (activeMessageId && activeTool?.id ? toolsByMessageId[activeMessageId]?.[activeTool.id] : null) || activeTool;

  const toolOption = toolsMap.get(resolvedActiveTool?.name);
  const modal = toolOption?.ui?.modal;
  const useOnOk = toolOption?.ui?.modal?.useOnOk || useDefaultOnOk;
  const C = modal?.Component;
  const FooterComponent = modal?.footer;
  const modalProps = modal?.props;

  const adjustArgs = useChatToolsStore.use.adjustArgs();
  const { getDecisionActions } = useToolCallActions({ messageId: activeMessageId });
  const decisions = getDecisionActions(resolvedActiveTool);
  const { onOk } = useOnOk(decisions, adjustArgs);

  const toolCalls = toolsByName[resolvedActiveTool?.name] || [];
  const versions = toolCalls.map((tool, index) => {
    return {
      key: tool.id,
      value: tool.id,
      label: `Version ${index + 1}`,
    };
  });

  const saveToolArgs = useCallback(
    async (args: Record<string, any>) => {
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
      // messagesService.run(currentConversation);
    },
    [activeMessageId, currentConversation, resolvedActiveTool, setActiveTool, t, updateToolArgs],
  );

  return (
    <Modal
      title={
        <>
          {modal?.title ? Schema.compile(modal.title, { t }) : ''}
          {versions.length > 1 && (
            <Select
              options={versions}
              value={resolvedActiveTool?.id}
              style={{
                marginLeft: '8px',
              }}
              onChange={(value) => {
                const toolCall = toolCalls.find((tool) => tool.id === value);
                setActiveMessageId(toolCall?.messageId || '');
                setActiveTool(toolCall);
              }}
            />
          )}
        </>
      }
      open={open}
      width={modalProps?.width || '90%'}
      styles={modalProps?.styles}
      onCancel={() => {
        setOpen(false);
        setActiveTool(null);
      }}
      okText={modal?.okText ? Schema.compile(modal.okText, { t }) : t('Submit')}
      onOk={async () => {
        await onOk?.();
        setOpen(false);
      }}
      okButtonProps={{
        disabled: !['init', 'interrupted', 'pending'].includes(resolvedActiveTool?.invokeStatus),
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
