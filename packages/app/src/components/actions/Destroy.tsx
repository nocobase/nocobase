import React, { useRef } from 'react';
import { Button } from 'antd';
import ViewFactory from '@/components/views';

export function Destroy(props) {
  console.log(props);
  const { title, viewId } = props.schema;
  const drawerRef = useRef<any>();
  return (
    <>
      <Button type={'primary'} onClick={() => {
        
      }}>{title}</Button>
    </>
  )
}

export default Destroy;
