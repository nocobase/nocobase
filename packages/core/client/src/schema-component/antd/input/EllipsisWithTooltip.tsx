import { Popover } from 'antd';
import React, { CSSProperties, forwardRef, useImperativeHandle, useState } from 'react';

const ellipsisDefaultStyle: CSSProperties = {
  overflow: 'hidden',
  overflowWrap: 'break-word',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  wordBreak: 'break-all',
};

interface IEllipsisWithTooltipProps {
  ellipsis: boolean;
  popoverContent: unknown;
  children: any;
}
export const EllipsisWithTooltip = forwardRef((props: Partial<IEllipsisWithTooltipProps>, ref: any) => {
  const [ellipsis, setEllipsis] = useState(false);
  const [visible, setVisible] = useState(false);
  useImperativeHandle(ref, () => {
    return {
      setPopoverVisible: setVisible,
    };
  });
  if (!props.ellipsis) {
    return <>{props.children}</>;
  }
  const { popoverContent } = props;
  return (
    <Popover
      visible={ellipsis && visible}
      onVisibleChange={(visible) => {
        setVisible(ellipsis && visible);
      }}
      content={
        <div
          style={{
            width: 300,
            overflowX: 'auto',
          }}
        >
          {popoverContent || props.children}
        </div>
      }
    >
      <div
        style={{ ...ellipsisDefaultStyle }}
        onMouseEnter={(e) => {
          const el = e.target as any;
          setEllipsis(el.scrollWidth > el.clientWidth);
        }}
      >
        {props.children}
      </div>
    </Popover>
  );
});
