import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import React from 'react';
import { ReadPretty as InputReadPretty } from '../input';
import { MarkdownVoid } from './Markdown.Void';
import { convertToText, markdown } from './util';

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
    let text = convertToText(props.value);
    let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(props.value) }} />;
    return <InputReadPretty.TextArea {...props} autop={false} text={text} value={value} />;
  }),
);

Markdown.Void = MarkdownVoid;

export default Markdown;
