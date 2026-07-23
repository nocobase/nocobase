/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Dropdown, Space, theme } from 'antd';
import React, { useMemo } from 'react';
import { getWorkflowExecutionPath } from '../constants';
import { ExecutionStatusIcon } from './ExecutionStatusIcon';
import { formatTime } from './workflowCanvas';

export type ExecutionRecord = {
  // Optional to chain from the loosely-typed page record (`WorkflowCanvasRecord`
  // → `ExecutionViewRecord` → here), all of which keep `id` optional. The
  // dropdown only renders once the parent has a concrete execution, so `id` is
  // present at runtime.
  id?: number | string;
  key?: string;
  status?: number | null;
  createdAt?: string;
};

/**
 * Switch between executions of the same workflow. Loads a window of the
 * executions immediately before and after the current one (by id), mirroring
 * v1's prev/next loading.
 */
export function ExecutionsDropdown({ execution, refresh }: { execution: ExecutionRecord; refresh?: () => void }) {
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const resource = ctx.api.resource('executions');

  const { data, run } = useRequest(
    async () => {
      const [before, after] = await Promise.all([
        resource.list({
          filter: { key: execution.key, id: { $lt: execution.id } },
          sort: '-id',
          pageSize: 10,
          fields: ['id', 'status', 'createdAt'],
        }),
        resource.list({
          filter: { key: execution.key, id: { $gt: execution.id } },
          sort: 'id',
          pageSize: 10,
          fields: ['id', 'status', 'createdAt'],
        }),
      ]);
      const beforeList = (before?.data?.data ?? []) as ExecutionRecord[];
      const afterList = ((after?.data?.data ?? []) as ExecutionRecord[]).slice().reverse();
      return [...afterList, execution, ...beforeList];
    },
    { manual: true },
  );

  const onClick = useMemoizedFn(({ key }: { key: string }) => {
    if (String(key) !== String(execution.id)) {
      ctx.router.navigate(getWorkflowExecutionPath(key));
    }
  });

  const items = useMemo(
    () =>
      (data ?? [execution]).map((item) => ({
        key: `${item.id}`,
        icon: <ExecutionStatusIcon value={item.status ?? null} />,
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
            <span>{`#${item.id}`}</span>
            <time style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }}>
              {formatTime(item.createdAt)}
            </time>
          </span>
        ),
      })),
    [data, execution, token],
  );

  return (
    <Space size={token.marginXXS}>
      <Dropdown
        trigger={['click']}
        onOpenChange={(open) => open && run()}
        menu={{ onClick, selectedKeys: [`${execution.id}`], items }}
      >
        <Space style={{ cursor: 'pointer' }}>
          <strong>{`#${execution.id}`}</strong>
          <DownOutlined />
        </Space>
      </Dropdown>
      {refresh ? <Button type="link" size="small" icon={<ReloadOutlined />} onClick={refresh} /> : null}
    </Space>
  );
}

export default ExecutionsDropdown;
