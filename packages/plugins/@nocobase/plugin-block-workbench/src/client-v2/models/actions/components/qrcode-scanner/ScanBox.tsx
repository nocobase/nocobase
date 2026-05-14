/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { css } from '@emotion/css';
import { theme } from 'antd';

export function ScanBox({ style = {} }: { style: React.CSSProperties }) {
  const { token } = theme.useToken();
  const scanBoxClass = css`
    box-sizing: border-box;
    inset: 0;
  `;
  const commonClass = css`
    position: absolute;
    background-color: ${token.colorTextLightSolid};
  `;
  return (
    <div id="qr-scan-box" className={scanBoxClass} style={style}>
      <div
        className={commonClass}
        style={{ width: token.controlHeightLG, height: token.lineWidth * 5, top: -token.lineWidth * 5, left: 0 }}
      />
      <div
        className={commonClass}
        style={{ width: token.controlHeightLG, height: token.lineWidth * 5, top: -token.lineWidth * 5, right: 0 }}
      />
      <div
        className={commonClass}
        style={{ width: token.controlHeightLG, height: token.lineWidth * 5, bottom: -token.lineWidth * 5, left: 0 }}
      />
      <div
        className={commonClass}
        style={{ width: token.controlHeightLG, height: token.lineWidth * 5, bottom: -token.lineWidth * 5, right: 0 }}
      />
      <div
        className={commonClass}
        style={{
          width: token.lineWidth * 5,
          height: token.controlHeightLG,
          top: -token.lineWidth * 5,
          left: -token.lineWidth * 5,
        }}
      />
      <div
        className={commonClass}
        style={{
          width: token.lineWidth * 5,
          height: token.controlHeightLG,
          bottom: -token.lineWidth * 5,
          left: -token.lineWidth * 5,
        }}
      />
      <div
        className={commonClass}
        style={{
          width: token.lineWidth * 5,
          height: token.controlHeightLG,
          top: -token.lineWidth * 5,
          right: -token.lineWidth * 5,
        }}
      />
      <div
        className={commonClass}
        style={{
          width: token.lineWidth * 5,
          height: token.controlHeightLG,
          bottom: -token.lineWidth * 5,
          right: -token.lineWidth * 5,
        }}
      />
    </div>
  );
}
