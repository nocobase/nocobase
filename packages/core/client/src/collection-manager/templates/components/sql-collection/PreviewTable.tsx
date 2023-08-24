import { useAsyncData } from '../../../../async-data-provider';
import React, { useEffect } from 'react';
import { Table } from 'antd';
import { Schema, observer, useForm } from '@formily/react';
import { useTranslation } from 'react-i18next';

export const PreviewTable = observer(() => {
  const { data: res, loading, error } = useAsyncData();
  const { data } = res || {};
  const { t } = useTranslation();
  const form = useForm();

  const fields = form.values.fields || [];
  const titleMp = fields.reduce((mp: { [name: string]: string }, field: any) => {
    mp[field.name] = field?.uiSchema?.title;
    return mp;
  }, {});

  const columns = error
    ? []
    : Object.keys(data?.[0] || {}).map((col) => {
        const title = titleMp[col];
        return {
          title: Schema.compile(title || col, { t }),
          dataIndex: col,
          key: col,
        };
      });

  const dataSource = error
    ? []
    : data?.map((record: any, index: number) => {
        const compiledRecord = Object.entries(record).reduce(
          (mp: { [key: string]: any }, [key, val]: [string, any]) => {
            if (typeof val !== 'string') {
              mp[key] = val;
              return mp;
            }
            const compiled = Schema.compile(val, { t });
            mp[key] = t(compiled);
            return mp;
          },
          {},
        );
        return { ...compiledRecord, key: index };
      });

  return (
    <Table
      bordered
      dataSource={dataSource}
      columns={columns}
      scroll={{ x: columns.length * 150, y: 300 }}
      loading={loading}
      rowKey="key"
    />
  );
});
