/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import React from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { EditableFieldModel } from '../EditableFieldModel';
import { useParseMarkdown } from './util';
import { useMarkdownStyles } from './style';

const MarkdownReadPretty = (props) => {
  const markdownClass = useMarkdownStyles();
  const { html = '' } = useParseMarkdown(props.value);

  const value = (
    <div
      className={` ${markdownClass} nb-markdown nb-markdown-default nb-markdown-table`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return value;
};

const Markdown: any = connect(
  Input.TextArea,
  mapProps((props: any, field) => {
    return {
      ...props,
    };
  }),
  mapReadPretty((props) => <MarkdownReadPretty {...props} />),
);
export class MarkdownEditableFieldModel extends EditableFieldModel {
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
