import { createContext, useContext } from 'react';

interface BlockTemplateInfo {
  uid?: string;
  key?: string;
  title?: string;
  description?: string;
  configured?: boolean;
}

export const BlockTemplateInfoContext = createContext<BlockTemplateInfo>({});

export const useBlockTemplateInfo = () => {
  return useContext(BlockTemplateInfoContext);
};
