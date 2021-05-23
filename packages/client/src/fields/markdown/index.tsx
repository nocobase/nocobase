import React from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import { Descriptions } from '../descriptions';
import { LoadingOutlined } from '@ant-design/icons';
import micromark from 'micromark';

export const Markdown = connect(
  AntdInput.TextArea,
  mapProps((props: any, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    let text = props.value;
    let value = (
      <div dangerouslySetInnerHTML={{ __html: micromark(text || '') }} />
    );
    return <Descriptions.TextArea {...props} text={text} value={value} />;
  }),
);

export default Markdown;
