import React, { createContext, FC, useState } from 'react';

export enum SHARED_FILTER_CONDITION {
  AND = '$and',
  OR = '$or',
}

export type SharedFilter = {
  [K in SHARED_FILTER_CONDITION]?: any;
};

export type SharedFilterContextValue = {
  filter: SharedFilter;
  setFilter: (filter: SharedFilter) => void;
  associateFilter: SharedFilter;
  setAssociateFilter: (filter: SharedFilter) => void;
};

export const SharedFilterContext = createContext<SharedFilterContextValue>({
  filter: {
    $and: [],
    $or: [],
  },
  setFilter: undefined!,
  associateFilter: {},
  setAssociateFilter: undefined!,
});

export const concatFilter = (f1: SharedFilter, f2: SharedFilter) => ({
  $and: (f1.$and ?? []).concat(f2.$and ?? []),
  $or: (f1.$or ?? []).concat(f2.$or ?? []),
});

export const SharedFilterProvider: FC<{ params?: any }> = (props) => {
  const [filter, setFilterUnwrap] = useState<SharedFilter>(props.params?.filter ?? {});
  const [associateFilter, setAssociateFilterUnwrap] = useState({});

  const setFilter = (incomeFilter: SharedFilter) => {
    setFilterUnwrap({
      $and: incomeFilter.$and ?? [],
      $or: incomeFilter.$or ?? [],
    });
  };

  const setAssociateFilter = (incomeFilter: SharedFilter) => {
    setAssociateFilterUnwrap({
      $and: incomeFilter.$and ?? [],
      $or: incomeFilter.$or ?? [],
    });
  };

  return (
    <SharedFilterContext.Provider value={{ filter, setFilter, associateFilter, setAssociateFilter }}>
      {props.children}
    </SharedFilterContext.Provider>
  );
};
