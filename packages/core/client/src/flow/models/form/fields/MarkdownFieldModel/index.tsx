/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import React, { useMemo } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { FormFieldModel } from '../../../FormFieldModel';
import { useMarkdownStyles } from './style';
import { useParseMarkdown, convertToText } from './util';
import { useGlobalTheme } from '../../../../../global-theme';
import { Spin } from 'antd';
import { EllipsisWithTooltip } from '../../../../components';

const MarkdownReadPretty = (props) => {
  const { ellipsis } = props;
  const { isDarkTheme } = useGlobalTheme();
  const markdownClassName = useMarkdownStyles({ isDarkTheme });
  const { html = '', loading } = useParseMarkdown(props.value);
  const text = useMemo(() => convertToText(html), [html]);

  if (loading) {
    return <Spin />;
  }

  const value = (
    <div
      className={`${markdownClassName} nb-markdown nb-markdown-default nb-markdown-table`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return ellipsis ? (
    <EllipsisWithTooltip ellipsis={ellipsis} popoverContent={value}>
      {text || value}
    </EllipsisWithTooltip>
  ) : (
    value
  );
};

export const Markdown: any = connect(
  Input.TextArea,

  mapReadPretty((props) => <MarkdownReadPretty {...props} />),
);

export class MarkdownFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['markdown'];

  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      autoSize: {
        maxRows: 10,
        minRows: 3,
      },
    });
  }
  get component() {
    return [Markdown, {}];
  }
}
