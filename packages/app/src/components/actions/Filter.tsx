import React, { useRef, useState } from 'react';
import { Button, Popover } from 'antd';
import ViewFactory from '@/components/views';

export function Filter(props) {
  console.log(props);
  const drawerRef = useRef<any>();
  const [visible, setVisible] = useState(false);
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

  return (
    <>
      <Popover
        title="设置筛选"
        trigger="click"
        visible={visible}
        placement={'bottomLeft'}
        onVisibleChange={(visible) => {
          setVisible(visible);
        }}
        className={'filters-popover'}
        style={{
        }}
        overlayStyle={{
          minWidth: 500
        }}
        content={(
          <>
            <div className={'popover-button-mask'} onClick={() => setVisible(false)}></div>
            <ViewFactory 
              {...props}
              setVisible={setVisible}
              viewName={'filter'}
              {...params}
            />
          </>
        )}
      >
        <Button type={'primary'} onClick={() => {
          setVisible(true);
        }}>{title}</Button>
      </Popover>
    </>
  )
}

export default Filter;
