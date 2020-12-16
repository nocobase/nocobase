import React, { useRef } from 'react'
import { connect } from '@formily/react-schema-renderer'
import moment from 'moment'
import { Select, Button, Table as AntdTable } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr
} from '../shared'
import ViewFactory from '@/components/views';
import Table from './Table';

function Field(props) {
  const drawerRef = useRef<any>();
  return (
    <>
      <ViewFactory 
        reference={drawerRef}
        viewName={'form'}
        resourceName={'fields'}
      />
      <Button type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
      }}>字段</Button>
    </>
  );
}

export const DrawerField = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(Field)

export const Fields = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(Table)

export default DrawerField
