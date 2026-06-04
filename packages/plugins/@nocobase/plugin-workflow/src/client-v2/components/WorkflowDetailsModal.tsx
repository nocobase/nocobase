/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Descriptions, Modal } from 'antd';
import React from 'react';
import { useWorkflowTranslation } from '../locale';
import { formatTime, formatUser, type WorkflowCanvasRecord } from './workflowCanvas';

export function WorkflowDetailsModal({
  record,
  open,
  onClose,
}: {
  record: WorkflowCanvasRecord;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useWorkflowTranslation();
  return (
    <Modal open={open} title={t('Details')} width={640} footer={null} onCancel={onClose}>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Key" span={2}>
          {record.key || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('Created by')}>{formatUser(record.createdBy)}</Descriptions.Item>
        <Descriptions.Item label={t('Created at')}>{formatTime(record.createdAt)}</Descriptions.Item>
        <Descriptions.Item label={t('Last updated by')}>{formatUser(record.updatedBy)}</Descriptions.Item>
        <Descriptions.Item label={t('Last updated at')}>{formatTime(record.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label={t('Description')} span={2}>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{record.description || '-'}</div>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default WorkflowDetailsModal;
