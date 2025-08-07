/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { Popover } from 'antd';
import React, { CSSProperties, forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

const getContentWidth = (el: HTMLElement) => {
  if (el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const contentWidth = range.getBoundingClientRect().width;
    return contentWidth;
  }
};

const isOverflowTooltip = (el: HTMLElement) => {
  if (!el) return false;
  const contentWidth = getContentWidth(el);
  const offsetWidth = el.offsetWidth;
  return contentWidth > offsetWidth;
};

interface IEllipsisWithTooltipProps {
  ellipsis: boolean;
  popoverContent: unknown;
  children: any;
  role?: string;
}

const popoverStyle = {
  width: 300,
  overflow: 'auto',
  maxHeight: 400,
};

export const EllipsisWithTooltip = forwardRef((props: Partial<IEllipsisWithTooltipProps>, ref: any) => {
  const ellipsisDefaultStyle: CSSProperties = {
    overflow: 'hidden',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordBreak: 'break-all',
  };

  const [ellipsis, setEllipsis] = useState(false);
  const [visible, setVisible] = useState(false);
  const elRef: any = useRef();
  useImperativeHandle(
    ref,
    () => {
      return {
        setPopoverVisible: setVisible,
      };
    },
    [],
  );

  const fieldSchema = useFieldSchema();
  if (fieldSchema?.parent?.['x-component'] === 'TableV2.Column' && fieldSchema?.parent?.['x-component-props']?.width) {
    ellipsisDefaultStyle.width = fieldSchema.parent['x-component-props'].width;
  }

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    const el = e.target as any;
    const isShowTooltips = isOverflowTooltip(elRef.current);
    if (isShowTooltips) {
      setEllipsis(el.scrollWidth >= el.clientWidth);
    }
  }, []);

  const divContent = useMemo(
    () =>
      props.ellipsis ? (
        <div ref={elRef} role={props.role} style={ellipsisDefaultStyle} onMouseEnter={handleMouseEnter}>
          {props.children}
        </div>
      ) : (
        props.children
      ),
    [handleMouseEnter, props.children, props.ellipsis, props.role, ellipsisDefaultStyle.width],
  );

  if (!props.ellipsis || !ellipsis) {
    return divContent;
  }

  return (
    <Popover
      open={ellipsis && visible}
      onOpenChange={(visible) => {
        setVisible(ellipsis && visible);
      }}
      content={<div style={popoverStyle}>{props.popoverContent || props.children}</div>}
    >
      {divContent}
    </Popover>
  );
});
EllipsisWithTooltip.displayName = 'EllipsisWithTooltip';
