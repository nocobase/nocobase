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
  associateFilterStore: SharedFilter;
  setAssociateFilter: (key: string, filter: SharedFilter) => void;
};

export const SharedFilterContext = createContext<SharedFilterContextValue>({
  filter: {
    $and: [],
    $or: [],
  },
  setFilter: undefined!,
  associateFilterStore: {},
  setAssociateFilter: undefined!,
});

export const concatFilter = (f1: SharedFilter, f2: SharedFilter) => ({
  $and: (f1.$and ?? []).concat(f2.$and ?? []),
  $or: (f1.$or ?? []).concat(f2.$or ?? []),
});

export const SharedFilterProvider: FC<{ params?: any }> = (props) => {
  const [filter, setFilterUnwrap] = useState<SharedFilter>(props.params?.filter ?? {});
  const [associateFilterStore, setAssociateFilterUnwrap] = useState<Record<string, SharedFilter>>({});

  const setFilter = (incomeFilter: SharedFilter) => {
    setFilterUnwrap({
      $and: incomeFilter.$and ?? [],
      $or: incomeFilter.$or ?? [],
    });
  };

  const setAssociateFilter = (key: string, incomeFilter: SharedFilter) => {
    setAssociateFilterUnwrap({
      ...associateFilterStore,
      [key]: {
        $and: incomeFilter.$and ?? [],
        $or: incomeFilter.$or ?? [],
      },
    });
  };

  return (
    <SharedFilterContext.Provider value={{ filter, setFilter, associateFilterStore, setAssociateFilter }}>
      {props.children}
    </SharedFilterContext.Provider>
  );
};
