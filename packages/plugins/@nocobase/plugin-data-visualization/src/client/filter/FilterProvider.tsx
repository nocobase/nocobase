import React, { createContext, useState } from 'react';

export const FilterContext = createContext<{
  filter: any;
  setFilter: (filter: any) => void;
}>({} as any);

export const FilterProvider: React.FC = (props) => {
  const [filter, setFilter] = useState({});
  return <FilterContext.Provider value={{ filter, setFilter }}>{props.children}</FilterContext.Provider>;
};
