/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDebounce } from 'ahooks';
import { RemoteSelect } from '@nocobase/client-v2';
import { FlowContextSelector, useFlowEngine, type MetaTreeNode } from '@nocobase/flow-engine';
import {
  parseCollectionName,
  TriggerCollectionRecordSelect,
  useCurrentWorkflowContext,
  useWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client-v2';
import { Alert, Form, Input, Space, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CONTEXT_TYPE } from '../../common/constants';
import { useT } from '../locale';

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

function getLabelValue(item: RecordValue, labelKey: string | string[]) {
  if (Array.isArray(labelKey)) {
    return labelKey
      .map((key) => item?.[key])
      .filter((part) => part != null)
      .join(' ');
  }
  return item?.[labelKey];
}

function stringifyJsonValue(value: unknown) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function formatWorkflowVariable(meta?: MetaTreeNode) {
  const paths = meta?.paths ?? [];
  return paths.length ? `{{${paths.join('.')}}}` : '';
}

function WorkflowJsonInput({ value, onChange }: { value?: unknown; onChange?: (value: unknown) => void }) {
  const metaTree = useWorkflowVariableOptions();
  const metaTreeGetter = useMemo(() => () => metaTree, [metaTree]);
  const [text, setText] = useState(() => stringifyJsonValue(value));
  const [error, setError] = useState<string>();

  useEffect(() => {
    setText(stringifyJsonValue(value));
  }, [value]);

  const commit = (nextText: string) => {
    if (!nextText.trim()) {
      setError(undefined);
      onChange?.(null);
      return;
    }
    try {
      const parsed = JSON.parse(nextText);
      setError(undefined);
      onChange?.(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <Space.Compact block>
        <Input.TextArea
          value={text}
          status={error ? 'error' : undefined}
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            try {
              if (nextText.trim()) {
                JSON.parse(nextText);
              }
              setError(undefined);
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
          onBlur={(event) => commit(event.target.value)}
        />
        <FlowContextSelector
          metaTree={metaTreeGetter}
          formatPathToValue={formatWorkflowVariable}
          onChange={(variable) => {
            const nextText = `${text}${variable}`;
            setText(nextText);
            commit(nextText);
          }}
        />
      </Space.Compact>
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
    </>
  );
}

type SearchableRemoteSelectProps<TRecord extends Record<string, unknown>, TValue extends string | number> = {
  cacheKey: string;
  labelKey: keyof TRecord & string;
  resource: string;
  value?: TValue | null;
  valueKey: keyof TRecord & string;
  onChange?: (value: TValue | null) => void;
};

function SearchableRemoteSelect<TRecord extends Record<string, unknown>, TValue extends string | number>({
  cacheKey,
  labelKey,
  resource,
  value,
  valueKey,
  onChange,
}: SearchableRemoteSelectProps<TRecord, TValue>) {
  const flowEngine = useFlowEngine();
  const t = useT();
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, { wait: 300 });

  return (
    <RemoteSelect<TRecord, TRecord[], TValue>
      cacheKey={cacheKey}
      filterOption={false}
      value={value == null ? undefined : value}
      onChange={(nextValue) => onChange?.((nextValue as TValue | undefined) ?? null)}
      onSearch={(nextValue) => {
        setSearchValue(nextValue);
      }}
      request={async () => {
        const response = await flowEngine.context.api.resource(resource).list({
          pageSize: 200,
          ...(debouncedSearchValue
            ? {
                filter: {
                  [labelKey]: {
                    $includes: debouncedSearchValue,
                  },
                },
              }
            : {}),
        });
        return response?.data?.data ?? [];
      }}
      refreshDeps={[debouncedSearchValue, resource, labelKey]}
      mapOptions={(item) => {
        const rawLabel = item[labelKey];
        const rawValue = item[valueKey];
        let label: React.ReactNode;

        if (typeof rawLabel === 'string') {
          label = t(rawLabel);
        } else if (typeof rawLabel === 'number') {
          label = rawLabel;
        } else {
          label = String(rawValue ?? '');
        }

        return {
          label,
          value: rawValue as TValue,
        };
      }}
    />
  );
}

function TriggerCollectionRecordMultiSelect({
  value,
  onChange,
}: {
  value?: Array<RecordValue | string | number>;
  onChange?: (value: Array<string | number>) => void;
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

  if (!filterTargetKey) {
    return null;
  }

  return (
    <RemoteSelect
      mode="multiple"
      value={Array.isArray(value) ? value.map((item) => getPrimaryValue(item, filterTargetKey)) : []}
      onChange={(nextValue) => {
        onChange?.(
          (nextValue || []).map((item) => {
            const matched = loadedItemsRef.current.find((row) => getPrimaryValue(row, filterTargetKey) === item);
            return getPrimaryValue(matched ?? item, filterTargetKey) as string | number;
          }),
        );
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
        const rawLabel =
          getLabelValue(item as RecordValue, labelKey) ?? getPrimaryValue(item as RecordValue, filterTargetKey);
        let label: React.ReactNode;

        if (typeof rawLabel === 'string') {
          label = t(rawLabel);
        } else if (typeof rawLabel === 'number') {
          label = rawLabel;
        } else {
          label = t('Untitled');
        }

        return {
          label,
          value: getPrimaryValue(item as RecordValue, filterTargetKey),
        };
      }}
      cacheKey={`workflow:custom-action-trigger-records:${dataSourceKey}:${collectionName}`}
    />
  );
}

function TriggerDataField() {
  const workflow = useCurrentWorkflowContext();
  const t = useT();
  const type = workflow?.config?.type ?? CONTEXT_TYPE.GLOBAL;

  if (type === CONTEXT_TYPE.MULTIPLE_RECORDS) {
    return (
      <Form.Item
        name="filterByTk"
        label={t('Trigger data')}
        extra={t('Choose a record or primary key of a record in the collection to trigger.', { ns: 'workflow' })}
        rules={[{ required: true }]}
      >
        <TriggerCollectionRecordMultiSelect />
      </Form.Item>
    );
  }

  if (type === CONTEXT_TYPE.SINGLE_RECORD) {
    return (
      <Form.Item
        name="data"
        label={t('Trigger data')}
        extra={t('Use JSON as trigger data for custom data context, or choose a record in single record context.')}
      >
        <TriggerCollectionRecordSelect />
      </Form.Item>
    );
  }

  return (
    <Form.Item
      name="data"
      label={t('Trigger data')}
      extra={t('Use JSON as trigger data for custom data context, or choose a record in single record context.')}
    >
      <WorkflowJsonInput />
    </Form.Item>
  );
}

export function TriggerCustomActionConfig() {
  const t = useT();

  return (
    <>
      <TriggerDataField />
      <Form.Item name="userId" label={t('User acted')} rules={[{ required: true }]}>
        <SearchableRemoteSelect<{ id: number; nickname?: string }, number>
          cacheKey="workflow-custom-action-trigger:users"
          resource="users"
          labelKey="nickname"
          valueKey="id"
        />
      </Form.Item>
      <Form.Item name="roleName" label={t('Role of user acted')}>
        <SearchableRemoteSelect<{ name: string; title?: string }, string>
          cacheKey="workflow-custom-action-trigger:roles"
          resource="roles"
          labelKey="title"
          valueKey="name"
        />
      </Form.Item>
    </>
  );
}

export default TriggerCustomActionConfig;
