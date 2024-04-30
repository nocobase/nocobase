import { connect, mapProps, mapReadPretty } from '@formily/react';
import { AutoComplete as AntdAutoComplete } from 'antd';
import { ReadPretty } from '../input';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

export const AutoComplete = withDynamicSchemaProps(
  connect(
    AntdAutoComplete,
    mapProps({
      dataSource: 'options',
    }),
    mapReadPretty(ReadPretty.Input),
  ),
);
