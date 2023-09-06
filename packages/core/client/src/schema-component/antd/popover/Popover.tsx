import { Popover as AntdPopover, PopoverProps } from 'antd';
import React, { useCallback } from 'react';

export const PopoverWithStopPropagation = (props: PopoverProps) => {
  // 参见：https://github.com/ant-design/ant-design/issues/44119
  // fix T-1508
  const avoidClose = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  }, []);

  return (
    <div onClick={avoidClose}>
      <AntdPopover {...props} />
    </div>
  );
};
