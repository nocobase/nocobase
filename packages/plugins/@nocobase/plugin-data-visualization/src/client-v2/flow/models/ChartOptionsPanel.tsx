/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert, Button, Radio } from 'antd';
import { ChartOptionsEditor } from './ChartOptionsEditor';
import { useT } from '../../locale';
import { FunctionOutlined, LineChartOutlined } from '@ant-design/icons';
import { ChartOptionsBuilder } from './ChartOptionsBuilder';
import { configStore } from './config-store';
import { observer, useFlowSettingsContext, type RunJSValue } from '@nocobase/flow-engine';
import type { RunJSSourceLocator } from '@nocobase/client-v2';
import { getFieldOptions } from './QueryBuilder.service';
import { useCompile } from '../utils';
import { cloneFormValues } from './cloneFormValues';

const flattenFieldOptionMap = (options: any[] = [], prefix: string[] = [], map = new Map<string, any>()) => {
  for (const option of options) {
    if (!option?.name) continue;
    const path = [...prefix, option.name];
    map.set(path.join('.'), option);
    if (option.children?.length) {
      flattenFieldOptionMap(option.children, path, map);
    }
  }
  return map;
};

const toFieldPath = (field: string | string[] | undefined) => {
  if (!field) return '';
  return Array.isArray(field) ? field.filter(Boolean).join('.') : field;
};

const getFormValues = (ctx: any) => ctx.getStepFormValues('chartSettings', 'configure') || {};

const setIn = (target: any, path: string[], value: any) => {
  let cursor = target;
  path.slice(0, -1).forEach((key) => {
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  });
  cursor[path[path.length - 1]] = value;
};

export const chartOptionDefaultValue = `return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
`;

export const ChartOptionsPanel: React.FC = observer(() => {
  const t = useT();
  const ctx = useFlowSettingsContext<any>();
  const dm = ctx?.model?.context?.dataSourceManager;
  const compile = useCompile();
  const uid = ctx?.model?.uid;
  const [, forceUpdate] = React.useState(0);
  React.useSyncExternalStore(
    configStore.subscribe,
    () => configStore.version,
    () => configStore.version,
  );
  const previewData = configStore.results[uid]?.result;
  const previewColumns = React.useMemo<string[]>(() => Object.keys(previewData?.[0] ?? {}), [previewData]);
  const formValues = getFormValues(ctx);
  const query = formValues?.query;
  const collectionPath = query?.collectionPath;

  const fieldOptionMap = React.useMemo(() => {
    return flattenFieldOptionMap(getFieldOptions(dm, compile, collectionPath));
  }, [collectionPath, compile, dm]);

  const columnOptions = React.useMemo(() => {
    const items = [...(query?.dimensions || []), ...(query?.measures || [])];
    const queryColumnMap = new Map<string, any>();
    const derivedColumns: string[] = [];

    for (const item of items) {
      const fieldPath = toFieldPath(item?.field);
      if (!fieldPath) continue;
      const key = item?.alias || fieldPath;
      const fieldOption = fieldOptionMap.get(fieldPath);
      queryColumnMap.set(key, {
        ...(fieldOption || {}),
        key,
        name: key,
        value: key,
        label: item?.alias || fieldOption?.title || fieldPath,
      });
      derivedColumns.push(key);
    }

    const columns = Array.from(new Set([...derivedColumns, ...previewColumns]));

    return columns.map((column) => ({
      ...(queryColumnMap.get(column) || fieldOptionMap.get(column) || {}),
      value: column,
      label: queryColumnMap.get(column)?.label || fieldOptionMap.get(column)?.title || column,
    }));
  }, [fieldOptionMap, previewColumns, query?.dimensions, query?.measures]);

  const mode = formValues?.chart?.option?.mode || 'basic';
  const builderValue = formValues?.chart?.option?.builder;
  const rawValue = formValues?.chart?.option?.raw;
  const sourceLocator: RunJSSourceLocator | undefined = uid
    ? {
        kind: 'chart.option',
        modelUid: uid,
      }
    : undefined;

  // 当 raw 尚未初始化时，设置默认值（等效于原先 Field 的 initialValue 行为）
  React.useEffect(() => {
    if (mode === 'custom' && !rawValue) {
      setIn(getFormValues(ctx), ['chart', 'option', 'raw'], chartOptionDefaultValue);
    }
  }, [ctx, mode, rawValue]);

  const handleBuilderChange = async (next: any) => {
    const values = getFormValues(ctx);
    setIn(values, ['chart', 'option', 'builder'], next);
    await ctx.model.onPreview(values);
  };

  const handleRawChange = async (raw: string) => {
    setIn(getFormValues(ctx), ['chart', 'option', 'raw'], raw);
    forceUpdate((v) => v + 1);
  };

  const handleRawPreview = async (next: RunJSValue) => {
    const values = cloneFormValues(getFormValues(ctx));
    setIn(values, ['chart', 'option', 'mode'], 'custom');
    setIn(values, ['chart', 'option', 'raw'], next.code);
    await ctx.model.onPreview(values);
  };

  const userId = ctx.auth?.user?.id ?? 'anonymous';
  const TIP_KEY = `plugin-data-visualization:ChartConfig:tipRunQuery:${userId}`;

  const [showFirstVisitTip, setShowFirstVisitTip] = React.useState(false);
  React.useEffect(() => {
    setShowFirstVisitTip(!localStorage.getItem(TIP_KEY));
  }, [TIP_KEY]);

  return (
    <>
      {showFirstVisitTip && (
        <Alert
          message={t("Please click 'Run Query' to fetch data before configuring chart options")}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 8, paddingLeft: 8 }}
          onClose={() => {
            localStorage.setItem(TIP_KEY, '1');
            setShowFirstVisitTip(false);
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: 1,
        }}
      >
        <Radio.Group
          value={mode}
          onChange={(e) => {
            setIn(getFormValues(ctx), ['chart', 'option', 'mode'], e.target.value);
            forceUpdate((v) => v + 1);
          }}
        >
          <Radio.Button value={'basic'}>
            <LineChartOutlined /> {t('Basic')}
          </Radio.Button>
          <Radio.Button value={'custom'}>
            <FunctionOutlined /> {t('Custom')}
          </Radio.Button>
        </Radio.Group>

        {mode === 'custom' ? (
          <Button
            type="link"
            style={{ marginRight: '8px' }}
            onClick={async () => {
              await ctx.model.onPreview(getFormValues(ctx));
            }}
          >
            {t('Preview')}
          </Button>
        ) : null}
      </div>

      {mode === 'basic' ? (
        <ChartOptionsBuilder
          columns={columnOptions.map((item) => item.value)}
          fieldOptions={columnOptions}
          query={query}
          initialValues={builderValue}
          onChange={handleBuilderChange}
        />
      ) : (
        <div>
          <ChartOptionsEditor
            value={rawValue ?? chartOptionDefaultValue}
            onChange={handleRawChange}
            sourceLocator={sourceLocator}
            sourceLabel={t('Chart option')}
            onPreview={handleRawPreview}
          />
        </div>
      )}
    </>
  );
});
