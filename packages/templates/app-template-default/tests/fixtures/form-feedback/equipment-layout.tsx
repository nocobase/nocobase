import { Outlet, useLocation } from 'react-router';
import type { ReactElement } from 'react';
import EquipmentFixture from './equipment.js';

export default function EquipmentLayout(): ReactElement {
  const { pathname } = useLocation();
  return (
    <div className='relative h-full'>
      <section aria-label='Equipment requests'>
        Equipment borrowing requests
      </section>
      {pathname === '/equipment' ? <EquipmentFixture /> : <Outlet />}
    </div>
  );
}
