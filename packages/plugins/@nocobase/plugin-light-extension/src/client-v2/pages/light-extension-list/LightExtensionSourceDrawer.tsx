/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SaveOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Space } from 'antd';
import React from 'react';

import type { LightExtensionRepoRecord } from '../../../shared/types';
import LightExtensionWorkspacePage, { type LightExtensionWorkspaceFooterActions } from '../LightExtensionWorkspacePage';
import type { LightExtensionListTranslate } from './types';

const SOURCE_DRAWER_WIDTH = 'min(1280px, calc(100vw - 64px))';

interface LightExtensionSourceDrawerProps {
  footerActions: LightExtensionWorkspaceFooterActions | null;
  onClose: () => void;
  onFooterActionsChange: (actions: LightExtensionWorkspaceFooterActions | null) => void;
  onSaved: () => void | Promise<void>;
  open: boolean;
  repo: LightExtensionRepoRecord | null;
  t: LightExtensionListTranslate;
}

export function LightExtensionSourceDrawer({
  footerActions,
  onClose,
  onFooterActionsChange,
  onSaved,
  open,
  repo,
  t,
}: LightExtensionSourceDrawerProps) {
  return (
    <Drawer
      destroyOnClose
      motion={{ motionName: '' }}
      onClose={onClose}
      open={open}
      styles={{ body: { overflow: 'hidden', padding: 16 } }}
      footer={
        open ? (
          <Flex justify="flex-end">
            <Space>
              <Button disabled={footerActions?.loading} onClick={footerActions?.onCancel || onClose}>
                {t('Cancel')}
              </Button>
              <Button
                disabled={!footerActions || footerActions.disabled}
                icon={<SaveOutlined />}
                loading={footerActions?.loading}
                onClick={footerActions?.onSave}
                type="primary"
              >
                {t('Save')}
              </Button>
            </Space>
          </Flex>
        ) : null
      }
      title={open && repo ? `${t('Source')}: ${repo.title || repo.name}` : null}
      width={SOURCE_DRAWER_WIDTH}
    >
      {open ? (
        <LightExtensionWorkspacePage
          defaultFilesCollapsed
          embedded
          onFooterActionsChange={onFooterActionsChange}
          onRequestClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Drawer>
  );
}
