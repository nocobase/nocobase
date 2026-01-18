import { MobilePageHeader, MobilePageProvider } from '@nocobase/client';
import React from 'react';

const App = () => {
  return (
    <MobilePageProvider displayPageHeader={false}>
      <MobilePageHeader>
        <div>content</div>
      </MobilePageHeader>
    </MobilePageProvider>
  );
};

export default App;
