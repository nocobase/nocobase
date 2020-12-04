import React, { useRef } from 'react';
import { Button } from 'antd';
import ViewFactory from '@/components/views';

export function Create(props) {
  console.log(props);
  const { title, viewName, collection_name } = props.schema;
  const { activeTab = {}, item = {}, associatedName, associatedKey } = props;
  const { association  } = activeTab;

  const params = {};

  if (association) {
    params['resourceName'] = association;
    params['associatedName'] = associatedName;
    params['associatedKey'] = associatedKey;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId;
  }

  console.log(params);

  const drawerRef = useRef<any>();
  return (
    <>
      <ViewFactory 
        {...props}
        reference={drawerRef}
        viewName={viewName}
        {...params}
      />
      <Button type={'primary'} onClick={() => {
        drawerRef.current.setVisible(true);
      }}>{title}</Button>
    </>
  )
}

export default Create;
