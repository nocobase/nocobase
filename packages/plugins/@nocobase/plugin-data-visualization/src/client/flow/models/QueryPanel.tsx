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
import { configStore } from './config-store';
import { ResultPanel } from './ResultPanel';
import { ChartBlockModel } from './ChartBlockModel';
import { ChartResource } from '../resources/ChartResource';
import { SQLResource, useFlowSettingsContext } from '@nocobase/flow-engine';

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
  const api = useAPIClient();
  const ctx = useFlowSettingsContext<ChartBlockModel>();
  const mode = form?.values?.query?.mode || 'builder';

  const [showResult, setShowResult] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const handleRun = async () => {
    try {
      setRunning(true);

      const query = form.values?.query;

      // builder 模式需要先提交表单做校验；sql 模式不需要
      if (query?.mode === 'builder') {
        await form.submit();
      }

      ctx.model.checkResource(query); // 保证 resource 正确
      if (query?.mode === 'sql') {
        (ctx.model.resource as SQLResource).setDebug(true); // 开启 debug 模式，sql 查询不要走 runById
      }

      await ctx.model.runQueryAndUpdateResult(query);

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
