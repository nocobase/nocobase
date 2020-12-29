import React, { useRef } from 'react';
import { Button } from 'antd';
import ViewFactory from '@/components/views';
import { EditOutlined } from '@ant-design/icons';

export function Update(props) {
  const { title, viewName, resourceName, collection_name } = props.schema;
  const { resourceKey, activeTab = {}, item = {} } = props;
  const { associationField } = activeTab;

  const params = {};

  if (associationField && associationField.target) {
    params['resourceName'] = associationField.target;
    params['resourceTarget'] = associationField.target;
    params['associatedName'] = resourceName;
    params['associatedKey'] = item.itemId;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId || resourceKey;
  }
  const drawerRef = useRef<any>();
  return (
    <>
      <ViewFactory 
        {...props}
        reference={drawerRef}
        viewName={viewName}
        mode={'update'}
        {...params}
      />
      <Button icon={<EditOutlined />} type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
        drawerRef.current.getData(item.itemId || resourceKey);
      }}>{title}</Button>
    </>
  )
}

export default Update;
