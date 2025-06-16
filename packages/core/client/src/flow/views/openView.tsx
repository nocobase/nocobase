/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '@nocobase/flow-engine';
import { Drawer } from 'antd';
import React from 'react';
import { createRoot } from 'react-dom/client';

const openDrawer = (params: { ctx: FlowContext }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  const unmount = () => {
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(container);
    }, 300);
  };

  root.render(<Drawer open={true} onClose={unmount}></Drawer>);
};

const openModal = () => {};

const openSubPage = () => {};

export const openView = (params: { type: 'drawer' | 'modal' | 'subPage'; ctx: FlowContext }) => {
  const { type, ...others } = params;
  switch (type) {
    case 'drawer':
      return openDrawer(others);
    case 'modal':
      return openModal();
    case 'subPage':
      return openSubPage();
    default:
      throw new Error(`Unsupported view type: ${type}`);
  }
};
