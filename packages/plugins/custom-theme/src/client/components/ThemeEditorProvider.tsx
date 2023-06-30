import React from 'react';

const ThemeEditorContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshRef: React.MutableRefObject<(() => void) | null>;
}>(null);

export const useThemeEditorContext = () => React.useContext(ThemeEditorContext);

export const ThemeEditorProvider = ({ children, open, setOpen, refreshRef }) => {
  return <ThemeEditorContext.Provider value={{ open, setOpen, refreshRef }}>{children}</ThemeEditorContext.Provider>;
};

ThemeEditorProvider.displayName = 'ThemeEditorProvider';
