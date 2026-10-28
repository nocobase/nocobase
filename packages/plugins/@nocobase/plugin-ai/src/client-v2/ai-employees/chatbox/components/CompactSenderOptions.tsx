/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Drawer, Flex, Typography } from 'antd';
import { DownOutlined, GlobalOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { AddContextButton } from '../../AddContextButton';
import { useChat } from '../hooks/useChat';
import { useChatBoxRuntime } from '../stores/runtime';
import { AIEmployeeSwitcher } from './AIEmployeeSwitcher';
import { getModelLabel, ModelSwitcher } from './ModelSwitcher';
import { SearchSwitch } from './SearchSwitch';
import type { SenderOptions } from './Sender';

const optionsDrawerClassName = css`
  .ant-btn-icon-only,
  .ant-drawer-close {
    min-width: 44px;
    min-height: 44px;
  }
`;

export const CompactSenderOptions: React.FC<{ options: SenderOptions }> = observer(({ options }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const runtime = useChatBoxRuntime();
  const { chatBoxModel, chatConversationModel } = runtime;
  const { currentEmployee, readonly, model } = chatBoxModel;
  const repository = useAIConfigRepository();
  const chat = useChat(chatConversationModel.currentConversation, runtime);
  const contextItems = chat.use.contextItems();
  const disabled = !currentEmployee || readonly;
  const showEmployee = options.showEmployeeSelect !== false;
  const showModel = options.showModelSelect !== false;
  const showContext = options.showContextSelector !== false;
  const showSearch = options.showWebSearch !== false;

  if (!showEmployee && !showModel && !showContext && !showSearch) {
    return null;
  }

  const summary = [
    showEmployee ? currentEmployee?.nickname || currentEmployee?.username : undefined,
    showModel ? getModelLabel(repository.llmServices, model) || t('No model available') : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Button
        className="ai-chat-sender-options"
        type="text"
        aria-label={t('Chat options')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        style={{
          flex: '1 1 0',
          minWidth: 0,
          height: 44,
          paddingInline: 0,
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 6,
        }}
      >
        {showSearch && chatConversationModel.webSearch ? <GlobalOutlined /> : null}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
          {summary || t('Chat options')}
        </span>
        <DownOutlined style={{ fontSize: 10, flexShrink: 0 }} />
      </Button>
      <Drawer
        className={optionsDrawerClassName}
        title={t('Chat options')}
        placement="bottom"
        height="auto"
        open={open}
        onClose={() => setOpen(false)}
        forceRender
        zIndex={1150}
        styles={{
          wrapper: { maxHeight: '85dvh' },
          content: { borderRadius: '16px 16px 0 0', maxHeight: '85dvh' },
          body: { padding: '8px 24px 24px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' },
        }}
      >
        <Flex vertical gap={20}>
          {showEmployee ? (
            <Flex vertical gap={8}>
              <Typography.Text type="secondary">{t('AI employee')}</Typography.Text>
              <AIEmployeeSwitcher block disabled={readonly} allowedUsernames={options.allowedAIEmployees} />
            </Flex>
          ) : null}
          {showModel ? (
            <Flex vertical gap={8}>
              <Typography.Text type="secondary">{t('Model')}</Typography.Text>
              <ModelSwitcher block disabled={disabled} allowedModelKeys={options.allowedModels} />
            </Flex>
          ) : null}
          {showContext || showSearch ? (
            <Flex vertical gap={12}>
              {showContext ? (
                <Flex align="center" justify="space-between">
                  <Typography.Text>{t('Work context')}</Typography.Text>
                  <AddContextButton
                    contextItems={contextItems}
                    onAdd={chat.addContextItems}
                    onRemove={chat.removeContextItem}
                    onSelect={() => setOpen(false)}
                    disabled={disabled}
                    ignore={(key) => key === 'flow-model.variable'}
                  />
                </Flex>
              ) : null}
              {showSearch ? (
                <Flex vertical gap={8}>
                  <Typography.Text type="secondary">{t('Web search')}</Typography.Text>
                  <SearchSwitch disabled={disabled} showLabel />
                </Flex>
              ) : null}
            </Flex>
          ) : null}
        </Flex>
      </Drawer>
    </>
  );
});
