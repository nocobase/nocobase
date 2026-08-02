/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SaveOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Flex, Space, Spin, Typography } from 'antd';
import React from 'react';

export function MissingRepositoryState(props: { description: string; embedded: boolean; title: string }) {
  const { description, embedded, title } = props;
  return (
    <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
      {!embedded ? (
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
      ) : null}
      <Empty description={description} />
    </Flex>
  );
}

export function InitialRepositoryLoadingState(props: { embedded: boolean; label: string }) {
  const { embedded, label } = props;
  return (
    <Flex
      align="center"
      aria-live="polite"
      gap={12}
      justify="center"
      role="status"
      style={{
        flex: embedded ? '1 1 0' : undefined,
        height: embedded ? '100%' : 520,
        minHeight: embedded ? 320 : 520,
        padding: 24,
      }}
      vertical
    >
      <Spin size="large" />
      <Typography.Text>{label}</Typography.Text>
    </Flex>
  );
}

export function WorkspacePageHeader(props: {
  disabled: boolean;
  embedded: boolean;
  loading: boolean;
  onSave: () => void;
  repoId: string;
  saveLabel: string;
  title: string;
}) {
  const { disabled, embedded, loading, onSave, repoId, saveLabel, title } = props;
  if (embedded) {
    return null;
  }

  return (
    <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
      <Space direction="vertical" size={0}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{repoId}</Typography.Text>
      </Space>
      <Space wrap>
        <Button disabled={disabled} icon={<SaveOutlined />} loading={loading} onClick={onSave} type="primary">
          {saveLabel}
        </Button>
      </Space>
    </Flex>
  );
}

export function WorkspaceNotice(props: {
  notice: { type: 'success' | 'info' | 'warning' | 'error'; message: string } | null;
  onClose: () => void;
}) {
  const { notice, onClose } = props;
  return notice ? <Alert closable message={notice.message} onClose={onClose} showIcon type={notice.type} /> : null;
}

export function WorkspaceLoadingStrip(props: { label: string; loading: boolean }) {
  const { label, loading } = props;
  return loading ? (
    <div aria-live="polite" role="status" style={{ padding: 24, textAlign: 'center' }}>
      <Spin />
      <Typography.Text style={{ display: 'block', marginTop: 8 }}>{label}</Typography.Text>
    </div>
  ) : null;
}
