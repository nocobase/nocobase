/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';

/**
 * Hook for accessing the popup settings.
 * @returns The popup settings.
 */
export const usePopupSettings = () => {
  const isPopupVisibleControlledByURL = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    return pathname?.includes('/admin/') && !hash?.includes('/mobile');
  }, []);

  return { isPopupVisibleControlledByURL };
};
