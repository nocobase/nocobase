/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useState } from 'react';
import { useT } from '../../locale';
import { Collapse, Card, Tabs, Button } from 'antd';
import { PlaySquareOutlined } from '@ant-design/icons';
import { QueryPanel } from './QueryPanel';
import { ChartOptionsPanel } from './ChartOptionsPanel';
import { useFlowSettingsContext, useFlowView } from '@nocobase/flow-engine';
import { useForm } from '@formily/react';
import { useRequest, useAPIClient } from '@nocobase/client';
import { configStore } from './config-store';
import { ChartBlockModel } from './ChartBlockModel';
import { ResultPanel } from './ResultPanel';
import { AxiosError } from 'axios';
import { EventsPanel } from './EventsPanel';
import { parseField, removeUnparsableFilter } from '../../utils';

const RunButton: React.FC = memo(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext();
  const api = useAPIClient();

  const { loading, run } = useRequest(
    async () => {
      const mode = form?.values?.query?.mode || 'sql';

      if (mode === 'sql') {
        const sql = form.values?.query?.sql;
        if (!sql) return;
        return ctx.sql.run(sql);
      }

      // builder 模式
      const collectionPath: string[] | undefined = form?.values?.settings?.collection;
      const [dataSource, collection] = collectionPath || [];
      const query = form?.values?.query || {};
      if (!(collection && (query?.measures?.length || 0) > 0)) return;

      const res = await api.request({
        url: 'charts:query',
        method: 'POST',
        data: {
          uid: ctx.model.uid,
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
      return res?.data?.data;
    },
    {
      manual: true,
      onSuccess(result) {
        configStore.setResult(ctx.model.uid, result);
      },
      onError(
        error: AxiosError<{
          errors: { message: string }[];
        }>,
      ) {
        const message = error?.response?.data?.errors?.map?.((error: any) => error.message).join('\n') || error.message;
        configStore.setError(ctx.model.uid, message);
      },
    },
  );

  return (
    <Button type="link" loading={loading} icon={<PlaySquareOutlined />} onClick={run}>
      {t('Run query')}
    </Button>
  );
});

export const ConfigPanel: React.FC = () => {
  const t = useT();
  const ctx = useFlowSettingsContext<ChartBlockModel>();
  const form = useForm();
  const api = useAPIClient();
  const currentView = useFlowView();

  const onPreviewClick = () => {
    ctx.model.setStepParams('chartSettings', 'configure', form.values);
    ctx.model.applyFlow('chartSettings');
  };
  // useEffect(() => {
  //   const id = uid();
  //   form.addEffects(id, () => {
  //     onFormValuesChange((form) => {
  //       ctx.model.setStepParams('chartSettings', 'configure', form.values);
  //       ctx.model.applyFlow('chartSettings');
  //     });
  //   });

  //   return () => form.removeEffects(id);
  // }, [ctx.model, form]);

  useEffect(() => {
    const uid = ctx.model.uid;
    configStore.setError(uid, null);

    const mode = form?.values?.query?.mode || 'sql';

    // 源码模式
    const doSqlPreview = async (sql: string) => {
      try {
        const result = await ctx.sql.run(sql);
        configStore.setResult(uid, result);
      } catch (error: any) {
        const message = error?.response?.data?.errors?.map?.((e: any) => e.message).join('\n') || error.message;
        configStore.setError(uid, message);
      }
    };

    // 图形模式
    const doBuilderPreview = async () => {
      const collectionPath: string[] | undefined = form?.values?.settings?.collection;
      const [dataSource, collection] = collectionPath || [];
      const query = form?.values?.query || {};
      if (!(collection && (query?.measures?.length || 0) > 0)) return;
      try {
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
      } catch (error: any) {
        const message = error?.response?.data?.errors?.map?.((e: any) => e.message).join('\n') || error.message;
        configStore.setError(uid, message);
      }
    };

    // init fetch preview data
    if (!configStore[uid]?.result) {
      if (mode === 'sql') {
        const sql = form?.values?.query?.sql;
        if (sql) {
          doSqlPreview(sql);
        }
      } else {
        doBuilderPreview();
      }
    }

    return () => {
      configStore.setResult(uid, null);
      configStore.setError(uid, null);
    };
  }, [ctx.model.uid, form?.values?.query?.mode, form?.values?.query?.sql, form?.values?.settings?.collection]);

  // 默认展开前两个面板（'query' 和 'chartOptions'）
  const [activeKeys, setActiveKeys] = useState<string | string[]>(['query', 'chartOptions']);

  // 根据当前展开数量动态分配每个面板的高度；只展开一个时占满原高度
  const getCardStyle = (panelKey: string) => {
    const keys = Array.isArray(activeKeys) ? activeKeys : [activeKeys];
    const isOpen = keys.includes(panelKey);
    const openedCount = Math.max(keys.length, 1);
    const height = openedCount > 0 ? `calc((100vh - 288px) / ${openedCount})` : 'calc(100vh - 288px)';
    return {
      height: isOpen ? height : undefined,
      overflow: 'auto',
      border: 'none',
    } as React.CSSProperties;
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          textAlign: 'right',
        }}
      >
        <Button type="primary" onClick={onPreviewClick}>
          {t('Preview')}
        </Button>
      </div>

      <Collapse activeKey={activeKeys} onChange={setActiveKeys}>
        <Collapse.Panel header={t('Query & Result')} key="query">
          <Card style={getCardStyle('query')} styles={{ body: { padding: 0 } }}>
            <Tabs
              tabBarExtraContent={<RunButton />}
              items={[
                {
                  label: t('Query'),
                  key: 'query',
                  children: <QueryPanel />,
                },
                {
                  label: t('Result'),
                  key: 'result',
                  children: <ResultPanel />,
                },
              ]}
            />
          </Card>
        </Collapse.Panel>

        <Collapse.Panel header={t('Chart options')} key="chartOptions">
          <Card style={getCardStyle('chartOptions')} styles={{ body: { padding: 0 } }}>
            <ChartOptionsPanel />
          </Card>
        </Collapse.Panel>
        <Collapse.Panel header={t('Events')} key="events">
          <Card style={getCardStyle('events')} styles={{ body: { padding: 0 } }}>
            <EventsPanel />
          </Card>
        </Collapse.Panel>
      </Collapse>

      {/* 定制 Drawer Footer */}
      {/* <currentView.Footer>
        <Button type="primary" onClick={onPreviewClick}>
          {t('Preview')}
        </Button>
      </currentView.Footer> */}
    </div>
  );
};
