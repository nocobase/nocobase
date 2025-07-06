/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Table as AntdTable, Checkbox, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useT } from '../../locale';
import { useApp } from '@nocobase/client';
import { Schema } from '@formily/react';
import lodash from 'lodash';

const useColumns = () => {
  const t = useT();
  const columns: TableColumnsType = [
    { title: t('Collection display name'), dataIndex: 'title', key: 'title', width: 200 },
    { title: t('Collection name'), dataIndex: 'name', key: 'name', width: 150 },
    {
      title: t('Collection template'),
      dataIndex: 'template',
      key: 'template',
      width: 150,
      render: (value) => {
        const template = value.charAt(0).toUpperCase() + value.slice(1);
        return <Tag>{t(`${template} collection`)}</Tag>;
      },
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      key: 'description',
      width: 350,
    },
    {
      title: t('Preset fields'),
      key: 'preset',
      width: 300,
      render: (_, record) => {
        const value = [];
        if (record.autoGenId !== false) {
          value.push('id');
        }
        if (record.createdAt !== false) {
          value.push('createdAt');
        }
        if (record.updatedAt !== false) {
          value.push('updatedAt');
        }
        if (record.createdBy) {
          value.push('createdBy');
        }
        if (record.updatedBy) {
          value.push('updatedBy');
        }
        return (
          <Checkbox.Group
            options={[
              {
                label: 'ID',
                value: 'id',
              },
              {
                label: t('Created at'),
                value: 'createdAt',
              },
              {
                label: t('Last Updated at'),
                value: 'updatedAt',
              },
              {
                label: t('Created by'),
                value: 'createdBy',
              },
              {
                label: t('Last updated by'),
                value: 'updatedBy',
              },
            ]}
            defaultValue={value}
            disabled
          />
        );
      },
    },
  ];
  return columns;
};

const useExpandColumns = () => {
  const t = useT();
  const app = useApp();
  const fim = app.dataSourceManager.collectionFieldInterfaceManager;
  const columns = [
    {
      title: t('Field display name'),
      dataIndex: 'title',
      width: 150,
      key: 'title',
    },
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: t('Field interface'),
      width: 150,
      dataIndex: 'interface',
      key: 'interface',
      render: (value) => {
        const fieldInterface = fim.getFieldInterface(value);
        return <Tag>{fieldInterface ? Schema.compile(fieldInterface.title, { t }) : value}</Tag>;
      },
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: t('Options'),
      key: 'options',
      render: (_, record) => {
        return JSON.stringify(lodash.omit(record, ['title', 'name', 'interface', 'description']), null, 2);
      },
    },
  ];
  return columns;
};

const ExpandedRowRender = (record) => {
  const expandColumns = useExpandColumns();
  return <AntdTable rowKey="name" columns={expandColumns} dataSource={record.fields} pagination={false} />;
};

export const Table: React.FC<{
  collections: any[];
}> = ({ collections }) => {
  const columns = useColumns();

  return (
    <AntdTable
      scroll={{
        y: '60vh',
      }}
      style={{
        height: '70vh',
      }}
      rowKey="name"
      columns={columns}
      dataSource={collections}
      expandable={{
        expandedRowRender: ExpandedRowRender,
        rowExpandable: (record) => record.fields && record.fields.length > 0,
      }}
    />
  );
};
