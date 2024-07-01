/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';

interface PopupSettings {
  /**
   * @default true
   */
  isPopupVisibleControlledByURL: boolean;
}

const PopupSettingsContext = React.createContext<PopupSettings>(null);

/**
 * Provider component for the popup settings.
 * @param props - The popup settings.
 */
export const PopupSettingsProvider: FC<PopupSettings> = (props) => {
  const { isPopupVisibleControlledByURL } = props;

  const value = useMemo(() => {
    return { isPopupVisibleControlledByURL };
  }, [isPopupVisibleControlledByURL]);

  return <PopupSettingsContext.Provider value={value}>{props.children}</PopupSettingsContext.Provider>;
};

/**
 * Hook for accessing the popup settings.
 * @returns The popup settings.
 */
export const usePopupSettings = () => {
  return (
    React.useContext(PopupSettingsContext) || {
      isPopupVisibleControlledByURL: true,
    }
  );
};
