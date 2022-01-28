import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, observer, useFieldSchema } from '@formily/react';
import { Input as AntdInput } from 'antd';
import { marked } from 'marked';
import React from 'react';
import { ReadPretty as InputReadPretty } from '../input';

export function markdown(text) {
  if (!text) {
    return '';
  }
  return marked.parse(text);
}

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

const MarkdownVoid = observer((props: any) => {
  const schema = useFieldSchema();
  const text = schema['x-component-props']?.['content'] ?? schema['default'];
  let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
  return <InputReadPretty.TextArea {...props} text={text} value={value} />;
});
Markdown.Void = connect(MarkdownVoid);

export default Markdown;
