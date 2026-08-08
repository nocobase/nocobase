/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { LeftOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { theme } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import { ActionModel } from '@nocobase/client-v2';
import { QRCodeScannerInner } from './components/qrcode-scanner';
import { NAMESPACE, tExpr } from '../../locale';

type QRCodeScannerProps = {
  app?: any;
  navigate: (path: string) => void;
  onClose?: () => void;
  t: (key: string, options?: Record<string, any>) => string;
};

const QRCodeScanner = (props: QRCodeScannerProps) => {
  const [visible, setVisible] = useState(true);
  const { token } = theme.useToken();
  const close = () => {
    setVisible(false);
    props.onClose?.();
  };

  const scannerClass = css`
    position: fixed;
    width: 100%;
    height: 100%;
    background: ${token.colorBgMask};
    z-index: ${token.zIndexPopupBase + 1};
    top: 0;
    left: 0;
    overflow: hidden;
  `;
  const backIconClass = css`
    position: absolute;
    top: ${token.paddingLG}px;
    left: ${token.paddingLG}px;
    z-index: ${token.zIndexPopupBase + 3};
    color: ${token.colorTextLightSolid};
    font-size: ${token.fontSizeHeading2}px;
    font-weight: ${token.fontWeightStrong};
  `;

  const titleClass = css`
    position: absolute;
    color: ${token.colorTextLightSolid};
    font-size: ${token.fontSizeHeading4}px;
    left: 0;
    right: 0;
    top: ${token.paddingLG}px;
    z-index: ${token.zIndexPopupBase + 2};
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  `;

  return visible ? (
    <div className={scannerClass}>
      <QRCodeScannerInner
        setVisible={setVisible}
        app={props.app}
        navigate={props.navigate}
        onClose={close}
        t={props.t}
      />
      <LeftOutlined className={backIconClass} onClick={close} />
      <div className={titleClass}>{props.t('Scan QR code')}</div>
    </div>
  ) : null;
};

export class ActionPanelScanActionModel extends ActionModel {
  onClick(event) {
    this.dispatchEvent(
      'click',
      {
        event,
        ...this.getInputArgs(),
      },
      {
        debounce: true,
      },
    );
  }

  defaultProps: ButtonProps = {
    title: tExpr('Scan QR code'),
    icon: 'ScanOutlined',
  };
}

ActionPanelScanActionModel.registerFlow({
  key: 'actionPanelScanSettings',
  on: 'click',
  steps: {
    scanClick: {
      async handler(ctx, params) {
        for (const child of Array.from(document.body.children)) {
          if (child.id === 'qr-scanner-container') {
            child.remove();
          }
        }

        const container = document.createElement('div');
        container.id = 'qr-scanner-container';
        document.body.appendChild(container);

        const root = ReactDOM.createRoot(container);

        const handleClose = () => {
          root.unmount();
          container.remove();
        };

        const t = (key: string, options?: Record<string, any>) => ctx.t(key, { ns: [NAMESPACE, 'client'], ...options });

        root.render(
          <QRCodeScanner app={ctx.app} navigate={(path) => ctx.router.navigate(path)} onClose={handleClose} t={t} />,
        );
      },
    },
  },
});

ActionPanelScanActionModel.define({
  label: tExpr('Scan QR code'),
});
