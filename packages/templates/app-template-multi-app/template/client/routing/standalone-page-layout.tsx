import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

export function StandalonePageLayout(): ReactElement {
  return (
    <div className='relative min-h-svh'>
      <Outlet />
    </div>
  );
}
