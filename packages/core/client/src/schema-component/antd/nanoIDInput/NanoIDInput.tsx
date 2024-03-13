import { customAlphabet as Alphabet } from 'nanoid';
import React, { useEffect } from 'react';
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
      useEffect(() => {
        if (!field.initialValue) {
          field.setInitialValue(Alphabet(customAlphabet, size)());
        }
      }, []);
      return {
        ...props,
        suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
      };
    }),
    mapReadPretty(ReadPretty.Input),
  ),
  {
    ReadPretty: ReadPretty.Input,
  },
);
