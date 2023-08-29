import React, { useContext, useMemo } from 'react';
import { CollapsedContext } from '../GraphDrawPage';
import { Select } from '@nocobase/client';

export const SelectCollectionsAction = () => {
  const { collectionList } = useContext(CollapsedContext);
  const collectionOptions = useMemo(() => {
    return collectionList.map((v) => {
      return {
        label: v.title,
        value: v.name,
      };
    });
  }, [collectionList]);
  return <Select showSearch options={collectionOptions} style={{ minWidth: 200 }} />;
};
