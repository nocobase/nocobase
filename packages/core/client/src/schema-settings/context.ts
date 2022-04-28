import { createContext, useContext } from 'react';

interface IGeneralDesignerContext {
  designerActions: any[];
}

export const GeneralDesignerContext = createContext<IGeneralDesignerContext>(null);

export const useGeneralDesignerContext = () => {
  return useContext<IGeneralDesignerContext>(GeneralDesignerContext);
};
