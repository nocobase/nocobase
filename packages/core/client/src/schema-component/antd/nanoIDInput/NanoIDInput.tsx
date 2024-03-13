import { customAlphabet as Alphabet } from 'nanoid';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import { ReadPretty } from '../input';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';

export const NanoIDInput = Object.assign(
  connect(
    AntdInput,
    mapProps((props: any, field: any) => {
      const { size, customAlphabet } = useCollectionField();
      return {
        ...props,
        defaultValue: field.initialValue || Alphabet(customAlphabet, size),
        suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
      };
    }),
    mapReadPretty(ReadPretty.Input),
  ),
  {
    ReadPretty: ReadPretty.Input,
  },
);
