/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Dropdown, theme } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo } from 'react';
import { useWorkflowRuntimePaths } from '../hooks/useWorkflowRuntimePaths';
import { useWorkflowTranslation } from '../locale';
import type { WorkflowCanvasRecord, WorkflowRevision } from './workflowCanvas';

dayjs.extend(relativeTime);

export function WorkflowRevisionsDropdown({ record, resource }: { record: WorkflowCanvasRecord; resource: any }) {
  const { t } = useWorkflowTranslation();
  const ctx = useFlowContext();
  const { getWorkflowCanvasPath } = useWorkflowRuntimePaths();
  const { token } = theme.useToken();
  const { data, run } = useRequest(
    async () => {
      const response = await resource.list({
        filter: { key: record.key },
        fields: ['id', 'createdAt', 'current', 'enabled', 'versionStats.executed'],
        sort: '-id',
      });
      return (response?.data?.data ?? []) as WorkflowRevision[];
    },
    { manual: true },
  );

  const onSwitchVersion = useMemoizedFn(({ key }: { key: string }) => {
    if (String(key) !== String(record.id)) {
      ctx.router.navigate(getWorkflowCanvasPath(key));
    }
  });

  const revisions = useMemo(() => data ?? [], [data]);

  return (
    <Dropdown
      trigger={['click']}
      onOpenChange={(open) => open && run()}
      menu={{
        onClick: onSwitchVersion,
        selectedKeys: [`${record.id}`],
        items: revisions
          .slice()
          .sort((a, b) => Number(b.id) - Number(a.id))
          .map((item) => ({
            key: `${item.id}`,
            icon: item.current ? <RightOutlined /> : null,
            label: (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: token.marginXL,
                  minWidth: token.sizeXXL * 5,
                }}
              >
                <strong style={{ fontWeight: item.enabled ? 'bold' : 'normal' }}>{`#${item.id}`}</strong>
                <time style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }}>
                  {item.createdAt ? dayjs(item.createdAt).fromNow() : ''}
                </time>
              </span>
            ),
          })),
      }}
    >
      <Button type="text" aria-label="version">
        <span style={{ opacity: 0.65, marginRight: 4 }}>{t('Version')}</span>
        <span>{record.id != null ? `#${record.id}` : null}</span>
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default WorkflowRevisionsDropdown;
