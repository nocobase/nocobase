import { Popover } from 'antd';
import React, { CSSProperties, useState } from 'react';

const ellipsisDefaultStyle: CSSProperties = {
  overflow: 'hidden',
  overflowWrap: 'break-word',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  wordBreak: 'break-all',
};

export const EllipsisWithTooltip = (props) => {
  const [ellipsis, setEllipsis] = useState(false);
  const [visible, setVisible] = useState(false);
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
};
