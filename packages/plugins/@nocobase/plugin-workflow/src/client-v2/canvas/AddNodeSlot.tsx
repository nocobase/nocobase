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
import { useFlowContext, useWorkflowCanvasExecuted } from './contexts';
import { useAddNodeContext } from './AddNodeContext.shared';
import { useBranchContext } from './BranchContext';
import { useNodeClipboardContext } from './NodeClipboardContext';
import { useNodeDragContext } from './NodeDragContext';

function AddButtonPlaceholder() {
  const { styles } = useStyles();
  return (
    <div className={`${styles.addButtonClass} workflow-add-node-button`}>
      <span className="ant-btn-placeholder" />
    </div>
  );
}

/** During a drag, every add-slot becomes a drop zone: it registers its DOM
 *  element for hit-testing and reflects the drop impact (safe / warning /
 *  disabled), highlighting when it's the active target. Mirrors v1. */
function DropZone({
  upstream,
  branchIndex,
  ariaLabel,
}: {
  upstream?: any;
  branchIndex: number | null;
  ariaLabel?: string;
}) {
  const { styles, cx } = useStyles();
  const branchContext = useBranchContext();
  const dragContext = useNodeDragContext();
  const target = useMemo(() => ({ upstream, branchIndex }), [upstream, branchIndex]);
  const impact = dragContext?.getDropImpact?.(target);
  const status = impact?.status ?? 'disabled';
  const disabled = branchContext?.addable === false || status === 'disabled';
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
        aria-label={ariaLabel || 'drop-zone'}
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

function PasteZone({
  upstream,
  branchIndex,
  ariaLabel,
}: {
  upstream?: any;
  branchIndex: number | null;
  ariaLabel?: string;
}) {
  const { styles, cx } = useStyles();
  const branchContext = useBranchContext();
  const clipboard = useNodeClipboardContext();
  const target = { upstream, branchIndex };
  const impact = clipboard?.getPasteImpact(target);
  const status = impact?.status ?? 'disabled';
  const disabled = branchContext?.addable === false || status === 'disabled';

  return (
    <div className={`${styles.addButtonClass} workflow-add-node-button`}>
      <Button
        aria-label={ariaLabel || 'paste-zone'}
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

export function AddNodeSlot({
  upstream,
  branchIndex = null,
  'aria-label': ariaLabel,
}: {
  upstream?: any;
  branchIndex?: number | null;
  'aria-label'?: string;
}) {
  const { styles } = useStyles();
  const { workflow } = useFlowContext() ?? {};
  const executed = useWorkflowCanvasExecuted();
  const branchContext = useBranchContext();
  const addNodeContext = useAddNodeContext();
  const clipboard = useNodeClipboardContext();
  const dragContext = useNodeDragContext();

  const onOpen = useCallback(
    () =>
      addNodeContext?.onMenuOpen?.({
        upstream,
        branchIndex,
        branchContext: {
          syncOnly: branchContext?.syncOnly ?? false,
        },
      }),
    [addNodeContext, upstream, branchIndex, branchContext?.syncOnly],
  );

  const loading = Boolean(
    addNodeContext?.creating &&
      addNodeContext.creating.upstreamId === (upstream?.id ?? null) &&
      addNodeContext.creating.branchIndex === branchIndex,
  );

  if (!workflow || !addNodeContext || branchContext?.addable === false) {
    return <AddButtonPlaceholder />;
  }

  if (executed) {
    return <AddButtonPlaceholder />;
  }

  // While dragging, every slot is a drop zone (v1 behavior, takes precedence).
  if (dragContext?.dragging) {
    return <DropZone upstream={upstream} branchIndex={branchIndex} ariaLabel={ariaLabel} />;
  }

  // A copied node turns every add-slot into a paste zone (v1 behavior).
  if (clipboard?.clipboard) {
    return <PasteZone upstream={upstream} branchIndex={branchIndex} ariaLabel={ariaLabel} />;
  }

  return (
    <div className={`${styles.addButtonClass} workflow-add-node-button`}>
      <Button
        aria-label={ariaLabel || 'add-button'}
        shape="circle"
        icon={<PlusOutlined />}
        size="small"
        loading={loading}
        onClick={onOpen}
      />
    </div>
  );
}
