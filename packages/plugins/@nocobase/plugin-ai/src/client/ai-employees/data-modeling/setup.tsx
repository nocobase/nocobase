/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginDataSourceManagerClient } from '@nocobase/plugin-data-source-manager/client';
import PluginAIClient from '../..';
import React, { useMemo, useState } from 'react';
import { Avatar, Button, Popover } from 'antd';
import { ProfileCard } from '../ProfileCard';
import { avatars } from '../avatars';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatBoxActions } from '../chatbox/hooks/useChatBoxActions';
import { isDataModelingAssistant } from '../built-in/utils';
import { useRequest } from '@nocobase/client';
import { AIEmployee } from '../types';

export const setupDataModeling = (plugin: PluginAIClient) => {
  const dataSourceManager = plugin.pm.get<PluginDataSourceManagerClient>('data-source-manager');
  dataSourceManager.extensionManager.registerManagerAction({
    component: AIButton,
  });
};

const AIButton = () => {
  const [focus, setFocus] = useState(false);
  const aiConfigRepository = useAIConfigRepository();
  const { data: aiEmployees = [] } = useRequest<AIEmployee[]>(async () => {
    return aiConfigRepository.getAIEmployees();
  });
  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { switchAIEmployee } = useChatBoxActions();

  const aiEmployee = aiEmployees.filter((e) => isDataModelingAssistant(e))[0];

  const currentAvatar = useMemo(() => {
    const avatar = aiEmployee?.avatar;
    if (!avatar) {
      return null;
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

  return aiEmployee ? (
    <Popover content={<ProfileCard aiEmployee={aiEmployee} />}>
      <Avatar
        src={currentAvatar}
        size={32}
        shape="circle"
        style={{
          cursor: 'pointer',
          border: '1px solid #eee',
        }}
        onClick={() => {
          if (!open) {
            setOpen(true);
            switchAIEmployee(aiEmployee);
          } else {
            if (currentEmployee?.username !== aiEmployee.username) {
              switchAIEmployee(aiEmployee);
            }
          }
        }}
        // @ts-ignore
        onMouseEnter={() => {
          setFocus(true);
        }}
        onMouseLeave={() => setFocus(false)}
      />
    </Popover>
  ) : null;
};
