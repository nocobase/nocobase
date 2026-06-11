/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Modern canvas content (doc §9.6). A second copy of v1 `CanvasContent` — same
 * stylesheet/layout (trigger block → entry branch → End sign, with a zoom
 * slider), rebuilt on the v2 contexts and rendering the v2 `<Branch>`.
 *
 * The trigger config block is a placeholder for now (the v2 trigger config UI
 * is a separate surface); the focus here is the node-graph render.
 */

import React, { useState } from 'react';
import { Alert, Button, Slider } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFlowEngine } from '@nocobase/flow-engine';
import useStyles from './style';
import { Branch } from './Branch';
import { useFlowContext, useWorkflowCanvasExecuted } from './contexts';
import { useNodeClipboardContext } from './NodeClipboardContext';
import { useT } from '../locale';
import { PluginWorkflowClientV2 } from '../plugin';
import { TriggerConfig } from '../triggers/TriggerConfig';

/** "Copied node" preview, top-left of the canvas (mirrors v1). Shown while a
 *  node is on the clipboard; the X clears it. */
function ClipboardPreview() {
  const { styles } = useStyles();
  const t = useT();
  const flowEngine = useFlowEngine();
  const clipboard = useNodeClipboardContext();
  const copied = clipboard?.clipboard;
  if (!copied) {
    return null;
  }
  const plugin = flowEngine.context.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const instruction = plugin?.getInstruction(copied.type);
  const typeTitle = instruction ? t(instruction.title as string) : copied.type;
  return (
    <div className={styles.clipboardPreviewClass}>
      <div className="workflow-clipboard-header">
        <span>{t('Copied node')}</span>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => clipboard?.clearClipboard()} />
      </div>
      <div className="workflow-clipboard-card">
        <div className="workflow-clipboard-type">{typeTitle}</div>
        <div className="workflow-clipboard-title">{copied.title ?? copied.type}</div>
      </div>
    </div>
  );
}

export function CanvasContent({ entry }: { entry?: any }) {
  const { styles, cx } = useStyles();
  const t = useT();
  const executed = useWorkflowCanvasExecuted();
  const { workflow } = useFlowContext() ?? {};
  const [zoom, setZoom] = useState(100);

  return (
    // The `.workflow-canvas-*` layout rules (centering, padding, the zoomer position) are defined *nested* under
    // `workflowPageClass`, so the wrapper must live inside an element carrying that class — exactly as v1's
    // WorkflowPage wraps its canvas.
    <div className={cx(styles.workflowPageClass, css({ height: '100%' }))}>
      <div className="workflow-canvas-wrapper">
        <div className="workflow-canvas" style={{ zoom: zoom / 100 }}>
          <div className={cx(styles.branchBlockClass, css({ marginTop: '0 !important' }))}>
            <div className={styles.branchClass}>
              {executed ? (
                <Alert
                  type="warning"
                  showIcon
                  message={t('Executed workflow cannot be modified. Could be copied to a new version to modify.')}
                  style={{ marginBottom: '1em' }}
                />
              ) : null}

              <TriggerConfig />

              <div className={cx(styles.branchBlockClass, css({ marginTop: '0 !important' }))}>
                <Branch entry={entry} />
              </div>
              <div className={styles.terminalClass}>{t('End')}</div>
            </div>
          </div>
        </div>
        <ClipboardPreview />
        <div className="workflow-canvas-zoomer">
          <Slider vertical reverse defaultValue={100} step={10} min={10} value={zoom} onChange={setZoom} />
        </div>
      </div>
    </div>
  );
}
