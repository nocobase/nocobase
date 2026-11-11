import { Outlet } from 'react-router';
import type { ReactElement } from 'react';

export default function EquipmentDetail(): ReactElement {
  return (
    <section aria-label='Equipment record detail'>
      <h2>Equipment record detail</h2>
      <Outlet />
    </section>
  );
}
