import { useRequest } from 'ahooks';
import { Button, Drawer } from 'antd';
import React, { createContext, useEffect, useMemo, useState } from 'react';

const AsyncRecordContext = createContext<any>({});

const AsyncRecordProvider: React.FC<any> = (props) => {
  const { children } = props;
  const result = useRequest(() => {
    console.log('aaa');
    return Promise.resolve({});
  });
  return <AsyncRecordContext.Provider value={{ ...result }}>{children}</AsyncRecordContext.Provider>;
};

export default function Hello() {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Button onClick={() => setVisible(true)}>Open</Button>
      <Drawer destroyOnClose visible={visible} onClose={() => setVisible(false)}>
        <AsyncRecordProvider>aaa</AsyncRecordProvider>
      </Drawer>
    </div>
  );
}
