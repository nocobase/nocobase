/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Modern canvas node card (doc §9.5/§9.6). A second copy of the v1 `Node`,
 * rebuilt with native antd + the v2 contexts/registry — it shares no Formily
 * code, but reuses the *same* stylesheet classes (`nodeBlockClass`,
 * `nodeClass`, `nodeCardClass`, `nodeHeaderClass`, `nodeMetaClass`) and DOM
 * shape so the card is visually 1:1 with v1. Renders:
 *  - a registered node → type tag + editable title (+ optional `ComponentLoader`
 *    self-render for branch nodes);
 *  - an unregistered type (only implemented in v1) → a placeholder card,
 *    keeping topology intact (mirrors v1's "unknown node" branch, doc §9.1).
 */

import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { Button, Dropdown, Input, Skeleton, Tag } from 'antd';
import { CloseOutlined, CopyOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useFlowEngine } from '@nocobase/flow-engine';
import { NodeContext, useFlowContext, useWorkflowCanvasExecuted } from './contexts';
import useStyles from './style';
import { useT } from '../locale';
import { useInstruction } from './useWorkflowInstruction';
import { nodeTypeClassName } from './nodeRenderDispatch';
import { AddNodeSlot } from './AddNodeSlot';
import { useRemoveNodeContext } from './RemoveNodeContext';
import { useNodeClipboardContext } from './NodeClipboardContext';
import { useNodeDragContext } from './NodeDragContext';
import { openNodeConfigDrawer } from './NodeConfigDrawer';
import { JobButton } from './JobButton';

function NodeActions({ data }: { data: any }) {
  const t = useT();
  const executed = useWorkflowCanvasExecuted();
  const removeNodeContext = useRemoveNodeContext();
  const clipboard = useNodeClipboardContext();
  const isCopiedSelf = Boolean(clipboard?.clipboard?.sourceId && clipboard.clipboard.sourceId === data.id);
  if (executed || !removeNodeContext) {
    return null;
  }
  return (
    <Dropdown
      trigger={['hover']}
      menu={{
        items: [
          {
            key: 'copy',
            label: isCopiedSelf ? t('Cancel copy') : t('Copy'),
            icon: isCopiedSelf ? undefined : <CopyOutlined />,
          },
          { type: 'divider' },
          { key: 'delete', label: t('Delete'), icon: <DeleteOutlined />, danger: true },
        ],
        onClick: ({ key, domEvent }) => {
          // Menu items render in a portal; stop the click from bubbling to the card (which would otherwise open the
          // config drawer).
          domEvent.stopPropagation();
          if (key === 'copy') {
            if (isCopiedSelf) {
              clipboard?.clearClipboard();
            } else {
              clipboard?.copyNode(data);
            }
          }
          if (key === 'delete') {
            removeNodeContext.requestRemove(data);
          }
        },
      }}
    >
      <Button
        type="text"
        shape="circle"
        size="small"
        icon={<EllipsisOutlined />}
        className="workflow-node-action-button"
        // Clicking the "..." trigger must not open the config drawer.
        onClick={(ev) => ev.stopPropagation()}
      />
    </Dropdown>
  );
}

/** Editable node title — mirrors v1's `Input.TextArea` styled by `nodeCardClass`. */
function NodeTitle({ data, fallback }: { data: any; fallback: string }) {
  const flowEngine = useFlowEngine();
  const t = useT();
  const executed = useWorkflowCanvasExecuted();
  const { refresh } = useFlowContext() ?? {};
  const [title, setTitle] = useState<string>(data.title ?? '');

  const onSave = useCallback(
    async (next: string) => {
      const value = next || fallback;
      setTitle(value);
      if (value === data.title) {
        return;
      }
      await flowEngine.context.api.resource('flow_nodes').update({ filterByTk: data.id, values: { title: value } });
      refresh?.();
    },
    [data.id, data.title, fallback, flowEngine, refresh],
  );

  return (
    <Input.TextArea
      value={title}
      disabled={Boolean(executed)}
      onChange={(ev) => setTitle(ev.target.value)}
      onBlur={(ev) => onSave(ev.target.value)}
      autoSize
      aria-label={t('Node title')}
    />
  );
}

/** Open the node config drawer when the card body is clicked, but not when the
 *  click originates from the title input, the actions menu, or any control. */
function isInteractiveClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest('textarea, input, button, a, .ant-dropdown, .workflow-node-actions'));
}

/**
 * The default node card — type tag + editable title + actions menu, wrapped in
 * the canvas `nodeClass`/`nodeCardClass` chrome (drag mousedown, click-to-open
 * config, copy/drag highlight). Exported and given a `children` slot so a node's
 * `ComponentLoader` can reuse the exact card and append its own subtree after it
 * (e.g. the condition node's Yes/No branches). `cardExtra` is an internal slot
 * for node-specific notices inside the card, directly after the title — the v2
 * mirror of v1's `NodeDefaultView` (doc §9.5, ADR-0003). Unregistered types
 * still render with the same card chrome, but do not open the config drawer.
 */
