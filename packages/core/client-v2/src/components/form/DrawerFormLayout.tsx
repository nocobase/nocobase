/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFlowView } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React, { useCallback } from 'react';

export interface DrawerFormLayoutProps {
  /** Header title rendered next to the close (X) button. */
  title: React.ReactNode;
  /** Form body — typically a `<Form>` wrapping `<Form.Item>` fields. */
  children: React.ReactNode;
  /**
   * Called before the drawer is closed by either the Cancel button or the
   * header's X icon. Use for "discard changes" confirmations.
   */
  onCancel?: () => void | Promise<void>;
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

const titleClassName = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: -8px;
`;

/**
 * Standard layout for drawer-hosted forms: a close-icon + title header on
 * top, the caller-provided form body in the middle, and a Cancel + Submit
 * footer at the bottom. Wraps `useFlowView()`'s `Header` / `Footer` slots
 * so the drawer chrome stays consistent across plugins.
 *
 * Callers own the `<Form>` instance, validation, and the actual API call.
 * This component only handles the chrome and the close behaviour.
 */
export function DrawerFormLayout(props: DrawerFormLayoutProps) {
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
      {view.Header ? (
        <view.Header
          title={
            <span className={titleClassName}>
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={handleCancel} />
              <span>{props.title}</span>
            </span>
          }
        />
      ) : null}
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
