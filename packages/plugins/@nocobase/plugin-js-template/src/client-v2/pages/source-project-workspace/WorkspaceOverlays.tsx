/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Flex, Modal, Space, Spin, Typography } from 'antd';
import React from 'react';

import { CloseConfirmModal, CommitDiffModal, RestoreVersionModal, SaveVersionModal } from '../../vsc-file/public-api';

export interface WorkspaceOverlaysProps {
  closeConfirmProps: React.ComponentProps<typeof CloseConfirmModal>;
  commitDiffProps: React.ComponentProps<typeof CommitDiffModal>;
  importInput: {
    ariaLabel: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    ref: React.Ref<HTMLInputElement>;
  };
  restoreVersionProps: React.ComponentProps<typeof RestoreVersionModal>;
  saveVersionProps: React.ComponentProps<typeof SaveVersionModal>;
  saving: {
    compilingLabel: string;
    open: boolean;
    savingLabel: string;
    title: string;
  };
}

export function WorkspaceOverlays(props: WorkspaceOverlaysProps) {
  const { closeConfirmProps, commitDiffProps, importInput, restoreVersionProps, saveVersionProps, saving } = props;
  return (
    <>
      <RestoreVersionModal {...restoreVersionProps} />

      <CommitDiffModal {...commitDiffProps} />

      <input
        accept=".zip,application/zip,application/x-zip-compressed"
        aria-label={importInput.ariaLabel}
        onChange={importInput.onChange}
        ref={importInput.ref}
        style={{ display: 'none' }}
        type="file"
      />

      <SaveVersionModal {...saveVersionProps} />

      <Modal
        closable={false}
        footer={null}
        keyboard={false}
        maskClosable={false}
        open={saving.open}
        title={saving.title}
      >
        <Flex align="center" gap={12}>
          <Spin />
          <Space direction="vertical" size={0}>
            <Typography.Text>{saving.savingLabel}</Typography.Text>
            <Typography.Text type="secondary">{saving.compilingLabel}</Typography.Text>
          </Space>
        </Flex>
      </Modal>

      <CloseConfirmModal {...closeConfirmProps} />
    </>
  );
}
