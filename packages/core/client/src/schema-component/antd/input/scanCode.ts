/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Html5Qrcode } from 'html5-qrcode';

export function scanCode(divId = 'html5qr-code-full-region'): Promise<string> {
  return new Promise((resolve, reject) => {
    const html5QrCode = new Html5Qrcode(divId);

    const qrCodeSuccessCallback = (decodedText: string) => {
      // eslint-disable-next-line promise/catch-or-return
      html5QrCode.stop().then(() => {
        document.getElementById(divId)?.remove();
        resolve(decodedText);
      });
    };

    const qrCodeErrorCallback = () => {};

    const config = { fps: 10, qrbox: 250 };

    // 创建容器
    let container = document.getElementById(divId);
    if (!container) {
      container = document.createElement('div');
      container.id = divId;
      Object.assign(container.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        backgroundColor: '#fff',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      });
      document.body.appendChild(container);
    }

    html5QrCode
      .start({ facingMode: 'environment' }, config, qrCodeSuccessCallback, qrCodeErrorCallback)
      .catch((err) => {
        reject(err);
      });
  });
}
