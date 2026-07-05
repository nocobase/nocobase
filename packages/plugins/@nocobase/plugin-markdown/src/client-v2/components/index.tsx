/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Display, type MarkdownDisplayProps } from './Display';
import { Edit, type MarkdownEditProps } from './Edit';

export interface MarkdownVditorProps extends MarkdownDisplayProps, MarkdownEditProps {
  readPretty?: boolean;
  pattern?: string;
  [key: string]: unknown;
}

export const MarkdownVditor = (props: MarkdownVditorProps) => {
  if (props.readPretty || props.pattern === 'readPretty') {
    return <Display {...props} />;
  }

  return <Edit {...props} />;
};

export default MarkdownVditor;
