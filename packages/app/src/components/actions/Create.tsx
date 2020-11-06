import React, { useRef } from 'react';
import { Button } from 'antd';
import ViewFactory from '@/components/views';

export function Create(props) {
  console.log(props);
  const { title, viewCollectionName, viewName } = props.schema;
  const drawerRef = useRef<any>();
  return (
    <>
      <ViewFactory reference={drawerRef} viewCollectionName={viewCollectionName} viewName={viewName}/>
      <Button type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
      }}>{title}</Button>
    </>
  )
}

export default Create;
