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

import type { JsTemplateProject } from '../../../shared/types';
import JsTemplateWorkspacePage, { type JsTemplateWorkspaceFooterActions } from '../JsTemplateWorkspacePage';
import type { JsTemplateListTranslate } from './types';

const SOURCE_DRAWER_WIDTH = 'min(1280px, calc(100vw - 64px))';

interface JsTemplateSourceDrawerProps {
  footerActions: JsTemplateWorkspaceFooterActions | null;
  onClose: () => void;
  onFooterActionsChange: (actions: JsTemplateWorkspaceFooterActions | null) => void;
  onSaved: () => void | Promise<void>;
  open: boolean;
  project: JsTemplateProject | null;
  t: JsTemplateListTranslate;
}

export function JsTemplateSourceDrawer({
  footerActions,
  onClose,
  onFooterActionsChange,
  onSaved,
  open,
  project,
  t,
}: JsTemplateSourceDrawerProps) {
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
      title={open && project ? `${t('Source')}: ${project.title || project.name}` : null}
      width={SOURCE_DRAWER_WIDTH}
    >
      {open ? (
        <JsTemplateWorkspacePage
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
