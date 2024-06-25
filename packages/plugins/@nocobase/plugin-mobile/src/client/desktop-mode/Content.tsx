/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Card } from 'antd';
import { Resizable } from 're-resizable';
import { BottomRightHandle, LeftRightHandle, BottomHandle, BottomLeftHandle } from './ResizableHandle';
import { useSize } from './sizeContext';

interface DesktopModeContentProps {
  children?: React.ReactNode;
}

export const DesktopModeContent: FC<DesktopModeContentProps> = ({ children }) => {
  const { size, setSize } = useSize();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Resizable
        style={{
          position: 'relative',
          border: '1px solid white',
          boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 30px',
          // borderRadius: '0.75em',
          // overflow: 'hidden',
        }}
        size={{ width: size.width, height: size.height }}
        onResizeStop={(e, direction, ref, d) => {
          setSize({
            width: size.width + d.width,
            height: size.height + d.height,
          });
        }}
        handleComponent={{
          bottomLeft: <BottomLeftHandle />,
          bottomRight: <BottomRightHandle />,
          right: <LeftRightHandle left={5} />,
          left: <LeftRightHandle left={-12} />,
          bottom: <BottomHandle />,
        }}
        enable={{
          left: true,
          right: true,
          bottomLeft: true,
          bottomRight: true,
          bottom: true,
          top: false,
          topLeft: false,
          topRight: false,
        }}
      >
        <div style={{ width: '100%', height: '100%', overflowX: 'hidden' }}>{children}</div>
      </Resizable>
    </div>
  );
};
