/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { App, Button, Popconfirm, Popover, Select, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import { useT } from '../../locale';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';

type CollectionFieldRecord = {
  interface?: string;
  name?: string;
  primaryKey?: boolean;
  title?: React.ReactNode;
  uiSchema?: {
    title?: React.ReactNode;
  };
  unique?: boolean;
};

type FieldInterfaceManager = {
  getFieldInterface?: (name: string, dataSourceType?: string) => { titleUsable?: boolean } | undefined;
};

type RecordUniqueKeyValue = string[] | undefined;

function normalizeRecordUniqueKey(value: unknown): RecordUniqueKeyValue {
  if (Array.isArray(value)) {
    const keys = value.filter(Boolean).map(String);
    return keys.length ? keys : undefined;
  }

  return value ? [String(value)] : undefined;
}

function getCollectionPrimaryKey(collection: Record<string, unknown>, fields?: CollectionFieldRecord[]) {
  const collectionPrimaryKey = normalizeRecordUniqueKey(collection.primaryKey);
  if (collectionPrimaryKey?.length) {
    return collectionPrimaryKey;
  }

  const fieldPrimaryKeys = (fields || [])
    .filter((field) => field?.primaryKey && field.name)
    .map((field) => String(field.name));

  return fieldPrimaryKeys.length ? fieldPrimaryKeys : undefined;
}

export function getCollectionRecordUniqueKey(collection: Record<string, unknown>, fields?: CollectionFieldRecord[]) {
  return normalizeRecordUniqueKey(collection.filterTargetKey) || getCollectionPrimaryKey(collection, fields);
}

export function collectionNeedsRecordUniqueKey(collection: Record<string, unknown>, fields?: CollectionFieldRecord[]) {
  return !getCollectionRecordUniqueKey(collection, fields);
}

function getCollectionUpdateActionUrl(dataSourceKey: string) {
  return dataSourceKey === 'main' ? 'collections:update' : `dataSources/${dataSourceKey}/collections:update`;
}

export function RecordUniqueKeyPrompt(props: {
  collection: Record<string, unknown>;
  dataSourceKey: string;
  fields?: CollectionFieldRecord[];
  onSaved?: (values: { filterTargetKey: string[] }) => void;
  size?: 'small';
  style?: React.CSSProperties;
}) {
  const { collection, dataSourceKey, fields, onSaved, size, style } = props;
  const t = useT();
  const ctx = useFlowContext();
  const { message, notification } = App.useApp();
  const [filterTargetKey, setFilterTargetKey] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const dataSource = ctx.dataSourceManager.getDataSource(dataSourceKey);
  const fieldInterfaceManager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const options = useMemo(
    () =>
      (fields || [])
        .filter((field) => {
          if (!field?.name || !field.interface) {
            return false;
          }
          const fieldInterface = fieldInterfaceManager?.getFieldInterface?.(
            String(field.interface),
            dataSource?.options?.type,
          );
          return fieldInterface ? fieldInterface.titleUsable : true;
        })
        .map((field) => {
          const title = field.uiSchema?.title || field.title || field.name;
          return {
            value: String(field.name),
            label: compileLegacyTemplate(title, t),
            title: compileLegacyTemplateText(title, t),
          };
        }),
    [dataSource?.options?.type, fieldInterfaceManager, fields, t],
  );
  const selectedTitle = useMemo(
    () => filterTargetKey.map((key) => options.find((option) => option.value === key)?.title || key).join(', '),
    [filterTargetKey, options],
  );

  const handleConfirm = async () => {
    if (!filterTargetKey.length) {
      message.warning(t('Please select a field.'));
      return;
    }

    setSaving(true);
    try {
      await ctx.api.request({
        url: getCollectionUpdateActionUrl(dataSourceKey),
        method: 'post',
        params: { filterByTk: String(collection.name) },
        data: {
          filterTargetKey,
        },
      });
      dataSource?.collectionManager
        ?.getCollection(String(collection.name))
        ?.setOption?.('filterTargetKey', filterTargetKey);
      onSaved?.({ filterTargetKey });
      message.success(t('Saved successfully'));
      await dataSource?.reload?.();
    } catch (error) {
      notification.error({
        message: t('Save failed'),
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={style}>
      {t(
        'If a collection lacks a primary key, you must configure a unique record key to locate row records within a block, failure to configure this will prevent the creation of data blocks for the collection.',
      )}
      {size === 'small' ? <br /> : ' '}
      <Space.Compact style={{ marginTop: 5 }}>
        <Select
          mode="multiple"
          placeholder={t('Select field')}
          options={options}
          value={filterTargetKey}
          loading={saving}
          size="small"
          style={{ minWidth: 200 }}
          onChange={(value) => setFilterTargetKey(value.map(String))}
        />
        <Popconfirm
          placement="bottom"
          title={
            <div style={{ width: '15em' }}>
              {selectedTitle
                ? t(
                    'Are you sure you want to set the "{{title}}" field as a record unique key? This setting cannot be changed after it\'s been set.',
                    { title: selectedTitle },
                  )
                : t('Please select a field.')}
            </div>
          }
          onConfirm={handleConfirm}
        >
          <Button type="primary" size="small" loading={saving}>
            {t('OK')}
          </Button>
        </Popconfirm>
      </Space.Compact>
    </div>
  );
}

export function RecordUniqueKeyWarningIcon(props: {
  collection: Record<string, unknown>;
  dataSourceKey: string;
  fields?: CollectionFieldRecord[];
  onSaved?: (values: { filterTargetKey: string[] }) => void;
}) {
  const t = useT();

  if (!collectionNeedsRecordUniqueKey(props.collection, props.fields)) {
    return null;
  }

  return (
    <Popover
      trigger={['click']}
      content={
        <RecordUniqueKeyPrompt
          collection={props.collection}
          dataSourceKey={props.dataSourceKey}
          fields={props.fields}
          onSaved={props.onSaved}
          size="small"
          style={{ width: '20em' }}
        />
      }
    >
      <Button
        aria-label={t('Record unique key')}
        icon={<ExclamationCircleTwoTone twoToneColor="#faad14" />}
        size="small"
        type="text"
        style={{ height: 20, marginRight: 2, padding: 0, width: 20 }}
      />
    </Popover>
  );
}
