/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Modal, Select } from 'antd';
import { useChatToolsStore } from '../stores/chat-tools';
import { usePlugin } from '@nocobase/client';
import PluginAIClient from '../../..';
import { ToolCall } from '../../types';
import { Schema } from '@formily/react';
import { useT } from '../../../locale';
import { useChatMessageActions } from '../hooks/useChatMessageActions';

const useDefaultOnOk = () => {
  return {
    onOk: async () => {},
  };
};

export const ToolModal: React.FC = () => {
  const t = useT();
  const plugin = usePlugin('ai') as PluginAIClient;

  const open = useChatToolsStore.use.openToolModal();
  const setOpen = useChatToolsStore.use.setOpenToolModal();
  const activeTool = useChatToolsStore.use.activeTool();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const toolsByName = useChatToolsStore.use.toolsByName();

  const toolOption = plugin.aiManager.tools.get(activeTool?.name);
  const modal = toolOption?.ui?.modal;
  const useOnOk = toolOption?.ui?.modal?.useOnOk || useDefaultOnOk;
  const C = modal?.Component;

  const { onOk } = useOnOk();

  const tools = toolsByName[activeTool?.name] || [];
  const versions = tools.map((tool, index) => {
    return {
      key: tool.id,
      value: tool.id,
      label: `Version ${index + 1}`,
    };
  });

  return (
    <Modal
      title={
        <>
          {modal?.title ? Schema.compile(modal.title, { t }) : ''}
          {versions.length > 1 && (
            <Select
              options={versions}
              value={activeTool?.id}
              style={{
                marginLeft: '8px',
              }}
              onChange={(value) => {
                const tool = tools.find((tool) => tool.id === value);
                setActiveMessageId(tool?.messageId || '');
                setActiveTool(tool);
              }}
            />
          )}
        </>
      }
      open={open}
      width="90%"
      onCancel={() => {
        setOpen(false);
        setActiveTool(null);
      }}
      okText={modal?.okText ? Schema.compile(modal.okText, { t }) : t('Submit')}
      onOk={async () => {
        await onOk?.();
        setOpen(false);
      }}
    >
      {C ? <C tool={activeTool} /> : null}
    </Modal>
  );
};
