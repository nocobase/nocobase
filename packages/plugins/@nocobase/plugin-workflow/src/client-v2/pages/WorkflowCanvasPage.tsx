/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Spin, theme } from 'antd';
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { WorkflowCanvasHeader } from '../components/WorkflowCanvasHeader';
import { normalizeRecordResponse, type WorkflowRevision } from '../components/workflowCanvas';
import { FlowContext } from '../canvas/contexts';
import { CanvasContent } from '../canvas/CanvasContent';
import { linkNodes } from '../canvas/nodeTree';
import { AddNodeContextProvider } from '../canvas/AddNodeContext';
import { RemoveNodeContextProvider } from '../canvas/RemoveNodeContext';
import { NodeClipboardContextProvider } from '../canvas/NodeClipboardContext';
import { NodeDragContextProvider } from '../canvas/NodeDragContext';

export default function WorkflowCanvasPage() {
  const ctx = useFlowEngineContext();
  const { token } = theme.useToken();
  const params = useParams<{ id?: string }>();
  const workflowId = params.id;
  const resource = ctx.api.resource('workflows');

  const { data, refresh } = useRequest(
    async () => {
      if (!workflowId) {
        return null;
      }
      const response = await resource.get({
        filterByTk: workflowId,
        appends: ['nodes', 'stats', 'versionStats', 'createdBy', 'updatedBy'],
      });
      return normalizeRecordResponse(response);
    },
    { refreshDeps: [workflowId] },
  );

  // Revisions feed the "delete" fallback target (jump to the current version after deleting a non-current one).
  const { data: revisionsData } = useRequest(
    async () => {
      if (!data?.key) {
        return [] as WorkflowRevision[];
      }
      const response = await resource.list({
        filter: { key: data.key },
        fields: ['id', 'current', 'enabled'],
        sort: '-id',
      });
      return (response?.data?.data ?? []) as WorkflowRevision[];
    },
    { refreshDeps: [data?.key] },
  );

  const record = data?.id != null && String(data.id) === String(workflowId) ? data : null;
  const revisions = useMemo(() => revisionsData ?? [], [revisionsData]);

  // Build the in-memory node tree (linked list) and find the entry node.
  const { nodes, entry } = useMemo(() => {
    const list = ((record as any)?.nodes ?? []) as any[];
    linkNodes(list);
    return { nodes: list, entry: list.find((item) => !item.upstream) ?? null };
  }, [record]);

  const flowContextValue = useMemo(() => ({ workflow: record, nodes, refresh }), [record, nodes, refresh]);

  if (!workflowId) {
    return null;
  }

  if (!record) {
    return <Spin />;
  }

  return (
    <FlowContext.Provider value={flowContextValue}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
          background: token.colorBgLayout,
        }}
      >
        <WorkflowCanvasHeader record={record} revisions={revisions} resource={resource} refresh={refresh} />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            // `overflow: hidden` here — the inner `.workflow-canvas` owns the scroll (mirrors v1). Avoids a double
            // scrollbar.
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
          }}
        >
          <AddNodeContextProvider>
            <RemoveNodeContextProvider>
              <NodeDragContextProvider>
                <NodeClipboardContextProvider>
                  <CanvasContent entry={entry} />
                </NodeClipboardContextProvider>
              </NodeDragContextProvider>
            </RemoveNodeContextProvider>
          </AddNodeContextProvider>
        </div>
      </div>
    </FlowContext.Provider>
  );
}
