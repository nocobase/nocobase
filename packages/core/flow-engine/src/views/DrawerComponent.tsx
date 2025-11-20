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
import { MobilePopup } from '../components/MobilePopup';

const DrawerComponent = React.forwardRef((props: any, ref) => {
  const { children, footer: initialFooter, title, extra, hidden, isMobile, ...drawerProps } = props;
  const [open, setOpen] = React.useState(true);
  const [footer, setFooter] = React.useState(() => initialFooter);
  const [header, setHeader] = React.useState({ title, extra, ...drawerProps.header });

  React.useImperativeHandle(
    ref,
    () => ({
      destroy: () => {
        setOpen(false);
        drawerProps.afterClose?.();
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

  if (isMobile) {
    return (
      <MobilePopup
        className={hidden ? 'nb-hidden' : ''}
        visible={open}
        {...drawerProps}
        footer={footer}
        {...header}
        onClose={() => {
          setOpen(false);
          drawerProps.afterClose?.();
        }}
      >
        {children}
      </MobilePopup>
    );
  }

  return (
    <Drawer
      rootClassName={hidden ? 'nb-hidden' : ''}
      closable={false}
      getContainer={document.body}
      {...drawerProps}
      open={open}
      footer={footer}
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
