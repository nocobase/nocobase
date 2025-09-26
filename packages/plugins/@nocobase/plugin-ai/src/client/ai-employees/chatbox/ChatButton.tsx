/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FloatButton, Avatar, Dropdown, Button, Divider } from 'antd';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { PauseCircleFilled, RightOutlined, LeftOutlined, HolderOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { ShortcutList } from '../shortcuts/ShortcutList';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';
import { contextAware } from '../stores/context-aware';
import { observer } from '@nocobase/flow-engine';
import { useLocation } from 'react-router-dom';
import { useEventListener, useMemoizedFn } from 'ahooks';
import { isHide } from '../built-in/utils';

interface UseDragYOptions {
  initialTop?: number; // 初始 top
  minTop?: number; // 限制最小 top
  maxTop?: number; // 限制最大 top
}

export function useDragY(options: UseDragYOptions = {}) {
  const { initialTop = window.innerHeight - 120, minTop = 50, maxTop = window.innerHeight - 100 } = options;

  const [top, setTop] = useState(initialTop);
  const dragging = useRef(false);
  const offsetY = useRef(0);

  const onMouseDown = useMemoizedFn((e: React.MouseEvent) => {
    dragging.current = true;
    offsetY.current = e.clientY - top;
  });

  const onMouseMove = useMemoizedFn((e: MouseEvent) => {
    if (!dragging.current) return;
    let newTop = e.clientY - offsetY.current;
    newTop = Math.max(minTop, Math.min(maxTop, newTop));
    setTop(newTop);
  });

  const onMouseUp = useMemoizedFn(() => {
    dragging.current = false;
  });

  useEventListener('mousemove', onMouseMove);
  useEventListener('mouseup', onMouseUp);

  return { top, onMouseDown, dragging };
}

export const ChatButton: React.FC = observer(() => {
  const { aiEmployees } = useAIEmployeesData();

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();

  const { switchAIEmployee } = useChatBoxActions();

  const { token } = useToken();

  const [folded, setFolded] = useState(false);

  const showed = useRef(false);

  const location = useLocation();

  const { top, onMouseDown, dragging } = useDragY();

  useEffect(() => {
    showed.current = false;
  }, [location]);

  useEffect(() => {
    if (!contextAware.aiEmployees.length) {
      return;
    }

    if (!folded || showed.current) {
      return;
    }

    setFolded(false);
    showed.current = true;
    const timer = setTimeout(() => setFolded(true), 1500);
    return () => clearTimeout(timer);
  }, [contextAware.aiEmployees.length, folded]);

  const items = useMemo(() => {
    return aiEmployees
      ?.filter((employee) => !isHide(employee))
      .map((employee) => ({
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
        top: ${top}px;
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
          <Dropdown menu={{ items }} placement="topRight" disabled={dragging.current}>
            <Avatar
              src={icon}
              size={52}
              shape="square"
              onClick={() => {
                setOpen(!open);
              }}
            />
          </Dropdown>
          <Button
            variant="text"
            color="default"
            icon={<HolderOutlined />}
            style={{
              height: '52px',
              width: '12px',
              fontSize: token.fontSizeSM,
              cursor: 'grab',
            }}
            onMouseDown={onMouseDown}
          />
        </>
      )}
    </div>
  );
});
