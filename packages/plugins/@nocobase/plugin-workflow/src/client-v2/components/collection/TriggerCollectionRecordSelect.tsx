/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { useFlowEngine } from '@nocobase/flow-engine';
import { Alert } from 'antd';
import React, { useRef } from 'react';
import { useCurrentWorkflowContext } from '../../canvas/contexts';
import { useT } from '../../locale';
import { parseCollectionName } from './utils';

type RecordValue = Record<string, unknown>;

function getPrimaryValue(item: RecordValue | string | number | null | undefined, filterTargetKey: string | string[]) {
  if (item == null || typeof item !== 'object') {
    return item;
  }
  if (Array.isArray(filterTargetKey)) {
    return JSON.stringify(
      filterTargetKey.reduce(
        (result, key) => {
          result[key] = item[key];
          return result;
        },
        {} as Record<string, unknown>,
      ),
    );
  }
  return item[filterTargetKey] as string | number | undefined;
}

export function TriggerCollectionRecordSelect({
  value,
  onChange,
}: {
  value?: RecordValue | string | number | null;
  onChange?: (value?: RecordValue | string | number | null) => void;
}) {
  const workflow = useCurrentWorkflowContext();
  const flowEngine = useFlowEngine();
  const t = useT();
  const loadedItemsRef = useRef<RecordValue[]>([]);

  const [dataSourceKey, collectionName] = parseCollectionName(workflow?.config?.collection as string) as [
    string,
    string,
  ];
  const dataSource = dataSourceKey ? flowEngine.context.dataSourceManager?.getDataSource?.(dataSourceKey) : null;
  const collection = dataSource?.collectionManager?.getCollection?.(collectionName);

  if (!dataSource) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('Data source "{{dataSourceName}}" not found.', { dataSourceName: dataSourceKey })}
      />
    );
  }

  if (!collection) {
    return (
      <Alert type="warning" showIcon message={t('Collection "{{collectionName}}" not found.', { collectionName })} />
    );
  }

  const filterTargetKey = collection.filterTargetKey;
  const labelKey = collection.titleCollectionField?.name || filterTargetKey;
  const selectValue = getPrimaryValue(value, filterTargetKey);

  if (!filterTargetKey) {
    return null;
  }

  return (
    <RemoteSelect
      value={selectValue}
      onChange={(nextValue) => {
        const matched = loadedItemsRef.current.find((item) => getPrimaryValue(item, filterTargetKey) === nextValue);
        onChange?.(matched ?? nextValue);
      }}
      request={async () => {
        const response = await flowEngine.context.api
          .resource(collectionName, null, { 'x-data-source': dataSourceKey })
          .list({ pageSize: 50 });
        return response?.data?.data ?? [];
      }}
      onLoaded={(items) => {
        loadedItemsRef.current = items as RecordValue[];
      }}
      mapOptions={(item) => {
        const rawLabel = item?.[labelKey] ?? item?.[filterTargetKey];
        return {
          label: typeof rawLabel === 'string' ? t(rawLabel) : rawLabel ?? t('Untitled'),
          value: getPrimaryValue(item as RecordValue, filterTargetKey),
        };
      }}
      cacheKey={`workflow:collection-trigger-records:${dataSourceKey}:${collectionName}`}
    />
  );
}

export default TriggerCollectionRecordSelect;
