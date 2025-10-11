/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField, Field, connect, useForm, observer } from '@formily/react';
import React, { useState } from 'react';
import { SQLEditor } from './SQLEditor';
import { Radio, Button, Space } from 'antd';
import { useT } from '../../locale';
import { BuildOutlined, ConsoleSqlOutlined, RightOutlined, DownOutlined, RightSquareOutlined } from '@ant-design/icons';
import { QueryBuilder } from './QueryBuilder';
import { ResultPanel } from './ResultPanel';
import { ChartBlockModel } from './ChartBlockModel';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { sleep } from '../utils';

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
        <BuildOutlined /> {t('Query builder')}
      </Radio.Button>
      <Radio.Button value="sql" onClick={() => onClick?.()}>
        <ConsoleSqlOutlined /> {t('SQL')}
      </Radio.Button>
    </Radio.Group>
  );
});

// 核心修改：将顶部“模式切换 + Result/Run”合并到本组件的一行头部
export const QueryPanel: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext<ChartBlockModel>();
  const mode = form?.values?.query?.mode || 'builder';

  React.useEffect(() => {
    // 在 SQL 模式下，隐藏并取消校验 builder 模式相关字段，避免全表单 submit 时的必填校验
    const builderAddrs = ['collectionPath', 'measures', 'dimensions', 'filter', 'orders', 'limit', 'offset'];
    if (mode === 'sql') {
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

  const [showResult, setShowResult] = useState(false);
  const [running, setRunning] = useState(false);

  const handleRunQuery = async () => {
    try {
      setRunning(true);
      // builder 模式先提交表单做校验；sql 模式不需要校验
      if (form.values?.mode === 'builder') {
        await form.submit();
      }
      // 写入查询参数，统一走 onPreview 方便回滚
      await ctx.model.onPreview(form.values, true);
      // 显示数据结果面板
      setShowResult(true);
    } catch (error: any) {
      console.error(error);
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
            // 解决父容器裁剪导致圆角/边框被吃掉
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
            <Button type="link" aria-expanded={showResult} onClick={() => setShowResult((v) => !v)}>
              {t('Data result')}
              {showResult ? <DownOutlined /> : <RightOutlined />}
            </Button>
          </Space>
        </div>
        {/* 下面保持不变 */}
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
