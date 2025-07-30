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
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { PauseCircleFilled, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { ShortcutList } from '../shortcuts/ShortcutList';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';

export const ChatButton: React.FC = () => {
  const { aiEmployees } = useAIEmployeesData();

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();

  const { switchAIEmployee } = useChatBoxActions();

  const { token } = useToken();

  const [folded, setFolded] = useState(false);

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
        z-index: 1050;
        display: flex;
        border-radius: 8px;
        gap: 8px;
        position: fixed;
        bottom: 42px;
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
      <>
        <Button
          variant="text"
          color="default"
          icon={!folded ? <RightOutlined /> : <LeftOutlined />}
          style={{
            height: '52px',
            width: '12px',
            fontSize: token.fontSizeSM,
          }}
          onClick={() => setFolded(!folded)}
        />
      </>

      {!folded && (
        <>
          <ShortcutList />
          <Divider
            type="vertical"
            style={{
              height: '50px',
            }}
          />
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
        </>
      )}
    </div>
  );
};
