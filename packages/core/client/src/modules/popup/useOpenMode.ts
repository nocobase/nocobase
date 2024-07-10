/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';

export const useOpenMode = () => {
  // 只有在移动端中才不显示 Open mode 选项
  const isOpenModeVisible = useCallback(
    (pathname?: string) => !(pathname || window.location.pathname).includes('/m/'),
    [],
  );
  const getDefaultOpenMode = useCallback(
    (pathname?: string) => (isOpenModeVisible(pathname) ? 'drawer' : 'page'),
    [isOpenModeVisible],
  );

  return {
    /** 是否显示 Open mode 选项 */
    isOpenModeVisible,
    /** 获取创建按钮时的 Open mode 默认值 */
    getDefaultOpenMode,
  };
};
