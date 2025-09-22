/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField, Field, connect, useForm, observer } from '@formily/react';
import React from 'react';
import { SQLEditor } from './SQLEditor';
import { Radio, Button, Space } from 'antd';
import { useT } from '../../locale';
import { BuildOutlined, ConsoleSqlOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { QueryBuilder } from './QueryBuilder';
import { useAPIClient } from '@nocobase/client';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { configStore } from './config-store';
import { ResultPanel } from './ResultPanel';
import { parseField, removeUnparsableFilter } from '../../utils';

const QueryMode: React.FC = connect(({ value = 'sql', onChange, onClick }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(e) => {
        const value = e.target.value;
        onChange(value);
      }}
    >
      <Radio.Button value="builder" onClick={() => onClick?.('builder')}>
        <BuildOutlined /> {t('Query builder')}
      </Radio.Button>
      <Radio.Button value="sql" onClick={() => onClick?.('sql')}>
        <ConsoleSqlOutlined /> {t('SQL')}
      </Radio.Button>
    </Radio.Group>
  );
});

// 核心修改：将顶部“模式切换 + Result/Run”合并到本组件的一行头部
export const QueryPanel: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const api = useAPIClient();
  const ctx = useFlowSettingsContext();
  const mode = form?.values?.query?.mode || 'sql';

  const [showResult, setShowResult] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const handleRun = async () => {
    try {
      setRunning(true);
      const uid = ctx.model.uid;

      if ((form?.values?.query?.mode || 'sql') === 'sql') {
        const sql = form.values?.query?.sql;
        if (!sql) return;
        const result = await ctx.sql.run(sql);
        configStore.setResult(uid, result);
      } else {
        const collectionPath: string[] | undefined = form?.values?.settings?.collection;
        const [dataSource, collection] = collectionPath || [];
        const query = form?.values?.query || {};
        if (!(collection && (query?.measures?.length || 0) > 0)) return;

        const res = await api.request({
          url: 'charts:query',
          method: 'POST',
          data: {
            uid,
            dataSource,
            collection,
            ...query,
            filter: removeUnparsableFilter(query.filter),
            dimensions: (query?.dimensions || []).map((item: any) => {
              const dimension = { ...item };
              if (item.format && !item.alias) {
                const { alias } = parseField(item.field);
                dimension.alias = alias;
              }
              return dimension;
            }),
            measures: (query?.measures || []).map((item: any) => {
              const measure = { ...item };
              if (item.aggregation && !item.alias) {
                const { alias } = parseField(item.field);
                measure.alias = alias;
              }
              return measure;
            }),
          },
        });
        configStore.setResult(uid, res?.data?.data);
      }
    } catch (error: any) {
      const message = error?.response?.data?.errors?.map?.((e: any) => e.message).join('\n') || error.message;
      configStore.setError(ctx.model.uid, message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <ObjectField name="query">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          {/* 左边：模式切换，点击时收起数据结果预览 */}
          <Field name="mode" component={[QueryMode, { onClick: () => setShowResult(false) }]} />
          {/* 右边： 运行查询、结果 */}
          <Space size={8}>
            <Button type="link" loading={running} onClick={handleRun}>
              {t('Run query')}
            </Button>
            <Button type="link" aria-expanded={showResult} onClick={() => setShowResult((v) => !v)}>
              {t('Preview Data')}
              {showResult ? <DownOutlined /> : <RightOutlined />}
            </Button>
          </Space>
        </div>

        {showResult ? (
          <div style={{ marginTop: 8 }}>
            <ResultPanel />
          </div>
        ) : mode === 'builder' ? (
          <QueryBuilder />
        ) : (
          <Field name="sql" component={[SQLEditor]} />
        )}
      </ObjectField>
    </>
  );
});
