/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Popover } from 'antd';
import React, { CSSProperties, forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

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

  const isOverflowTooltip = useCallback(() => {
    if (!elRef.current) return false;
    const contentWidth = getContentWidth(elRef.current);
    const offsetWidth = elRef.current?.offsetWidth;
    return contentWidth > offsetWidth;
  }, [elRef.current]);

  const divContent = useMemo(
    () =>
      props.ellipsis ? (
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
      ) : (
        props.children
      ),
    [props.children, props.ellipsis],
  );

  if (!props.ellipsis || !ellipsis) {
    return divContent;
  }
  const { popoverContent } = props;

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
      {divContent}
    </Popover>
  );
});
EllipsisWithTooltip.displayName = 'EllipsisWithTooltip';
