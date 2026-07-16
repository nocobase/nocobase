/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Input, Modal, Tag, Tooltip } from 'antd';
import { InfoOutlined } from '@ant-design/icons';
import { useT } from '../locale';
import { useFlowContext } from '../canvas/contexts';
import { formatTime } from '../components/workflowCanvas';
import { ExecutionStatusTag } from '../components/ExecutionStatusTag';
import useStyles from '../canvas/style';

export function TriggerExecutionButton({ triggerTitle }: { triggerTitle: string }) {
  const t = useT();
  const { execution, workflow } = useFlowContext() ?? {};
  const [open, setOpen] = React.useState(false);
  const { styles } = useStyles();

  if (!execution) {
    return null;
  }

  return (
    <>
      <Tooltip title={t('View result')}>
        <Button
          type="primary"
          shape="circle"
          size="small"
          icon={<InfoOutlined />}
          className={styles.nodeJobButtonClass}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          onMouseDown={(event) => event.stopPropagation()}
        />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        width={980}
        footer={null}
        title={
          <div className={styles.nodeTitleClass}>
            <Tag>{triggerTitle}</Tag>
            <strong>{workflow?.title}</strong>
          </div>
        }
        destroyOnClose
        modalRender={(node) => (
          <div onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
            {node}
          </div>
        )}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('Triggered at')}:</div>
          <div>{formatTime(execution?.createdAt)}</div>
        </div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('Trigger variables')}:</div>
        <Input.TextArea
          value={JSON.stringify(execution?.context ?? null, null, 2)}
          disabled
          autoSize={{ minRows: 4, maxRows: 20 }}
          className={styles.nodeJobResultClass}
          style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '80%' }}
        />
      </Modal>
    </>
  );
}

export default TriggerExecutionButton;
