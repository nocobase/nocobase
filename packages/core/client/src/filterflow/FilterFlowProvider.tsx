import React, { createContext, useContext } from 'react';
import { FilterFlowManager } from './filterflow-manager';

export const FilterFlowManagerContext = createContext<{
  filterFlowManager: FilterFlowManager;
}>(null);

export const useFilterFlowManager = () => {
  const context = useContext(FilterFlowManagerContext);
  if (!context) {
    throw new Error('useFilterFlowManager must be used within a FilterFlowManagerProvider');
  }
  return context.filterFlowManager;
};

export const FilterFlowProvider: React.FC<{
  children?: React.ReactNode;
  filterFlowManager: FilterFlowManager;
}> = (props) => {
  return (
    <FilterFlowManagerContext.Provider
      value={{
        filterFlowManager: props.filterFlowManager,
      }}
    >
      {props.children}
    </FilterFlowManagerContext.Provider>
  );
}; 

FilterFlowProvider.displayName = 'FilterFlowProvider';
