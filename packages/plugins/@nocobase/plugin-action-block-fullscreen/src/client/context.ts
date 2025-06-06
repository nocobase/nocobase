/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FullscreenContextType {
  // isFullscreen: boolean;
  // setFullscreen: (fullscreen: boolean) => void;
}

export const FullscreenContext = createContext<FullscreenContextType>(null);
FullscreenContext.displayName = 'FullscreenContext';

export const useFullscreenContext = () => {
  return useContext(FullscreenContext);
};
