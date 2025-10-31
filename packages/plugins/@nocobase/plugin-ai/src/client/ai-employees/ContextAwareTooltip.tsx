/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { observer } from '@formily/react';
import { useT } from '../locale';
import { Tooltip, Avatar, Flex } from 'antd';
import { contextAware } from './stores/context-aware';
import { avatars } from './avatars';
import { useAIEmployeesData } from './hooks/useAIEmployeesData';
import { useToken } from '@nocobase/client';

export const ContextAwareTooltip: React.FC = observer(() => {
  const t = useT();
  const { aiEmployeesMap } = useAIEmployeesData();
  const { token } = useToken();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!contextAware.aiEmployees.length) {
      setShow(false);
      return;
    }
    setShow(true);
    const timer = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(timer);
  }, [contextAware.aiEmployees.length]);

  return show ? (
    <div
      style={{
        position: 'fixed',
        right: '8px',
        bottom: '108px',
        backgroundColor: token.colorPrimary,
        color: token.colorWhite,
        padding: '8px 6px',
        borderRadius: token.borderRadius,
        zIndex: 2000,
      }}
    >
      <Flex align="center" gap={8}>
        <Avatar.Group>
          {contextAware.aiEmployees.map(({ username }) => {
            const aiEmployee = aiEmployeesMap[username];
            return <Avatar src={avatars(aiEmployee?.avatar)} key={username} />;
          })}
        </Avatar.Group>
        <div>{t('Hi, let’s see how we can assist you.')}</div>
      </Flex>
    </div>
  ) : null;
});
