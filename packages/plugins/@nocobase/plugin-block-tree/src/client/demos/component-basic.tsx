import React from 'react';
import { Tree } from '@nocobase/plugin-block-tree/client';
import { getMockData } from './fixtures/getMockData';

const App: React.FC = () => {
  return (
    <Tree treeData={getMockData()} />
  );
};

export default App;
