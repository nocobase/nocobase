/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { Cascader } from 'antd';
import React, { useMemo } from 'react';
import { useT } from '../../locale';
import { getCollectionOptions, joinCollectionName, parseCollectionName } from './collectionUtils';

export function CollectionCascader({ value, onChange }: { value?: string; onChange?: (value?: string) => void }) {
  const flowEngine = useFlowEngine();
  const t = useT();

  const options = useMemo(() => getCollectionOptions(flowEngine.context.dataSourceManager), [flowEngine]);
  const pathValue = useMemo(() => {
    const parsed = parseCollectionName(value);
    return parsed.length ? parsed : undefined;
  }, [value]);

  return (
    <Cascader
      options={options}
      value={pathValue}
      placeholder={t('Select collection')}
      showSearch
      onChange={(path) => {
        if (!path?.length) {
          onChange?.(undefined);
          return;
        }
        const [dataSourceKey, collectionName] = path as string[];
        onChange?.(joinCollectionName(dataSourceKey, collectionName));
      }}
    />
  );
}

export default CollectionCascader;
