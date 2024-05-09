/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useMemo } from 'react';
import { CollapsedContext } from '../GraphDrawPage';
import { Select, useCompile } from '@nocobase/client';
import { useSearchParams } from 'react-router-dom';
import { getPopupContainer } from '../utils';

export const SelectCollectionsAction = (props) => {
  const { collectionList } = useContext(CollapsedContext);
  const compile = useCompile();
  const [searchParams, setSearchParams] = useSearchParams();
  const initCollections = searchParams.get('collections');
  const selectKeys = initCollections?.split(',');
  const data = selectKeys?.filter((v) => collectionList.find((k) => k.name === v));
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
      value={data}
      showSearch
      getPopupContainer={getPopupContainer}
      mode="multiple"
      allowClear
      options={collectionOptions}
      onChange={handleChange}
      style={{ minWidth: 200, position: 'fixed', margin: '24px', zIndex: 1000, maxWidth: '60%' }}
    />
  );
};
