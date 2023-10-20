import React, { createContext, useState } from 'react';

export const ChartFilterContext = createContext<{
  filter: any;
  setFilter: (filter: any) => void;
  collapse: boolean;
  setCollapse: (collapsed: boolean) => void;
}>({} as any);

export const ChartFilterProvider: React.FC = (props) => {
  const [filter, setFilter] = useState({});
  const [collapse, setCollapse] = useState(false);
  return (
    <ChartFilterContext.Provider value={{ filter, setFilter, collapse, setCollapse }}>
      {props.children}
    </ChartFilterContext.Provider>
  );
};
