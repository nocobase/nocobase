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
      <ViewFactory reference={drawerRef} id={viewId}/>
      <Button type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
      }}>{title}</Button>
    </>
  )
}

export default Create;
