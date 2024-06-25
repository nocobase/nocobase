/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { QRCode, Popover } from 'antd';
import { Link } from 'react-router-dom';
import { QrcodeOutlined } from '@ant-design/icons';

import { usePluginTranslation } from '../locale';
import { useSize } from './sizeContext';
import { DesignableSwitch, useToken } from '@nocobase/client';

export const DesktopModeHeader: FC = () => {
  const { t } = usePluginTranslation();
  const { size, setSize } = useSize();
  const [activeType, setActiveType] = React.useState('mobile');
  const { token } = useToken();

  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', height: '100%' }}
    >
      <Link to="/admin">{t('Back')}</Link>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1em' }}>
        <DesignableSwitch />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #eee',
            padding: '0.3em 0.7em',
            borderRadius: '0.3em',
            gap: '0.3em',
          }}
        >
          <svg
            onClick={() => {
              setActiveType('pad');
              setSize({ width: 768, height: size.height });
            }}
            style={{ color: activeType == 'pad' ? token.colorPrimary : '', cursor: 'pointer' }}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
            <line x1="12" x2="12.01" y1="18" y2="18"></line>
          </svg>

          <svg
            onClick={() => {
              setActiveType('mobile');
              setSize({ width: 375, height: size.height });
            }}
            style={{ color: activeType == 'mobile' ? token.colorPrimary : '', cursor: 'pointer' }}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
            <path d="M12 18h.01"></path>
          </svg>
        </div>
        <Popover content={<QRCode value={window.location.href} bordered={false} />}>
          <QrcodeOutlined style={{ fontSize: '24px', cursor: 'pointer' }} />
        </Popover>
      </div>
    </div>
  );
};
