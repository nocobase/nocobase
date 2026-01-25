/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField, Field, connect, useForm } from '@formily/react';
import React, { useState } from 'react';
import { SQLEditor } from './SQLEditor';
import { Radio, Button, Space } from 'antd';
import { useT } from '../../locale';
import { BuildOutlined, ConsoleSqlOutlined, RightOutlined, DownOutlined, RightSquareOutlined } from '@ant-design/icons';
import { QueryBuilder } from './QueryBuilder';
import { ResultPanel } from './ResultPanel';
import { observer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { configStore } from './config-store';
import { validateQuery } from './QueryBuilder.service';

const defaultSQL = `SELECT * FROM my_table
LIMIT 200;`;

const QueryMode: React.FC = connect(({ value = 'builder', onChange, onClick }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(e) => {
        const value = e.target.value;
        onChange(value);
      }}
    >
      <Radio.Button value="builder" onClick={() => onClick?.()}>
        <BuildOutlined /> {t('Builder')}
      </Radio.Button>
      <Radio.Button value="sql" onClick={() => onClick?.()}>
        <ConsoleSqlOutlined /> {t('SQL')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const QueryPanel: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext<any>();
  const mode = form?.values?.query?.mode || 'builder';
  const qbRef = React.useRef(null);

  const [showResult, setShowResult] = useState(false);
  const [running, setRunning] = useState(false);

  React.useEffect(() => {
    // 在 SQL 模式下，隐藏并取消校验 builder 模式相关字段，避免全表单 submit 时的必填校验
    const builderAddrs = ['collectionPath', 'measures', 'dimensions', 'filter', 'orders', 'limit', 'offset'];
    if (mode === 'sql') {
      // 新增：SQL 模式默认模板（仅在当前为空时设置）
      const currentSql = form?.values?.query?.sql;
      if (!currentSql || !String(currentSql).trim()) {
        form?.setValuesIn?.('query.sql', defaultSQL);
      }

      builderAddrs.forEach((addr) => {
        form.setFieldState(`query.${addr}`, (state: any) => {
          state.display = 'none';
          state.required = false;
        });
      });
      // 处理 measures 与 dimensions 内部项的 required
      form.query('query.measures.*.*').forEach((field: any) =>
        field.setState((state: any) => {
          state.display = 'none';
          state.required = false;
        }),
      );
      form.query('query.dimensions.*.*').forEach((field: any) =>
        field.setState((state: any) => {
          state.display = 'none';
          state.required = false;
        }),
      );
    } else {
      // 切回 builder 模式时，仅恢复显示；required 由原组件/Schema 再决定
      builderAddrs.forEach((addr) => {
        form.setFieldState(`query.${addr}`, (state: any) => {
          state.display = 'visible';
        });
      });
      form.query('query.measures.*.*').forEach((field: any) =>
        field.setState((state: any) => {
          state.display = 'visible';
        }),
      );
      form.query('query.dimensions.*.*').forEach((field: any) =>
        field.setState((state: any) => {
          state.display = 'visible';
        }),
      );
    }
  }, [mode, form]);

  // 图形化模式
  const handleBuilderChange = async (next: any) => {
    const query = form?.values?.query || {};
    form?.setValuesIn?.('query', {
      ...next,
      mode: query.mode,
      sql: query.sql,
    });
  };

  // SQL 模式
  // const handleSqlChange = async (sql: string) => {
  //   form?.setValuesIn?.('query.sql', sql);
  // };

  const handleRunQuery = async () => {
    console.log('---handleRunQuery', form.values?.query);
    try {
      setRunning(true);
      // 触发下层 QueryBuilder 的校验
      if (mode === 'builder') {
        try {
          await qbRef.current?.validate();
        } catch {
          setRunning(false);
          return;
        }
      }

      // 业务自定义校验
      const query = form.values?.query;
      const { success, message } = validateQuery(query);
      if (!success) {
        configStore.setError(ctx.model.uid, message);
        setShowResult(true);
        return;
      }

      // 通过校验后，写入查询参数并预览
      await ctx.model.onPreview(form.values, true);
      // 调整为不自动展示结果预览
      // setShowResult(true);
    } catch (error: any) {
      configStore.setError(ctx.model.uid, error?.message);
      setShowResult(true);
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
            // 解决父容器裁剪导致圆角/边框被吃掉的问题
            paddingTop: 1,
            paddingLeft: 1,
          }}
        >
          {/* 左边：模式切换，点击时收起数据结果预览 */}
          <Field name="mode" component={[QueryMode, { onClick: () => setShowResult(false) }]} />
          {/* 右边： 运行查询、结果 */}
          <Space>
            <Button type="link" loading={running} onClick={handleRunQuery}>
              <RightSquareOutlined />
              {t('Run query')}
            </Button>
            <Button
              type="link"
              aria-expanded={showResult}
              onClick={() => setShowResult((v) => !v)}
              style={{ padding: 0 }}
            >
              {showResult ? t('Hide data') : t('View data')}
              {showResult ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
            </Button>
          </Space>
        </div>

        {showResult ? (
          <div style={{ marginTop: 8 }}>
            <ResultPanel />
          </div>
        ) : mode === 'builder' ? (
          <QueryBuilder ref={qbRef} initialValues={form?.values?.query} onChange={handleBuilderChange} />
        ) : (
          <Field name="sql" component={[SQLEditor]} />
        )}
      </ObjectField>
    </>
  );
});
