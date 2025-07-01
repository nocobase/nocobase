/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Modal } from 'antd';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

interface DialogComponentProps extends React.ComponentProps<typeof Modal> {
  afterClose?: () => void;
  content?: React.ReactNode;
}

const DialogComponent = forwardRef<unknown, DialogComponentProps>(({ afterClose, ...props }, ref) => {
  const [visible, setVisible] = useState(true);
  const [config, setConfig] = useState(props);

  useImperativeHandle(ref, () => ({
    destroy: () => setVisible(false),
    update: (newConfig) => setConfig((prev) => ({ ...prev, ...newConfig })),
  }));

  return (
    <Modal
      closable={false}
      {...config}
      open={visible}
      footer={config.footer ?? null}
      onCancel={(e) => {
        setVisible(false);
        config.onCancel?.(e);
      }}
      afterClose={() => {
        afterClose?.();
      }}
    >
      {config.children}
    </Modal>
  );
});

export default DialogComponent;
