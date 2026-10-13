import type { ReactElement } from 'react';

import { UserMenu } from './user-menu.js';

/** Keep the account menu in the header on every page. */
export function HeaderActions(): ReactElement {
  return (
    <div className='flex shrink-0 items-center'>
      <UserMenu />
    </div>
  );
}
