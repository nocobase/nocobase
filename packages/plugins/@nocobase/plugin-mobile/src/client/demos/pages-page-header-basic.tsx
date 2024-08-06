/**
 * iframe: true
 */
import { MobilePageHeader, MobilePageProvider } from '@nocobase/plugin-mobile/client';
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
