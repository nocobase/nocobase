/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';

interface HtmlRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({ content, className, style }) => {
  const sanitizedContent = useMemo(() => {
    return content;
  }, [content]);

  return (
    <div
      className={className}
      style={{
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default HtmlRenderer;