export function NodeDefaultView({
  cardExtra,
  data,
  children,
}: {
  cardExtra?: React.ReactNode;
  data: any;
  children?: React.ReactNode;
}) {
  const { styles, cx } = useStyles();
  const t = useT();
  const flowEngine = useFlowEngine();
  const { workflow, refresh } = useFlowContext() ?? {};
  const clipboard = useNodeClipboardContext();
  const dragContext = useNodeDragContext();
  const instruction = useInstruction(data.type);
  // Highlight (blue dashed outline) when this node is the one copied to the clipboard or being dragged — mirrors v1's
  // `active`/`dragging` state.
  const isCopiedSelf = Boolean(clipboard?.clipboard?.sourceId && clipboard.clipboard.sourceId === data.id);
  const isDraggingSelf = Boolean(dragContext?.dragging && dragContext?.dragNode?.id === data.id);

  const openConfig = useCallback(() => {
    if (!instruction) {
      return;
    }
    openNodeConfigDrawer({ ctx: flowEngine.context, data, instruction, t, workflow, refresh });
  }, [flowEngine, data, instruction, t, workflow, refresh]);

  const onCardMouseDown = useCallback(
    (event: React.MouseEvent) => {
      // React synthetic events bubble through the component tree (not the DOM tree), so a mousedown inside a portal
      // (e.g. the config drawer) would also trigger this. Skip when the target isn't a DOM descendant of the card.
      if (!(event.currentTarget as HTMLElement).contains(event.target as Node)) {
        return;
      }
      dragContext?.onNodeMouseDown?.(data, event);
    },
    [data, dragContext],
  );

  const typeTitle = instruction ? t(instruction.title as string) : t('Unsupported node');

  return (
    <div className={cx(styles.nodeClass, nodeTypeClassName(data.type))}>
      <div
        className={cx(styles.nodeCardClass, { active: isCopiedSelf || isDraggingSelf, dragging: isDraggingSelf })}
        role="button"
        aria-label={`${typeTitle}-${data.title ?? data.id}`}
        onMouseDown={onCardMouseDown}
        aria-disabled={!instruction}
        onClick={(ev) => {
          // A drag just ended → swallow the click so it doesn't open the drawer.
          if (dragContext?.consumeClick?.()) {
            ev.preventDefault();
            return;
          }
          if (!isInteractiveClickTarget(ev.target)) {
            openConfig();
          }
        }}
      >
        <div className={styles.nodeHeaderClass}>
          <div className={cx(styles.nodeMetaClass, 'workflow-node-meta')}>
            <Tag icon={instruction?.icon} color={instruction ? undefined : 'error'}>
              {typeTitle}
            </Tag>
            <span className="workflow-node-id">{data.id}</span>
          </div>
          <div className="workflow-node-actions">
            <NodeActions data={data} />
            <JobButton data={data} />
          </div>
        </div>
        <NodeTitle data={data} fallback={typeTitle} />
        {cardExtra}
      </div>
      {children}
    </div>
  );
}

function NodeCard({ data }: { data: any }) {
  const instruction = useInstruction(data.type);

  const Rendered = useMemo(() => {
    if (instruction?.ComponentLoader) {
      return lazy(instruction.ComponentLoader);
    }
    return null;
  }, [instruction]);

  // Unregistered in v2 (only implemented in v1) → keep the normal card actions and title editing, but disable config.
  if (!instruction) {
    return <NodeDefaultView data={data} />;
  }

  // Branch nodes self-render via ComponentLoader (it draws its own card by wrapping `NodeDefaultView` and appending
  // nested <Branch>); otherwise the default card.
  if (Rendered) {
    return (
      <Suspense fallback={<Skeleton.Button active block style={{ width: '16em', height: '4em' }} />}>
        <Rendered data={data} />
      </Suspense>
    );
  }

  return <NodeDefaultView data={data} />;
}

export function Node({ data }: { data: any }) {
  const { styles } = useStyles();
  const instruction = useInstruction(data.type);
  const endFlag = instruction?.end;
  const isEnd = typeof endFlag === 'function' ? endFlag(data) : Boolean(endFlag);

  return (
    <NodeContext.Provider value={data}>
      <div className={styles.nodeBlockClass}>
        <NodeCard data={data} />
        {isEnd ? (
          <div className="end-sign">
            <CloseOutlined />
          </div>
        ) : (
          <AddNodeSlot upstream={data} />
        )}
      </div>
    </NodeContext.Provider>
  );
}
