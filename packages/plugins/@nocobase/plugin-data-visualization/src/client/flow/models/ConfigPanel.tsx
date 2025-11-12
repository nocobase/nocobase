/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { useT } from '../../locale';
import { Collapse, Card, Avatar, Popover } from 'antd';
import { QueryPanel } from './QueryPanel';
import { ChartOptionsPanel, chartOptionDefaultValue } from './ChartOptionsPanel';
import { EventsPanel } from './EventsPanel';
import { useForm } from '@formily/react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import {
  useChatMessagesStore,
  useAIEmployeesData,
  useChatBoxStore,
  useChatBoxActions,
  ProfileCard,
  avatars,
} from '@nocobase/plugin-ai/client';
import type { EditorRef } from '@nocobase/client';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';

export const ConfigPanel: React.FC = () => {
  const t = useT();
  const form = useForm();
  const { query, chart } = form?.values || {};
  // 默认展开前两个面板 - 必填
  const [activeKeys, setActiveKeys] = useState<string | string[]>(['query', 'chartOption']);

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

  const DaraButton: React.FC = () => {
    const t = useT();
    const form = useForm();
    const ctx = useFlowSettingsContext<any>();
    const { aiEmployees } = useAIEmployeesData();
    const aiEmployee = aiEmployees?.find((e) => e.username === 'dara');
    const setEditorRef = useChatMessagesStore.use.setEditorRef();
    const setCurrentEditorRefUid = useChatMessagesStore.use.setCurrentEditorRefUid();
    const addContextItems = useChatMessagesStore.use.addContextItems();
    const open = useChatBoxStore.use.open();
    const currentEmployee = useChatBoxStore.use.currentEmployee();
    const { triggerTask } = useChatBoxActions();

    const uid = ctx.model.uid;

    // 拆分的独立写方法（紧跟 uid 定义处插入）
    const writeSql = (content: string) => {
      form?.setValuesIn?.('query.mode', 'sql');
      form?.setValuesIn?.('query.sql', content);
      return ctx.model.onPreview(form.values, true);
    };

    const writeChartConfig = (content: string) => {
      form?.setValuesIn?.('chart.option.mode', 'custom');
      form?.setValuesIn?.('chart.option.raw', content);
      return ctx.model.onPreview(form.values);
    };

    // 新增：写入事件脚本到 chart.events.raw
    const writeChartEvents = (content: string) => {
      form?.setValuesIn?.('chart.events.mode', 'custom');
      form?.setValuesIn?.('chart.events.raw', content);
      return ctx.model.onPreview(form.values);
    };

    const panelRef: EditorRef = {
      read() {
        const payload = {
          uid: ctx.model.uid,
          query: {
            mode: query?.mode,
            sql: query?.sql,
            sqlDatasource: query?.sqlDatasource,
          },
          chart: {
            option: {
              mode: chart?.option?.mode,
              raw: chart?.option?.raw,
            },
            // 新增：将当前事件脚本提供给 AI 读取
            events: {
              mode: chart?.events?.mode,
              raw: chart?.events?.raw,
            },
          },
        };
        return JSON.stringify(payload, null, 2);
      },
      write(text: string) {
        try {
          const content = (text || '').trim();

          // 判定为 SQL（常见关键字），且不是包含 return 的脚本
          const isSql =
            /\bselect\b|\bwith\b|\binsert\b|\bupdate\b|\bdelete\b|\bfrom\b|\bwhere\b|\bgroup\s+by\b|\border\s+by\b/i.test(
              content,
            ) && !/return\s*\{/.test(content);

          // 新增：判定为事件脚本（包含 chart.on/off 或 ctx.openView 等），且不含 return {...}（避免误判为 option）
          const isEvents = /chart\.(on|off)\s*\(|ctx\.\w+\s*\(/.test(content) && !/\breturn\s*\{/.test(content);

          if (isSql) {
            return writeSql(content);
          }
          if (isEvents) {
            return writeChartEvents(content);
          }
          return writeChartConfig(content);
        } catch (e) {
          console.error('Dara panelRef.write apply error:', e);
        }
      },
      buttonGroupHeight: 0,
      snippetEntries: [],
      logs: [],
    };

    React.useEffect(() => {
      setEditorRef(uid, panelRef);
      setCurrentEditorRefUid(uid);
      return () => setEditorRef(uid, null);
    }, [uid]);

    // 更新系统提示，明确使用当前数据源 key 执行 SQL
    const systemPrompt =
      'If you are not in SQL/Custom mode, first call the tool viz.switchModes; after editing SQL, if you need field samples, call the tool viz.runQuery. Use query.sqlDatasource as the current data source key when executing SQL. Do not render chart previews directly in the chat window.';

    const TaskTemplate = (prototype: Partial<any>) => {
      const { message, user, ...rest } = prototype;
      return {
        message: {
          // 修复：兼容顶层 user 与 message.user，确保可预填消息
          user: message?.user ?? user ?? '',
          system: systemPrompt,
          workContext: [
            {
              type: 'chart-config',
              uid,
              title: t('Chart config'),
              content: panelRef.read(),
            },
          ],
        },
        autoSend: false,
        ...rest,
      };
    };

    const tasks = [
      TaskTemplate({
        title: t('Choose the appropriate chart'),
        user: t('Recommend chart type by data structure and explain reasons'),
      }),
      TaskTemplate({
        title: t('Auto map by data columns'),
        user: t('Map X/Y/category/value by columns and generate ECharts options'),
      }),
      TaskTemplate({
        title: t('Optimize visual encoding'),
        user: t('Optimize color, ordering and aggregation, output ECharts options'),
      }),
      TaskTemplate({
        title: t('Fix preview errors or field mismatch'),
        user: t('Fix errors or field mismatch, output SQL or ECharts options'),
      }),
    ];

    const onClick = async () => {
      // 移除手动切换 SQL/Custom 模式的逻辑，交由 AI 工具或 Apply to Editor 处理
      if (aiEmployee && (!open || currentEmployee?.username !== aiEmployee.username)) {
        await triggerTask({ aiEmployee, tasks });
      }
      setCurrentEditorRefUid(uid);
      addContextItems({
        type: 'chart-config',
        uid,
        title: t('Chart config'),
        content: panelRef.read(),
      });
    };

    if (!aiEmployee) return null;

    return (
      <Popover content={<ProfileCard aiEmployee={aiEmployee} tasks={tasks as any} />}>
        <Avatar
          src={avatars(aiEmployee.avatar)}
          size={32}
          shape="circle"
          style={{ cursor: 'pointer', border: '1px solid #eee' }}
          onClick={onClick}
        />
      </Popover>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <DaraButton />
      </div>
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        items={[
          {
            key: 'query',
            label: <span style={{ fontWeight: 500 }}>{t('Data query')}</span>,
            children: (
              <Card style={getCardStyle('query')} styles={{ body: { padding: 0 } }}>
                <QueryPanel />
              </Card>
            ),
          },
          {
            key: 'chartOption',
            label: <span style={{ fontWeight: 500 }}>{t('Chart options')}</span>,
            children: (
              <Card style={getCardStyle('chartOption')} styles={{ body: { padding: 0 } }}>
                <ChartOptionsPanel />
              </Card>
            ),
          },
          {
            key: 'events',
            label: <span style={{ fontWeight: 500 }}>{t('Events')}</span>,
            children: (
              <Card style={getCardStyle('events')} styles={{ body: { padding: 0 } }}>
                <EventsPanel />
              </Card>
            ),
          },
        ]}
      />
    </>
  );
};
