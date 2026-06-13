/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { SQLEditor } from './SQLEditor';
import { Radio, Button, Space } from 'antd';
import { useT } from '../../locale';
import { BuildOutlined, ConsoleSqlOutlined, RightOutlined, DownOutlined, RightSquareOutlined } from '@ant-design/icons';
import { QueryBuilder, QueryBuilderRef } from './QueryBuilder';
import { ResultPanel } from './ResultPanel';
import { observer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { configStore } from './config-store';
import { validateQuery } from './QueryBuilder.service';

const defaultSQL = `SELECT * FROM my_table
LIMIT 200;`;

const getFormValues = (ctx: any) => ctx.getStepFormValues('chartSettings', 'configure') || {};

const setIn = (target: any, path: string[], value: any) => {
  let cursor = target;
  path.slice(0, -1).forEach((key) => {
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  });
  cursor[path[path.length - 1]] = value;
};

const QueryMode: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
}> = ({ value = 'builder', onChange, onClick }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(e) => {
        const value = e.target.value;
        onChange?.(value);
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
};

export const QueryPanel: React.FC = observer(() => {
  const t = useT();
  const ctx = useFlowSettingsContext<any>();
  const formValues = getFormValues(ctx);
  const query = formValues?.query || {};
  const mode = query?.mode || 'builder';
  const qbRef = React.useRef<QueryBuilderRef>(null);

  const [showResult, setShowResult] = useState(false);
  const [running, setRunning] = useState(false);
  const [, forceUpdate] = useState(0);

  React.useEffect(() => {
    if (mode === 'sql') {
      const values = getFormValues(ctx);
      const currentSql = values?.query?.sql;
      if (!currentSql || !String(currentSql).trim()) {
        setIn(values, ['query', 'sql'], defaultSQL);
      }
    }
  }, [ctx, mode]);

  const updateQuery = (nextQuery: any) => {
    const values = getFormValues(ctx);
    values.query = {
      ...(values.query || {}),
      ...nextQuery,
    };
    forceUpdate((v) => v + 1);
  };

  const handleRunQuery = async () => {
    try {
      setRunning(true);
      if (mode === 'builder') {
        try {
          await qbRef.current?.validate();
        } catch {
          setRunning(false);
          return;
        }
      }

      const values = getFormValues(ctx);
      const query = values?.query;
      const { success, message } = validateQuery(query);
      if (!success) {
        configStore.setError(ctx.model.uid, message);
        setShowResult(true);
        return;
      }

      await ctx.model.onPreview(values, true);
    } catch (error: any) {
      configStore.setError(ctx.model.uid, error?.message);
      setShowResult(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingTop: 1,
            paddingLeft: 1,
          }}
        >
          <QueryMode
            value={mode}
            onClick={() => setShowResult(false)}
            onChange={(value) => updateQuery({ mode: value })}
          />
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
          <QueryBuilder ref={qbRef} value={query} onChange={updateQuery} />
        ) : (
          <SQLEditor
            value={query?.sql}
            dataSource={query?.sqlDatasource}
            onChange={(sql) => updateQuery({ sql })}
            onDataSourceChange={(sqlDatasource) => updateQuery({ sqlDatasource })}
          />
        )}
      </>
    </>
  );
});
