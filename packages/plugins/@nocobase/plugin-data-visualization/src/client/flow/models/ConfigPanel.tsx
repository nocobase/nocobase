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

    const panelRef: EditorRef = {
      read() {
        const payload = {
          uid: ctx.model.uid,
          query: {
            mode: query?.mode,
            sql: query?.sql,
            collectionPath: query?.collectionPath,
          },
          chart: {
            option: {
              mode: chart?.option?.mode,
              raw: chart?.option?.raw,
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

          if (isSql) {
            return writeSql(content);
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

    const systemPrompt =
      'If you are not in SQL/Custom mode, first call the tool viz.switchModes; after editing SQL, if you need field samples, call the tool viz.runQuery. Do not render chart previews directly in the chat window.';

    const TaskTemplate = (prototype: Partial<any>) => {
      const { message, ...rest } = prototype;
      return {
        message: {
          user: message?.user,
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
      TaskTemplate({ title: t('选择合适图表并说明理由'), user: t('请根据数据结构推荐图表类型并解释原因') }),
      TaskTemplate({ title: t('根据数据列自动映射'), user: t('请根据字段列映射 X/Y/分类/值并生成 ECharts options') }),
      TaskTemplate({ title: t('优化视觉编码'), user: t('请优化颜色、排序与聚合，并输出最终 JSON') }),
      TaskTemplate({ title: t('修复预览错误/字段不匹配'), user: t('修复错误或字段不匹配问题，并输出最终 JSON') }),
    ];

    const onClick = async () => {
      const needSwitch =
        form?.values?.query?.mode !== 'sql' ||
        form?.values?.chart?.option?.mode !== 'custom' ||
        !form?.values?.chart?.option?.raw;
      if (needSwitch) {
        form?.setValuesIn?.('query.mode', 'sql');
        form?.setValuesIn?.('chart.option.mode', 'custom');
        if (!form?.values?.chart?.option?.raw) {
          form?.setValuesIn?.('chart.option.raw', chartOptionDefaultValue);
        }
        await ctx.model.onPreview(form.values); // 轻量预览，不刷新数据
      }

      // 首次打开/切换员工时，先触发 triggerTask（内部会 clear），避免清空已插入的上下文
      if (aiEmployee && (!open || currentEmployee?.username !== aiEmployee.username)) {
        await triggerTask({ aiEmployee, tasks });
      }

      // 再插入上下文（去重逻辑会保障不会重复）
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
