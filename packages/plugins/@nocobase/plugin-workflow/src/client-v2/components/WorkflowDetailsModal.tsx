/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { Descriptions, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import useStyles from '../canvas/style';
import { useWorkflowTranslation } from '../locale';
import { formatTime, formatUser, type WorkflowCanvasRecord } from './workflowCanvas';

export function WorkflowDetailsModal({
  record,
  open,
  onClose,
  resource,
  refresh,
}: {
  record: WorkflowCanvasRecord;
  open: boolean;
  onClose: () => void;
  resource: { update: (options: { filterByTk: string | number; values: { description: string } }) => Promise<unknown> };
  refresh: () => void;
}) {
  const { t } = useWorkflowTranslation();
  const { styles } = useStyles();
  const [editingDescription, setEditingDescription] = useState(record.description ?? '');

  useEffect(() => {
    if (open) {
      setEditingDescription(record.description ?? '');
    }
  }, [open, record.description]);

  const onChangeDescription = useMemoizedFn((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingDescription(event.target.value);
  });

  const onBlurDescription = useMemoizedFn(async (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const description = event.target.value;
    if (description === (record.description ?? '')) {
      return;
    }
    await resource.update({
      filterByTk: record.id,
      values: {
        description,
      },
    });
    refresh();
  });

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
          <Input.TextArea
            aria-label={t('Description')}
            value={editingDescription}
            onChange={onChangeDescription}
            onBlur={onBlurDescription}
            placeholder="-"
            className={styles.workflowDetailsDescriptionClass}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default WorkflowDetailsModal;
