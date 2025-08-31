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
import * as React from 'react';

const DrawerComponent = React.forwardRef((props: any, ref) => {
  const { children, footer: initialFooter, title, extra, hidden, ...drawerProps } = props;
  const [open, setOpen] = React.useState(true);
  const [footer, setFooter] = React.useState(initialFooter);
  const [header, setHeader] = React.useState({ title, extra });

  React.useImperativeHandle(
    ref,
    () => ({
      destroy: () => {
        setOpen(false);
      },
      update: (newConfig) => {
        // 更新 drawer 配置
        Object.assign(drawerProps, newConfig);
      },
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
    }),
    [],
  );

  const hiddenStyle = React.useMemo(() => {
    return {
      display: hidden ? 'none' : 'block',
    };
  }, [hidden]);

  return (
    <Drawer
      closable={false}
      {...drawerProps}
      open={open}
      footer={footer}
      rootStyle={hiddenStyle}
      styles={{
        ...drawerProps.styles,
        footer: { display: 'flex', justifyContent: 'flex-end', ...drawerProps.styles?.footer },
      }}
      {...header} // 使用 extra 属性作为自定义 header
      onClose={() => {
        setOpen(false);
        drawerProps.afterClose?.();
      }}
    >
      {children}
    </Drawer>
  );
});

export default DrawerComponent;
