/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useT } from '../../locale';
import { Avatar, Popover } from 'antd';
import {
  useChatMessagesStore,
  useAIConfigRepository,
  useChatBoxStore,
  useChatBoxActions,
  ProfileCard,
  avatars,
} from '@nocobase/plugin-ai/client';
import type { AIEmployee } from '@nocobase/plugin-ai/client';
import type { EditorRef } from '@nocobase/client';
import { DEFAULT_DATA_SOURCE_KEY, useRequest } from '@nocobase/client';
import type { FlowSettingsContext } from '@nocobase/flow-engine';

export const DaraButton: React.FC<{ ctx: FlowSettingsContext<any> }> = ({ ctx }) => {
  const t = useT();
  const aiConfigRepository = useAIConfigRepository();
  const { data: aiEmployees = [] } = useRequest<AIEmployee[]>(async () => aiConfigRepository.getAIEmployees());
  const aiEmployee = aiEmployees?.find((e) => e.username === 'dara');
  const setEditorRef = useChatMessagesStore.use.setEditorRef();
  const setCurrentEditorRefUid = useChatMessagesStore.use.setCurrentEditorRefUid();
  const addContextItems = useChatMessagesStore.use.addContextItems();
  const open = useChatBoxStore.use.open();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { triggerTask } = useChatBoxActions();

  const uid = ctx.model.uid;

  const panelRef: EditorRef = {
    read() {
      const values = ctx.getStepFormValues('chartSettings', 'configure') || {};
      const { query, chart } = values || {};
      const payload = {
        uid,
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
        const isSql =
          /\bselect\b|\bwith\b|\binsert\b|\bupdate\b|\bdelete\b|\bfrom\b|\bwhere\b|\bgroup\s+by\b|\border\s+by\b/i.test(
            content,
          ) && !/return\s*\{/.test(content);
        const isEvents = /chart\.(on|off)\s*\(|ctx\.\w+\s*\(/.test(content) && !/\breturn\s*\{/.test(content);

        if (isSql) {
          // 从注释中提取数据源
          const dsMatch = content.match(/^--\s*dataSource:\s*(\S+)/i);
          const dataSource = dsMatch ? dsMatch[1] : undefined;
          return ctx.writeSql(content, dataSource);
        }
        if (isEvents) return ctx.writeChartEvents(content);
        return ctx.writeChartConfig(content);
      } catch (e) {
        console.error('DaraButton panelRef.write error:', e);
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
    'If you are not in SQL/Custom mode, first call the tool viz.switchModes; after editing SQL, if you need field samples, call the tool viz.runQuery. Use query.sqlDatasource as the current data source key when executing SQL. Do not render chart previews directly in the chat window.';

  const TaskTemplate = (prototype: Partial<any>) => {
    const { message, user, ...rest } = prototype;
    return {
      message: {
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

export default DaraButton;
