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
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { configStore } from './config-store';
import { validateQuery } from './QueryBuilder.service';

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

export const QueryPanel: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext<any>();
  const mode = form?.values?.query?.mode || 'builder';
  const qbRef = React.useRef(null);

  const [showResult, setShowResult] = useState(false);
  const [running, setRunning] = useState(false);

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
            <Button type="link" aria-expanded={showResult} onClick={() => setShowResult((v) => !v)}>
              {showResult ? t('Hide data') : t('View data')}
              {showResult ? <DownOutlined /> : <RightOutlined />}
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
