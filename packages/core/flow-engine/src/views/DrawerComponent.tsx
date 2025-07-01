/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// components/drawer/useDrawer/DrawerComponent.tsx
import { Drawer } from 'antd';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

interface DrawerComponentProps extends React.ComponentProps<typeof Drawer> {
  afterClose?: () => void;
  content?: React.ReactNode;
}

const DrawerComponent = forwardRef<unknown, DrawerComponentProps>(({ afterClose, ...props }, ref) => {
  const [visible, setVisible] = useState(true);
  const [config, setConfig] = useState(props);

  useImperativeHandle(ref, () => ({
    destroy: () => setVisible(false),
    update: (newConfig) => setConfig((prev) => ({ ...prev, ...newConfig })),
  }));

  return (
    <Drawer
      closable={false}
      {...config}
      open={visible}
      onClose={(e) => {
        setVisible(false);
        config.onClose?.(e);
      }}
      styles={{
        ...config?.styles,
        footer: {
          textAlign: 'end',
          ...config?.styles?.footer,
        },
      }}
      afterOpenChange={(open) => {
        if (!open) {
          afterClose?.();
        }
      }}
    >
      {config.children}
    </Drawer>
  );
});

export default DrawerComponent;
