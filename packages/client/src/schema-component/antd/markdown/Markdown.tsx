import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import React from 'react';
import { ReadPretty as InputReadPretty } from '../input';
import { MarkdownVoid } from './Markdown.Void';
import { markdown } from './util';

export const Markdown: any = connect(
  AntdInput.TextArea,
  mapProps((props: any, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    let text = props.value;
    let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
    return <InputReadPretty.TextArea {...props} text={text} value={value} />;
  }),
);

Markdown.Void = MarkdownVoid;

export default Markdown;
