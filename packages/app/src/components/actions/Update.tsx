import React, { useRef } from 'react';
import { Button } from 'antd';
import ViewFactory from '@/components/views';

export function Update(props) {
  console.log(props);
  const { title, viewCollectionName, viewName } = props.schema;
  const { activeTab = {}, item = {} } = props;
  const { association, collection_name } = activeTab;

  const params = {};

  if (association) {
    params['resourceName'] = association;
    params['associatedName'] = collection_name;
    params['associatedKey'] = item.itemId;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId;
  }

  const drawerRef = useRef<any>();
  return (
    <>
      <ViewFactory
        {...props}
        reference={drawerRef}
        viewCollectionName={viewCollectionName}
        viewName={viewName}
        {...params}
      />
      <Button type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
      }}>{title}</Button>
    </>
  )
}

export default Update;
