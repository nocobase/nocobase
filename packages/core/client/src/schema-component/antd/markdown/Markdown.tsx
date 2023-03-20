import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput, Spin } from 'antd';
import React from 'react';
import { ReadPretty as InputReadPretty } from '../input';
import { MarkdownVoid } from './Markdown.Void';
import { convertToText, useParseMarkdown } from './util';

import './style.less';

export const Markdown: any = connect(
  AntdInput.TextArea,
  mapProps((props: any, field) => {
    return {
      autoSize: {
        maxRows: 10,
        minRows: 3,
      },
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    const { html, loading } = useParseMarkdown(props.value);
    const text = convertToText(html);
    let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: html }} />;
    if (loading) {
      return <Spin />;
    }
    return <InputReadPretty.TextArea {...props} autop={false} text={text} value={value} />;
  }),
);

Markdown.Void = MarkdownVoid;

export default Markdown;
