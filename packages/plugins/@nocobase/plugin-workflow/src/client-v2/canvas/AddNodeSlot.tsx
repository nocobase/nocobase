/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The "+" add-node anchor between nodes (doc §9.6). Normally opens the add-node
 * drawer. When a node has been copied to the clipboard, it instead becomes a
 * paste zone (mirrors v1's `AddNodeSlot` → `AddNodePasteZone` switch): clicking
 * pastes the copied node here. Disabled while the workflow is executed.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from 'antd';
import { PlusOutlined, SnippetsOutlined } from '@ant-design/icons';
import useStyles from './style';
import { useWorkflowCanvasExecuted } from './contexts';
import { useAddNodeContext } from './AddNodeContext';
import { useNodeClipboardContext } from './NodeClipboardContext';
import { useNodeDragContext } from './NodeDragContext';

/** During a drag, every add-slot becomes a drop zone: it registers its DOM
 *  element for hit-testing and reflects the drop impact (safe / warning /
 *  disabled), highlighting when it's the active target. Mirrors v1. */
function DropZone({ upstream, branchIndex }: { upstream?: any; branchIndex: number | null }) {
  const { styles, cx } = useStyles();
  const dragContext = useNodeDragContext();
  const target = useMemo(() => ({ upstream, branchIndex }), [upstream, branchIndex]);
  const impact = dragContext?.getDropImpact?.(target);
  const status = impact?.status ?? 'disabled';
  const disabled = status === 'disabled';
  const dropKey = dragContext?.getDropKey?.(target);
  const isActive = Boolean(dropKey && dragContext?.activeDropKey === dropKey);
  const registerDropZone = dragContext?.registerDropZone;
  const zoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!registerDropZone || !zoneRef.current || disabled) {
      return;
    }
    return registerDropZone(target, zoneRef.current);
  }, [registerDropZone, disabled, target]);

  return (
    <div className={`${styles.addButtonClass} workflow-add-node-button`}>
      <div
        role="button"
        aria-label="drop-zone"
        ref={zoneRef}
        className={cx(styles.dropZoneClass, {
          'drop-safe': status === 'safe',
          'drop-warning': status === 'warning',
          'drop-active': isActive,
          'drop-disabled': disabled,
        })}
      />
    </div>
  );
}

function PasteZone({ upstream, branchIndex }: { upstream?: any; branchIndex: number | null }) {
  const { styles, cx } = useStyles();
  const clipboard = useNodeClipboardContext();
  const target = { upstream, branchIndex };
  const impact = clipboard?.getPasteImpact(target);
  const status = impact?.status ?? 'disabled';
  const disabled = status === 'disabled';

  return (
    <div className={`${styles.addButtonClass} workflow-add-node-button`}>
      <Button
        aria-label="paste-zone"
        shape="circle"
        size="small"
        icon={<SnippetsOutlined />}
        disabled={disabled}
        onClick={() => !disabled && clipboard?.pasteNode(target)}
        className={cx(styles.pasteButtonClass, {
          'paste-safe': status === 'safe',
          'paste-warning': status === 'warning',
        })}
      />
    </div>
  );
}

export function AddNodeSlot({ upstream, branchIndex = null }: { upstream?: any; branchIndex?: number | null }) {
  const { styles } = useStyles();
  const executed = useWorkflowCanvasExecuted();
  const addNodeContext = useAddNodeContext();
  const clipboard = useNodeClipboardContext();
  const dragContext = useNodeDragContext();

  const onOpen = useCallback(
    () => addNodeContext?.onMenuOpen({ upstream, branchIndex }),
    [addNodeContext, upstream, branchIndex],
  );

  const loading = Boolean(
    addNodeContext?.creating &&
      addNodeContext.creating.upstreamId === (upstream?.id ?? null) &&
      addNodeContext.creating.branchIndex === branchIndex,
  );

  if (executed) {
    return (
      <div className={`${styles.addButtonClass} workflow-add-node-button`}>
        <span className="ant-btn-placeholder" />
      </div>
    );
  }

  // While dragging, every slot is a drop zone (v1 behavior, takes precedence).
  if (dragContext?.dragging) {
    return <DropZone upstream={upstream} branchIndex={branchIndex} />;
  }

  // A copied node turns every add-slot into a paste zone (v1 behavior).
  if (clipboard?.clipboard) {
    return <PasteZone upstream={upstream} branchIndex={branchIndex} />;
  }

  return (
    <div className={`${styles.addButtonClass} workflow-add-node-button`}>
      <Button
        aria-label="add-button"
        shape="circle"
        icon={<PlusOutlined />}
        size="small"
        loading={loading}
        onClick={onOpen}
      />
    </div>
  );
}
