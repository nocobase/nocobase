/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataBlockModel, useApp } from '@nocobase/client-v2';
import { Empty, Spin, Table, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { tExpr } from '../locale';

const normalizeRows = (value: any) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return [value];
  }
  return [];
};

const DataSetTable = ({ data = [] }: { data: Record<string, any>[] }) => {
  const columns = Object.keys(data[0] || {}).map((key) => ({
    title: key,
    dataIndex: key,
    key,
    render: (value: any) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'object') {
        return <Typography.Text>{JSON.stringify(value)}</Typography.Text>;
      }
      return <Typography.Text>{String(value)}</Typography.Text>;
    },
  }));

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={data.map((record, index) => ({ ...record, __chartRowKey: index }))}
      rowKey="__chartRowKey"
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

const LegacyChartBlock = ({ model }: { model: LegacyChartBlockModel }) => {
  const app = useApp();
  const queryId = model.props.queryId;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!queryId) {
      setData([]);
      return;
    }

    let disposed = false;
    setLoading(true);
    setError(null);
    void app.apiClient
      .request({
        url: `/chartsQueries:getData/${queryId}`,
      })
      .then(({ data: response }) => {
        if (disposed) {
          return;
        }
        setData(normalizeRows(response?.data ?? response));
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!disposed) {
          setError(err);
        }
      });

    return () => {
      disposed = true;
    };
  }, [app.apiClient, queryId]);

  if (!queryId) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.translate('Please configure chart')} />;
  }

  if (error) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error.message} />;
  }

  return (
    <Spin spinning={loading}>
      {data.length ? <DataSetTable data={data} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
    </Spin>
  );
};

export class LegacyChartBlockModel extends DataBlockModel {
  renderComponent() {
    return <LegacyChartBlock model={this} />;
  }
}

LegacyChartBlockModel.registerFlow({
  key: 'legacyChartSettings',
  title: tExpr('Chart settings'),
  steps: {
    query: {
      title: tExpr('Query'),
      uiSchema(ctx) {
        return {
          queryId: {
            title: ctx.t('Query ID'),
            'x-component': 'InputNumber',
            'x-decorator': 'FormItem',
            required: true,
            'x-component-props': {
              min: 1,
              precision: 0,
            },
          },
        };
      },
      defaultParams(ctx) {
        return {
          queryId: ctx.model.props.queryId,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          queryId: params.queryId,
        });
        ctx.model.rerender();
      },
    },
    blockHeight: {
      use: 'blockHeight',
    },
  },
});

LegacyChartBlockModel.define({
  label: tExpr('Chart (deprecated)'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'LegacyChartBlockModel',
  },
  sort: 710,
});
