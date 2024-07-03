import React from 'react';
import { MobileTabBar } from '@nocobase/plugin-mobile/client';

const Demo = () => {
  const [clicked, setClicked] = React.useState(false);
  return (
    <>
      {clicked && 'Clicked'}
      <MobileTabBar.Item title="Test" icon="AppstoreOutlined" onClick={() => setClicked(true)}></MobileTabBar.Item>
    </>
  );
};

export default Demo;
