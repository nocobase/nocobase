import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import { InputProps, TextAreaProps } from 'antd/es/input';
import React from 'react';
import { JSONTextAreaProps, Json } from './Json';
import { ReadPretty } from './ReadPretty';

export { ReadPretty as InputReadPretty } from './ReadPretty';

type ComposedInput = React.FC<InputProps> & {
  ReadPretty: React.FC<InputProps | { ellipsis?: boolean }>;
  TextArea: React.FC<TextAreaProps>;
  URL: React.FC<InputProps>;
  JSON: React.FC<JSONTextAreaProps>;
};

export const Input: ComposedInput = Object.assign(
  connect(
    AntdInput,
    mapProps((props, field) => {
      return {
        ...props,
        suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
      };
    }),
    mapReadPretty(ReadPretty.Input),
  ),
  {
    TextArea: connect(
      AntdInput.TextArea,
      mapProps((props, field) => {
        return {
          autoSize: {
            maxRows: 10,
            minRows: 3,
          },
          ...props,
        };
      }),
      mapReadPretty(ReadPretty.TextArea),
    ),
    URL: connect(AntdInput, mapReadPretty(ReadPretty.URL)),
    JSON: connect(Json, mapReadPretty(ReadPretty.JSON)),
    ReadPretty: ReadPretty.Input,
  },
);

export default Input;
