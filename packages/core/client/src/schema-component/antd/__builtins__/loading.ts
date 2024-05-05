/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { message } from 'antd';

export const loading = async (title: React.ReactNode = 'Loading...', processor: () => Promise<any>) => {
  let hide: any = null;
  const loading = setTimeout(() => {
    hide = message.loading(title);
  }, 100);
  try {
    return await processor();
  } finally {
    hide?.();
    clearTimeout(loading);
  }
};
