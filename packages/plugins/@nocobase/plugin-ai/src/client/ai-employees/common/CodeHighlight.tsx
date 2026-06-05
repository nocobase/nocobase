/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useGlobalTheme } from '@nocobase/client';

export type CodeHighlightProps = {
  language: string;
  value: string;
  height?: string;
  scrollToBottom?: boolean;
};

export const CodeHighlight: React.FC<CodeHighlightProps> = ({ language, value, height, scrollToBottom, ...rest }) => {
  const { isDarkTheme } = useGlobalTheme();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollToBottom === true) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [value, scrollToBottom]);

  const content = (
    <SyntaxHighlighter {...rest} PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
      {value}
    </SyntaxHighlighter>
  );

  if (!height && !scrollToBottom) {
    return content;
  }

  return (
    <div style={{ maxHeight: height ?? '500px', overflowY: 'auto' }}>
      {content}
      <div ref={bottomRef} />
    </div>
  );
};
