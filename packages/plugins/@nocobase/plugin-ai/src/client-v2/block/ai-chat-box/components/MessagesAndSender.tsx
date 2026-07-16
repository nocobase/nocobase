/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Typography, theme } from 'antd';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { Messages } from '../../../ai-employees/chatbox/components/Messages';
import { Sender } from '../../../ai-employees/chatbox/components/Sender';
import { useChatBoxActions } from '../../../ai-employees/chatbox/hooks/useChatBoxActions';
import { useChatBoxRuntime } from '../../../ai-employees/chatbox/stores/runtime';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { getAIChatBoxScope, getAIChatBoxSettings, getAIChatBoxWorkContext } from '../utils';

export const MessagesAndSender: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const { token } = theme.useToken();
  const runtime = useChatBoxRuntime();
  const { chatBoxModel } = runtime;
  const aiConfigRepository = useAIConfigRepository();
  const { switchAIEmployee } = useChatBoxActions(runtime);
  const settings = getAIChatBoxSettings(model.props);
  const defaultWorkContext = getAIChatBoxWorkContext(model);
  const scope = getAIChatBoxScope(model);
  const allowedAIEmployees = settings.allowedAIEmployees;
  const currentEmployee = chatBoxModel.currentEmployee;

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
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {settings.showMessages ? (
        <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Messages disableHorizontalScroll />
        </div>
      ) : null}
      <div
        style={{
          backgroundColor: 'transparent',
          padding: 0,
          flex: '0 0 auto',
          position: 'relative',
        }}
      >
        <Sender
          placeholder={settings.senderPlaceholder}
          showContextSelector={settings.showContextSelector}
          showUpload={settings.showUpload}
          showWebSearch={settings.showWebSearch}
          showEmployeeSelect={settings.showEmployeeSelect}
          showModelSelect={settings.showModelSelect}
          allowedAIEmployees={settings.allowedAIEmployees}
          allowedModels={settings.allowedModels}
          defaultSystemMessage={settings.systemPrompt}
          defaultUserMessage={settings.defaultUserMessage}
          defaultWorkContext={defaultWorkContext}
          scope={scope}
        />
        {settings.showDisclaimer ? (
          <Typography.Text
            type="secondary"
            style={{
              display: 'block',
              textAlign: 'center',
              margin: '10px 0',
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
            }}
          >
            {t('AI disclaimer')}
          </Typography.Text>
        ) : null}
      </div>
    </div>
  );
});
