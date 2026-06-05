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
      {...config}
      open={visible}
      onClose={(e) => {
        setVisible(false);
        config.onClose?.(e);
      }}
      afterOpenChange={(open) => {
        if (!open) {
          afterClose?.();
        }
      }}
    >
      {config.content}
    </Drawer>
  );
});

export default DrawerComponent;
