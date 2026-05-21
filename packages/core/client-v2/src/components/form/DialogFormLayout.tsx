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

export interface DialogFormLayoutProps {
  /** Header title rendered in the dialog's title slot. */
  title: React.ReactNode;
  /** Form body — typically a `<Form>` wrapping `<Form.Item>` fields. */
  children: React.ReactNode;
  /**
   * Called before the dialog is closed by the Cancel button or the
   * top-right close (X) icon. Use for "discard changes" confirmations.
   */
  onCancel?: () => void | Promise<void>;
  /**
   * Called when the Submit button is clicked. Caller owns validation
   * + the actual API call; the dialog is closed automatically when
   * `onSubmit` resolves. Throw from `onSubmit` to keep the dialog open
   * (e.g. on a validation error).
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
 * Standard layout for dialog-hosted forms — the dialog counterpart of
 * `DrawerFormLayout`. Title sits left-aligned in the dialog's native
 * header (no inline close icon — the dialog provides its own X in the
 * top-right when opened with `viewer.dialog({ closable: true, ... })`),
 * the form body fills the middle, and a Cancel + Submit footer sits
 * at the bottom.
 *
 * Why not just reuse `DrawerFormLayout`? `DrawerFormLayout` injects a
 * `<CloseOutlined>` button next to the title — that's the drawer
 * visual contract (close lives near the title in a side panel). In a
 * centered dialog the native top-right close button is the expected
 * affordance, so a separate layout keeps the visual contract clean.
 *
 * Callers own the `<Form>` instance, validation, and the actual API
 * call. This component only handles the chrome and close behaviour.
 *
 * Example:
 *
 * ```tsx
 * ctx.viewer.dialog({
 *   closable: true,                       // native top-right X
 *   content: () => (
 *     <DialogFormLayout
 *       title={t('Bind verifier')}
 *       onSubmit={handleSubmit}
 *       submitting={submitting}
 *       submitText={t('Bind')}
 *     >
 *       <Form form={form} layout="vertical">...</Form>
 *     </DialogFormLayout>
 *   ),
 * });
 * ```
 */
export function DialogFormLayout(props: DialogFormLayoutProps) {
  const view = useFlowView();

  const handleCancel = useCallback(async () => {
    await props.onCancel?.();
    await view.close();
  }, [props, view]);

  const handleSubmit = useCallback(async () => {
    await props.onSubmit?.();
    await view.close();
  }, [props, view]);

  return (
    <div>
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
