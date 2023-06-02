import { connect, mapProps, mapReadPretty } from '@formily/react';
import { AutoComplete as AntdAutoComplete } from 'antd';
import { ReadPretty } from '../input';

export const AutoComplete = connect(
  AntdAutoComplete,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty(ReadPretty.Input),
);
