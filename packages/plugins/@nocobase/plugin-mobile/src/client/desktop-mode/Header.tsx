/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QrcodeOutlined } from '@ant-design/icons';
import { Button, Popover, QRCode } from 'antd';
import React, { FC, useState } from 'react';

import { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import { css, DesignableSwitch, Icon, useApp, useUIConfigurationPermissions } from '@nocobase/client';
import { usePluginTranslation } from '../locale';
import { useSize } from './sizeContext';

const PadSvg = () => (
  <svg
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
    <title>pad icon</title>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
    <line x1="12" x2="12.01" y1="18" y2="18"></line>
  </svg>
);

const MobileSvg = () => (
  <svg
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
    <title>mobile icon</title>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
    <path d="M12 18h.01"></path>
  </svg>
);

const PadIcon = (props: Partial<CustomIconComponentProps>) => <Icon type={''} component={PadSvg} {...props} />;

const MobileIcon = (props: Partial<CustomIconComponentProps>) => <Icon type={''} component={MobileSvg} {...props} />;

export const DesktopModeHeader: FC = () => {
  const { t } = usePluginTranslation();
  const app = useApp();
  const { setSize } = useSize();
  const [open, setOpen] = useState(false);
  const { allowConfigUI } = useUIConfigurationPermissions();
  const handleQRCodeOpen = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', height: '100%' }}
      className={css`
        .ant-btn {
          border: 0;
          height: 46px;
          width: 46px;
          border-radius: 0;
          background: none;
          color: rgba(255, 255, 255, 0.65);
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          &:hover {
            background: rgba(255, 255, 255, 0.1) !important;
          }

          svg {
            width: 20px !important;
            height
          }
        }
        .ant-btn-default {
          box-shadow: none;
        }
      `}
    >
      <Button style={{ color: 'white' }} href={app.getHref('/admin')}>
        {t('Back')}
      </Button>
      <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
        {allowConfigUI ? <DesignableSwitch style={{ fontSize: 16 }} /> : null}
        <Button
          onClick={() => {
            setSize({ width: 768, height: 667 });
          }}
          data-testid="desktop-mode-size-pad"
          icon={<PadIcon />}
        ></Button>
        <Button
          onClick={() => {
            setSize({ width: 375, height: 667 });
          }}
          data-testid="desktop-mode-size-mobile"
          icon={<MobileIcon />}
        ></Button>
        <Popover
          trigger={'hover'}
          open={open}
          onOpenChange={handleQRCodeOpen}
          content={open ? <QRCode value={window.location.href} bordered={false} /> : ' '}
        >
          <Button
            icon={<QrcodeOutlined style={{ fontSize: '24px', cursor: 'pointer' }} data-testid="desktop-mode-qrcode" />}
          ></Button>
        </Popover>
      </div>
    </div>
  );
};
