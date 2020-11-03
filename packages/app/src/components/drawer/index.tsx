import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Button, Drawer } from 'antd';

export const DrawerRef = forwardRef((props: any, ref) => {
  const [visible, setVisible] = useState(false);
  useImperativeHandle(ref, () => ({
    setVisible,
  }));
  return (
    <Drawer
      {...props}
      destroyOnClose
      visible={visible}
      width={'40%'}
      
      onClose={() => {
        setVisible(false);
      }}
    >
      {props.children}
    </Drawer>
  );
});

export default DrawerRef;
