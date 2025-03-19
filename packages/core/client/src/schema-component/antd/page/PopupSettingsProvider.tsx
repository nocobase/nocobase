/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useCallback, useMemo } from 'react';
import { useIsInSettingsPage } from '../../../application/CustomRouterContextProvider';

const PopupSettingsContext = React.createContext({
  enableURL: true,
});

export const PopupSettingsProvider: FC<{
  /**
   * @default true
   */
  enableURL?: boolean;
}> = (props) => {
  const { enableURL = true } = props;
  const value = useMemo(() => ({ enableURL }), [enableURL]);

  return <PopupSettingsContext.Provider value={value}>{props.children}</PopupSettingsContext.Provider>;
};

/**
 * Hook for accessing the popup settings.
 * @returns The popup settings.
 */
export const usePopupSettings = () => {
  const { enableURL } = React.useContext(PopupSettingsContext);
  const isInSettingsPage = useIsInSettingsPage();

  const isPopupVisibleControlledByURL = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const isOldMobileMode = pathname?.includes('/mobile/') || hash?.includes('/mobile/');
    const isNewMobileMode = pathname?.includes('/m/');
    const isPCMode = pathname?.includes('/admin/');

    return (isPCMode || isNewMobileMode) && !isOldMobileMode && enableURL && !isInSettingsPage;
  }, [enableURL, isInSettingsPage]);

  return {
    /** 弹窗窗口的显隐是否由 URL 控制 */
    isPopupVisibleControlledByURL,
  };
};
