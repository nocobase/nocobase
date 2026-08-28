/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table } from '@nocobase/client-v2';
import { Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { useT } from '../../locale';

export type UnsupportedFieldRecord = Record<string, unknown>;

function getFieldValue(record: UnsupportedFieldRecord, key: 'field' | 'name' | 'rawType' | 'type') {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

export function UnsupportedFields(props: { dataSource?: UnsupportedFieldRecord[]; style?: React.CSSProperties }) {
  const t = useT();
  const dataSource = Array.isArray(props.dataSource) ? props.dataSource : [];
  const columns = useMemo<ColumnsType<UnsupportedFieldRecord>>(
    () => [
      {
        title: t('Field name'),
        render: (_, record) => getFieldValue(record, 'name') || getFieldValue(record, 'field'),
      },
      {
        title: t('Field database type'),
        render: (_, record) => getFieldValue(record, 'rawType') || getFieldValue(record, 'type'),
      },
    ],
    [t],
  );

  if (!dataSource.length) {
    return null;
  }

  return (
    <div style={props.style}>
      <Divider plain orientation="left" orientationMargin="0">
        <h3>{t('Unknown field type')}</h3>
      </Divider>
      <div style={{ marginBottom: 15 }}>
        {t('The following field types are not compatible and do not support output and display')}
      </div>
      <Table<UnsupportedFieldRecord>
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey={(record) =>
          getFieldValue(record, 'name') ||
          getFieldValue(record, 'field') ||
          getFieldValue(record, 'rawType') ||
          getFieldValue(record, 'type') ||
          ''
        }
      />
    </div>
  );
}
