import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Button } from 'antd';
import Drawer from '../drawer';
import ViewFactory from '@/components/views';

export function Create(props) {
  console.log(props);
  const { title, viewId } = props.schema;
  const drawerRef = useRef<any>();
  return (
    <>
      <Drawer title={'标题'} ref={drawerRef}>
        <ViewFactory id={viewId}/>
      </Drawer>
      <Button type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
      }}>{title}</Button>
    </>
  )
}

export default Create;
