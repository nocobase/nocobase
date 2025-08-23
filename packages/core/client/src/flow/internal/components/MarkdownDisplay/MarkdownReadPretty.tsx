/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useParseMarkdown, convertToText } from './util';
import { useMarkdownStyles } from './style';

export const MarkdownReadPretty = (props) => {
  const { textOnly } = props;
  const markdownClass = useMarkdownStyles();
  const { html = '' } = useParseMarkdown(props.value);
  const text = convertToText(html);
  const value = (
    <div
      className={` ${markdownClass} nb-markdown nb-markdown-default nb-markdown-table`}
      dangerouslySetInnerHTML={{ __html: html }}
      style={props.style}
    />
  );

  return <>{textOnly ? text : value}</>;
};
