import { Popover } from 'antd';
import React, { CSSProperties, forwardRef, useImperativeHandle, useRef, useState } from 'react';

const getContentWidth = (element) => {
  if (element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const contentWidth = range.getBoundingClientRect().width;
    return contentWidth;
  }
};
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
  const elRef: any = useRef();
  useImperativeHandle(ref, () => {
    return {
      setPopoverVisible: setVisible,
    };
  });
  if (!props.ellipsis) {
    return <>{props.children}</>;
  }
  const { popoverContent } = props;

  const isOverflowTooltip = () => {
    const contentWidth = getContentWidth(elRef.current);
    const offsetWidth = elRef.current?.offsetWidth;
    return contentWidth > offsetWidth;
  };

  return (
    <Popover
      open={ellipsis && visible}
      onOpenChange={(visible) => {
        setVisible(ellipsis && visible);
      }}
      content={
        <div
          style={{
            width: 300,
            overflow: 'auto',
            maxHeight: 400,
          }}
        >
          {popoverContent || props.children}
        </div>
      }
    >
      <div
        ref={elRef}
        style={{ ...ellipsisDefaultStyle }}
        onMouseEnter={(e) => {
          const el = e.target as any;
          const isShowTooltips = isOverflowTooltip();
          if (isShowTooltips) {
            setEllipsis(el.scrollWidth >= el.clientWidth);
          }
        }}
      >
        {props.children}
      </div>
    </Popover>
  );
});
EllipsisWithTooltip.displayName = 'EllipsisWithTooltip';
