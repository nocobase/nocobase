import React, { useRef, useState } from 'react';
import { Button, Popover } from 'antd';
import ViewFactory from '@/components/views';
import { FilterOutlined } from '@ant-design/icons';

export function Filter(props) {
  console.log(props);
  const drawerRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const { title, viewName, collection_name } = props.schema;
  const { filterCount, activeTab = {}, item = {}, associatedName, associatedKey } = props;
  const { associationField } = activeTab;

  const params = {};

  if (associationField && associationField.target) {
    params['resourceName'] = associationField.target;
    params['resourceTarget'] = associationField.target;
    params['associatedName'] = associatedName;
    params['associatedKey'] = associatedKey;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId;
  }

  return (
    <>
      <Popover
        // title="设置筛选"
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
        <Button icon={<FilterOutlined />} onClick={() => {
          setVisible(true);
        }}>{filterCount ? `${filterCount} 个${title}项` : title}</Button>
      </Popover>
    </>
  )
}

export default Filter;
