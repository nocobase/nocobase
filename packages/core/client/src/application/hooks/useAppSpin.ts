/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Spin } from 'antd';
import React from 'react';
import { useApp } from './useApp';

export const useAppSpin = () => {
  const app = useApp();
  return {
    render: () => (app?.renderComponent ? app?.renderComponent?.('AppSpin') : React.createElement(Spin)),
  };
};
