import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { ThemeSettings } from '../theme/index.js';

export function StandalonePageLayout(): ReactElement {
  return (
    <div className='relative min-h-svh'>
      <div className='fixed top-3 right-3 z-50'>
        <ThemeSettings />
      </div>
      <Outlet />
    </div>
  );
}
