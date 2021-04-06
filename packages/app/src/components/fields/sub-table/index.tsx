import React, { useRef } from 'react';
import { connect } from '@formily/react-schema-renderer';
import moment from 'moment';
import { Select, Button, Table as AntdTable } from 'antd';
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr,
} from '../shared';
import Table from './Table';

export const SubTable = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(Table);

export default SubTable;
