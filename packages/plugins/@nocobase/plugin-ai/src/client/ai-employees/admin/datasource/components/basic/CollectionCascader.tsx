/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cascader } from 'antd';
import React, { useMemo } from 'react';
import { useFlowContext } from '@nocobase/flow-engine';

export const CollectionCascader: React.FC<{
  value?: string[];
  onChange?: (value: string[] | null) => void;
  disabled?: boolean;
}> = (props) => {
  const ctx = useFlowContext();
  const dataSourceManager = ctx.dataSourceManager;
  const { value, onChange, ...others } = props;
  const dataSources = dataSourceManager.getDataSources();

  const options = useMemo(() => {
    return dataSources.map((dataSource) => {
      return {
        key: dataSource.key,
        label: dataSource.displayName,
        value: dataSource.key,
        children: dataSource.collectionManager.getCollections().map((collection) => {
          return {
            key: collection.name,
            label: collection.title,
            value: collection.name,
          };
        }),
      };
    });
  }, [dataSources]);

  return <Cascader showSearch {...others} options={options} value={value} onChange={onChange} />;
};
