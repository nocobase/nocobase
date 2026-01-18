/**
 * iframe: true
 */
import { MobilePageHeader, MobilePageProvider } from '@nocobase/client';
import React from 'react';

const App = () => {
  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <div>content</div>
      </MobilePageHeader>
    </MobilePageProvider>
  );
};

export default App;
