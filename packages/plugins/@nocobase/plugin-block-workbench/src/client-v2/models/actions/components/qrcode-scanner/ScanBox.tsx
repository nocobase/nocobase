/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export function ScanBox({ style = {} }: { style: React.CSSProperties }) {
  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'rgb(255, 255, 255)',
  };
  return (
    <div id="qr-scan-box" style={{ boxSizing: 'border-box', inset: '0px', ...style }}>
      <div style={{ width: '40px', height: '5px', top: '-5px', left: '0px', ...commonStyle }}></div>
      <div style={{ width: '40px', height: '5px', top: '-5px', right: '0px', ...commonStyle }}></div>
      <div style={{ width: '40px', height: '5px', bottom: '-5px', left: '0px', ...commonStyle }}></div>
      <div style={{ width: '40px', height: '5px', bottom: '-5px', right: '0px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', top: '-5px', left: '-5px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', bottom: '-5px', left: '-5px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', top: '-5px', right: '-5px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', bottom: '-5px', right: '-5px', ...commonStyle }}></div>
    </div>
  );
}
