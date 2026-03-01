/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { observer } from '@nocobase/flow-engine';
import { notification, Flex, Button, theme } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { aiSelection } from './stores/ai-selection';
import { dialogController } from './stores/dialog-controller';
import { useT } from '../locale';

export const AISelectionControl: React.FC = observer(() => {
  const t = useT();
  const { token } = theme.useToken();
  const [api, contextHolder] = notification.useNotification();
  const key = useRef(`ai-selection-control-${new Date().getTime()}`);
  const selectable = aiSelection.selectable;

  useEffect(() => {
    if (selectable !== '') {
      api.open({
        key: key.current,
        closeIcon: false,
        message: (
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <span
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: token.colorTextSecondary,
                lineHeight: 1.2,
              }}
            >
              {t('Picking block')}
            </span>
            <Button
              type="text"
              size="small"
              icon={<StopOutlined />}
              style={{ color: token.colorError, fontSize: 13, lineHeight: 1.2 }}
              aria-label={t('Cancel')}
              onClick={() => {
                aiSelection.stopSelect();
                dialogController.resume();
              }}
            />
          </Flex>
        ),
        duration: 0,
        placement: 'bottom',
        style: {
          width: 180,
          padding: '7px 12px 5px 12px',
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          boxShadow: token.boxShadowSecondary,
          borderRadius: 6,
        },
      });
    } else {
      api.destroy(key.current);
    }

    return () => {
      api.destroy(key.current);
    };
  }, [api, selectable, t, token]);

  return <>{contextHolder}</>;
});
