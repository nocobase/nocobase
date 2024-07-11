import { MobilePageHeader, MobilePageProvider } from '@nocobase/plugin-mobile/client';
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
