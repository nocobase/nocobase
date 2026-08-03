/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Drawer, Flex, Form, Input, Modal, Space, Typography } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

import type { LightExtensionRepoRecord } from '../../../shared/types';
import LightExtensionCreateSourceSelector, {
  type LightExtensionCreateSource,
} from '../../components/LightExtensionCreateSourceSelector';
import type { CreateRepoFormValues, EditRepoFormValues, LightExtensionListTranslate } from './types';

interface LightExtensionRepoOverlaysProps {
  createForm: FormInstance<CreateRepoFormValues>;
  createOpen: boolean;
  createSource: LightExtensionCreateSource | undefined;
  createSourceKey: number;
  creating: boolean;
  editForm: FormInstance<EditRepoFormValues>;
  editing: boolean;
  editTarget: LightExtensionRepoRecord | null;
  marginSM: number;
  onCancelCreate: () => void;
  onCancelEdit: () => void;
  onCancelRemove: () => void;
  onConfirmCreate: () => Promise<void>;
  onConfirmRemove: () => Promise<void>;
  onCreateSourceChange: (source: LightExtensionCreateSource | undefined) => void;
  onUpdateRepo: (values: EditRepoFormValues) => Promise<void>;
  removeTarget: LightExtensionRepoRecord | null;
  removing: boolean;
  t: LightExtensionListTranslate;
}

export function LightExtensionRepoOverlays({
  createForm,
  createOpen,
  createSource,
  createSourceKey,
  creating,
  editForm,
  editing,
  editTarget,
  marginSM,
  onCancelCreate,
  onCancelEdit,
  onCancelRemove,
  onConfirmCreate,
  onConfirmRemove,
  onCreateSourceChange,
  onUpdateRepo,
  removeTarget,
  removing,
  t,
}: LightExtensionRepoOverlaysProps) {
  return (
    <>
      {createOpen ? (
        <Modal
          confirmLoading={creating}
          okButtonProps={{ disabled: !createSource }}
          okText={t('Create')}
          onCancel={onCancelCreate}
          onOk={onConfirmCreate}
          open
          title={t('Create JS Template')}
        >
          <Form form={createForm} layout="vertical">
            <Form.Item
              extra={t('The name is generated automatically and can be changed if needed.')}
              label={t('Name')}
              name="name"
              rules={[
                { required: true, message: t('Name is required') },
                { pattern: /^[a-z][a-z0-9._-]*$/, message: t('Name format is invalid') },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t('Title')}
              name="title"
              rules={[{ required: true, whitespace: true, message: t('Title is required') }]}
            >
              <Input autoFocus />
            </Form.Item>
            <Form.Item label={t('Description')} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <LightExtensionCreateSourceSelector
              disabled={creating}
              key={createSourceKey}
              onChange={onCreateSourceChange}
            />
          </Form>
        </Modal>
      ) : null}

      <Drawer
        aria-label={t('Edit JS Template')}
        destroyOnClose
        footer={
          <Flex justify="flex-end">
            <Space>
              <Button disabled={editing} onClick={onCancelEdit}>
                {t('Cancel')}
              </Button>
              <Button form="light-extension-edit-form" htmlType="submit" loading={editing} type="primary">
                {t('Save')}
              </Button>
            </Space>
          </Flex>
        }
        maskClosable={!editing}
        onClose={onCancelEdit}
        open={Boolean(editTarget)}
        title={t('Edit JS Template')}
      >
        <Form form={editForm} id="light-extension-edit-form" layout="vertical" onFinish={onUpdateRepo}>
          <Form.Item
            label={t('Title')}
            name="title"
            rules={[{ required: true, whitespace: true, message: t('Title is required') }]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        cancelButtonProps={{ disabled: removing }}
        cancelText={t('Cancel')}
        closable={!removing}
        confirmLoading={removing}
        maskClosable={false}
        okButtonProps={{ danger: true }}
        okText={t('Remove')}
        onCancel={onCancelRemove}
        onOk={onConfirmRemove}
        open={Boolean(removeTarget)}
        title={t('Remove this repository?')}
      >
        <Space direction="vertical" size={marginSM} style={{ width: '100%' }}>
          <Typography.Text>
            {t('Repository to remove')}:{' '}
            <Typography.Text strong>{removeTarget?.title || removeTarget?.name}</Typography.Text>
          </Typography.Text>
          <Alert message={t('This action cannot be undone')} showIcon type="warning" />
        </Space>
      </Modal>
    </>
  );
}
