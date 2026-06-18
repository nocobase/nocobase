/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Button, Flex, notification, theme } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../locale';
import { aiSelection } from './stores/ai-selection';
import { dialogController } from './stores/dialog-controller';

export const AISelectionControl: React.FC = observer(() => {
  const t = useT();
  const { token } = theme.useToken();
  const [api, contextHolder] = notification.useNotification();
  const key = useRef(`ai-selection-control-${Date.now()}`);
  const selectable = aiSelection.selectable;

  useEffect(() => {
    const notificationKey = key.current;
    if (selectable) {
      api.open({
        key: notificationKey,
        closeIcon: false,
        message: (
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <span
              style={{
                fontWeight: token.fontWeightStrong,
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary,
                lineHeight: token.lineHeightSM,
              }}
            >
              {t('Picking block')}
            </span>
            <Button
              type="text"
              size="small"
              icon={<StopOutlined />}
              style={{ color: token.colorError, fontSize: token.fontSizeSM, lineHeight: token.lineHeightSM }}
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
          width: token.controlHeightLG * 5,
          padding: `${token.paddingXXS}px ${token.paddingSM}px`,
          background: token.colorBgContainer,
          border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
          boxShadow: token.boxShadowSecondary,
          borderRadius: token.borderRadius,
        },
      });
    } else {
      api.destroy(notificationKey);
    }

    return () => {
      api.destroy(notificationKey);
    };
  }, [api, selectable, t, token]);

  return <>{contextHolder}</>;
});

AISelectionControl.displayName = 'AISelectionControl';
