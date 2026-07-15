/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { type ComponentType, useMemo, useState } from 'react';
import { Avatar, Button, Popover } from 'antd';
import { useRequest } from 'ahooks';

import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { avatars } from '../avatars';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { getGlobalChatBoxRuntime } from '../chatbox/stores/runtime';
import { AIEmployeeProfileCard } from '../ProfileCard';
import type { AIEmployee } from '../types';
import { observer } from '@nocobase/flow-engine';

type DataSourceManagerExtension = {
  registerManagerAction(options: { order?: number; component: ComponentType }): void;
};

type DataSourceManagerPlugin = {
  extensionManager: DataSourceManagerExtension;
};

type PluginWithDataSourceManager = {
  pm: {
    get<T>(name: string): T;
  };
};

const isBuiltIn = (aiEmployee: AIEmployee) => {
  return aiEmployee?.builtIn && aiEmployee?.deprecated !== true;
};

const isDataModelingAssistant = (aiEmployee: AIEmployee) => {
  return isBuiltIn(aiEmployee) && aiEmployee.username === 'orin';
};

export const setupDataModeling = (plugin: PluginWithDataSourceManager) => {
  const dataSourceManager = plugin.pm.get<DataSourceManagerPlugin>('data-source-manager');
  dataSourceManager.extensionManager.registerManagerAction({
    component: AIButton,
  });
};

const AIButton = observer(() => {
  const [focus, setFocus] = useState(false);
  const aiConfigRepository = useAIConfigRepository();
  const { data: aiEmployees = [] } = useRequest<AIEmployee[], []>(async () => {
    return aiConfigRepository.getAIEmployees();
  });
  const runtime = getGlobalChatBoxRuntime();
  const { chatBoxModel } = runtime;
  const open = chatBoxModel.open;
  const chat = useChat(undefined, runtime);
  const currentEmployee = chatBoxModel.currentEmployee;
  const { switchAIEmployee } = useChatBoxActions(runtime);

  const aiEmployee = aiEmployees.find((e) => isDataModelingAssistant(e));

  const currentAvatar = useMemo(() => {
    const avatar = aiEmployee?.avatar;
    if (!avatar) {
      return undefined;
    }
    if (focus) {
      return avatars(avatar, {
        flip: true,
      });
    }
    return avatars(avatar, {
      mouth: undefined,
    });
  }, [aiEmployee, focus]);

  if (!aiEmployee) {
    return null;
  }

  const handleClick = () => {
    chatBoxModel.setReadonly(false);
    chat.setResponseLoading(false);
    if (!open) {
      chatBoxModel.setOpen(true);
      switchAIEmployee(aiEmployee);
      return;
    }
    if (currentEmployee?.username !== aiEmployee.username) {
      switchAIEmployee(aiEmployee);
    }
  };

  return (
    <Popover content={<AIEmployeeProfileCard aiEmployee={aiEmployee} />}>
      <Button
        type="text"
        shape="circle"
        aria-label={aiEmployee.nickname || aiEmployee.username}
        icon={<Avatar src={currentAvatar} shape="circle" />}
        onClick={handleClick}
        onMouseEnter={() => setFocus(true)}
        onMouseLeave={() => setFocus(false)}
      />
    </Popover>
  );
});
