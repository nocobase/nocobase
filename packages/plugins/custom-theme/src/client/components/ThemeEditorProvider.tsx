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
