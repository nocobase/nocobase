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
  footer?: React.ReactNode;
  header?: { title?: React.ReactNode; extra?: React.ReactNode };
}

const DialogComponent = forwardRef<unknown, DialogComponentProps>(
  ({ afterClose, footer: initialFooter, header: initialHeader, ...props }, ref) => {
    const [visible, setVisible] = useState(true);
    const [config, setConfig] = useState<any>(props);
    const [footer, setFooter] = useState(initialFooter);
    const [header, setHeader] = useState(initialHeader);

    useImperativeHandle(ref, () => ({
      destroy: () => setVisible(false),
      update: (newConfig) => setConfig((prev) => ({ ...prev, ...newConfig })),
      setFooter: (newFooter) => {
        setFooter(newFooter);
      },
      setHeader: (newHeader) => {
        if (Object.values(newHeader || {}).length === 0) {
          setHeader(null);
        } else {
          setHeader(newHeader);
        }
      },
    }));

    // 处理 header 配置
    const modalProps = {
      ...config,
      title: header?.title || config.title,
      extra: header?.extra,
      footer: footer !== undefined ? footer : config.footer ?? null,
    };

    return (
      <Modal
        closable={false}
        {...modalProps}
        open={visible}
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
  },
);

export default DialogComponent;
