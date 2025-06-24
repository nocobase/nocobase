/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { FloatButton, Avatar, Dropdown } from 'antd';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { useChatBoxContext } from './ChatBoxContext';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { PauseCircleFilled } from '@ant-design/icons';
import { useToken } from '@nocobase/client';

export const ChatButton: React.FC = () => {
  const { aiEmployees } = useAIEmployeesContext();
  const open = useChatBoxContext('open');
  const setOpen = useChatBoxContext('setOpen');
  const switchAIEmployee = useChatBoxContext('switchAIEmployee');
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
        .ant-float-btn {
          width: 40px;
        }
        .ant-float-btn .ant-float-btn-body .ant-float-btn-content {
          padding: 0;
        }
        .ant-float-btn .ant-float-btn-body .ant-float-btn-content .ant-float-btn-icon {
          width: 36px;
        }
      `}
    >
      {!selectable ? (
        <Dropdown menu={{ items }} placement="topRight">
          <FloatButton
            icon={
              <Avatar
                src={icon}
                size={36}
                style={{
                  marginBottom: '4px',
                }}
              />
            }
            onClick={() => {
              setOpen(!open);
            }}
            shape="square"
          />
        </Dropdown>
      ) : (
        <FloatButton
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
          shape="square"
        />
      )}
    </div>
  );
};
