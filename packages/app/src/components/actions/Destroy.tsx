import React, { useRef } from 'react';
import { Button, Popconfirm } from 'antd';
import ViewFactory from '@/components/views';
import { DeleteOutlined } from '@ant-design/icons';

export function Destroy(props) {
  console.log(props);
  const { onTrigger } = props;
  const { title, viewId, isBulk = true } = props.schema;
  const drawerRef = useRef<any>();
  return (
    <>
      <Popconfirm title="确认删除吗？" onConfirm={() => {
          console.log('destroy', onTrigger);
          onTrigger && onTrigger();
        }}>
        <Button icon={<DeleteOutlined />} type={'ghost'} danger>{title}</Button>
      </Popconfirm>
    </>
  )
}

export default Destroy;
