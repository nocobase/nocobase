import React, { useContext, useEffect, useMemo } from 'react';
import { CollapsedContext } from '../GraphDrawPage';
import { Select, useCompile, useCollectionManager } from '@nocobase/client';
import { useSearchParams } from 'react-router-dom';
import { getPopupContainer } from '../utils';

export const SelectCollectionsAction = (props) => {
  const { collectionList } = useContext(CollapsedContext);
  const compile = useCompile();
  const [searchParams, setSearchParams] = useSearchParams();
  const initCollections = searchParams.get('collections');
  const collectionOptions = useMemo(() => {
    return collectionList.map((v) => {
      return {
        label: compile(v.title),
        value: v.name,
      };
    });
  }, [collectionList]);

  const handleChange = (values) => {
    setSearchParams([['collections', values.toString()]]);
  };

  return (
    <Select
      value={initCollections && initCollections?.split(',')}
      showSearch
      getPopupContainer={getPopupContainer}
      mode="multiple"
      allowClear
      onSearch={(value) => {
        console.log(value);
      }}
      options={collectionOptions}
      onChange={handleChange}
      style={{ minWidth: 200, position: 'fixed', margin: '24px', zIndex: 1000, maxWidth: '60%' }}
    />
  );
};
