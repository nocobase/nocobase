/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { FloatButton, Avatar, Dropdown, Button, Divider } from 'antd';
import icon from '../icon.png';
import { css } from '@emotion/css';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { PauseCircleFilled, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { ShortcutList } from '../shortcuts/ShortcutList';

export const ChatButton: React.FC = () => {
  const { aiEmployees } = useAIEmployeesContext();

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();

  const { switchAIEmployee } = useChatBoxActions();

  const { stopSelect, selectable } = useAISelectionContext();
  const { token } = useToken();

  const items = useMemo(() => {
    return aiEmployees?.map((employee) => ({
      key: employee.username,
      label: (
        <AIEmployeeListItem
          aiEmployee={employee}
          onClick={() => {
            setOpen(true);
            switchAIEmployee(employee);
          }}
        />
      ),
    }));
  }, [aiEmployees]);
  if (!aiEmployees?.length) {
    return null;
  }
  return (
    <div
      className={css`
        z-index: 2000;
        display: flex;
        border-radius: 8px;
        gap: 8px;
        position: fixed;
        bottom: 48px;
        align-items: center;
        inset-inline-end: 8px;
        width: fit-content;
        height: 60px;
        padding: 4px;

        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      `}
    >
      <ShortcutList />
      {!selectable ? (
        <Dropdown menu={{ items }} placement="topRight">
          <Avatar
            src={icon}
            size={52}
            shape="square"
            onClick={() => {
              setOpen(!open);
            }}
          />
        </Dropdown>
      ) : (
        <Button
          icon={
            <PauseCircleFilled
              style={{
                color: token.colorErrorText,
              }}
            />
          }
          onClick={() => {
            stopSelect();
          }}
        />
      )}
    </div>
  );
};
