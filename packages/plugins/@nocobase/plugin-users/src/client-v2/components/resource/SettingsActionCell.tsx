/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Popconfirm, type ButtonProps, theme } from 'antd';
import React from 'react';

export interface SettingsActionConfirm {
  title: React.ReactNode;
  description?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
}

export interface SettingsActionItem<RecordType extends object = Record<string, unknown>> {
  key: React.Key;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  confirm?: SettingsActionConfirm;
  buttonProps?: Omit<ButtonProps, 'children' | 'danger' | 'disabled' | 'icon' | 'onClick' | 'type'>;
  onClick?: (record: RecordType) => Promise<void> | void;
}

export interface SettingsActionCellProps<RecordType extends object = Record<string, unknown>> {
  record: RecordType;
  actions: SettingsActionItem<RecordType>[];
  showIcons?: boolean;
  split?: React.ReactNode | null;
}

/**
 * Compact row-action renderer for settings tables. It keeps edit/delete style
 * actions visually consistent while leaving business behavior to the caller.
 */
export function SettingsActionCell<RecordType extends object = Record<string, unknown>>(
  props: SettingsActionCellProps<RecordType>,
) {
  const { token } = theme.useToken();
  const visibleActions = props.actions.filter((action) => !action.hidden);
  const splitNode = props.split === undefined ? '|' : props.split;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: token.marginXXS,
        rowGap: token.marginXXS,
      }}
    >
      {visibleActions.map((action, index) => {
        const button = (
          <Button
            {...action.buttonProps}
            type="link"
            size="small"
            danger={action.danger}
            disabled={action.disabled}
            icon={props.showIcons === false ? undefined : action.icon}
            onClick={() => action.onClick?.(props.record)}
            style={{
              paddingInline: 0,
              height: 'auto',
              ...action.buttonProps?.style,
            }}
          >
            {action.label}
          </Button>
        );

        const content = !action.confirm ? (
          button
        ) : (
          <Popconfirm
            key={action.key}
            title={action.confirm.title}
            description={action.confirm.description}
            okText={action.confirm.okText}
            cancelText={action.confirm.cancelText}
            onConfirm={() => action.onClick?.(props.record)}
          >
            {React.cloneElement(button, { onClick: undefined })}
          </Popconfirm>
        );

        return (
          <React.Fragment key={action.key}>
            {index > 0 && splitNode ? <span>{splitNode}</span> : null}
            {content}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export default SettingsActionCell;
