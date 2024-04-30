/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

const ThemeEditorContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>(null);

export const useThemeEditorContext = () => React.useContext(ThemeEditorContext);

export const ThemeEditorProvider = ({ children, open, setOpen }) => {
  return <ThemeEditorContext.Provider value={{ open, setOpen }}>{children}</ThemeEditorContext.Provider>;
};

ThemeEditorProvider.displayName = 'ThemeEditorProvider';
