/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import { useMarkdownStyles } from './style';
import { convertToText, useParseMarkdown } from './util';

export const DisplayMarkdown = (props) => {
  const { textOnly, overflowMode, sanitizeHtml, style } = props;
  const markdownClass = useMarkdownStyles();
  const { html = '' } = useParseMarkdown(props.value);
  const displayHtml = sanitizeHtml ? sanitizeHtml(html) : html;
  const text = convertToText(displayHtml);
  const isEllipsis = overflowMode === 'ellipsis';

  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  // 检测内容是否溢出
  useEffect(() => {
    if (contentRef.current) {
      const el = contentRef.current;
      const overflowed = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      setIsOverflowed(overflowed);
    }
  }, [displayHtml, style, overflowMode]);

  // 通用样式（用于 ellipsis 模式）
  const baseStyle: React.CSSProperties = {
    ...(style || {}),
    ...(isEllipsis
      ? {
          display: '-webkit-box',
          WebkitLineClamp: 1, // 可改为多行省略
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          cursor: 'default',
        }
      : {}),
  };

  const content = textOnly ? (
    <div ref={contentRef} className={`${markdownClass} nb-markdown`} style={baseStyle}>
      {text}
    </div>
  ) : (
    <div
      ref={contentRef}
      className={`${markdownClass} nb-markdown`}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
      style={baseStyle}
    />
  );

  return isEllipsis && isOverflowed ? (
    <Tooltip
      title={
        <div
          dangerouslySetInnerHTML={{ __html: displayHtml }}
          style={{
            maxHeight: 500,
            overflowY: 'auto',
            padding: 10,
            color: '#000',
          }}
        />
      }
      overlayInnerStyle={{
        background: '#fff',
        color: '#000',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      color="#fff"
    >
      {content}
    </Tooltip>
  ) : (
    content
  );
};
