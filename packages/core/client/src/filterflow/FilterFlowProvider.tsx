import React, { createContext, useContext } from 'react';
import { FilterFlowManager } from './filterflow-manager';

export const FilterFlowContext = createContext<{
  filterFlowManager: FilterFlowManager;
}>(null);

export const useFilterFlow = () => {
  const context = useContext(FilterFlowContext);
  if (!context) {
    throw new Error('useFilterFlow must be used within a FilterFlowProvider');
  }
  return context.filterFlowManager;
};

export const FilterFlowProvider: React.FC<{
  children?: React.ReactNode;
  filterFlowManager: FilterFlowManager;
}> = (props) => {
  return (
    <FilterFlowContext.Provider
      value={{
        filterFlowManager: props.filterFlowManager,
      }}
    >
      {props.children}
    </FilterFlowContext.Provider>
  );
}; 