import React from 'react';
import { Tree } from '@nocobase/plugin-block-tree/client';
import { getMockData } from './fixtures/getMockData';

const defaultTreeData = getMockData();

const App: React.FC = () => {
  const [data, setData] = React.useState(defaultTreeData);
  const [loading, setLoading] = React.useState(false);

  function onSearch(value: string) {
    setLoading(true);

    setTimeout(() => {
      setData(defaultTreeData.filter((item) => String(item.title).includes(value)));
      setLoading(false);
    }, 1000);
  }

  return (
    <Tree loading={loading} treeData={data} onSearch={onSearch} />
  );
};

export default App;
