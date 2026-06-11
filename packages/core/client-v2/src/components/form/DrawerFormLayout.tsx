/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowView } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React, { useCallback } from 'react';

export interface DrawerFormLayoutProps {
  /** Header title rendered next to antd Drawer's native close (X) icon. */
  title: React.ReactNode;
  /** Form body — typically a `<Form>` wrapping `<Form.Item>` fields. */
  children: React.ReactNode;
  /**
   * Called when the Submit button is clicked. Caller owns validation + the
   * actual API call; the drawer is closed automatically when `onSubmit`
   * resolves. Throw from `onSubmit` to keep the drawer open (e.g. on a
   * validation error).
   */
  onSubmit?: () => void | Promise<void>;
  /** Drives the Submit button's loading state. */
  submitting?: boolean;
  /** Override the Submit button label. Defaults to "Submit". */
  submitText?: React.ReactNode;
  /** Override the Cancel button label. Defaults to "Cancel". */
  cancelText?: React.ReactNode;
  /**
   * Full override of the footer content. When provided, the default
   * Cancel + Submit buttons are replaced. Useful for forms that need
   * extra actions (e.g. Preview, Save draft).
   */
  footer?: React.ReactNode;
}

/**
 * Standard layout for drawer-hosted forms: a title-only header on top
 * (caller must open the drawer with `viewer.drawer({ closable: true })`
 * so antd Drawer renders its native left-side X next to the title),
 * the caller-provided form body in the middle, and a Cancel + Submit
 * footer at the bottom. Wraps `useFlowView()`'s `Header` / `Footer`
 * slots so the drawer chrome stays consistent across plugins.
 *
 * To intercept close (e.g. dirty-form confirmation), use the lower-level
 * `viewer.drawer({ preventClose, beforeClose, ... })` hooks — this
 * layout no longer wraps a custom close handler.
 *
 * Callers own the `<Form>` instance, validation, and the actual API call.
 */
export function DrawerFormLayout(props: DrawerFormLayoutProps) {
  const view = useFlowView();

  const handleCancel = useCallback(async () => {
    await view.close();
  }, [view]);

  const handleSubmit = useCallback(async () => {
    await props.onSubmit?.();
    await view.close();
  }, [props, view]);

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {view.Header ? <view.Header title={props.title} /> : null}
      {props.children}
      {view.Footer ? (
        <view.Footer>
          {props.footer ?? (
            <Space>
              <Button onClick={handleCancel}>{props.cancelText ?? 'Cancel'}</Button>
              <Button type="primary" loading={props.submitting} onClick={handleSubmit}>
                {props.submitText ?? 'Submit'}
              </Button>
            </Space>
          )}
        </view.Footer>
      ) : null}
    </div>
  );
}
