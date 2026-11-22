import type { ReactElement } from 'react';
import { useLocation } from 'react-router';

/** Where a page navigated to outside its own route, the path shown for assertions. */
export function Elsewhere(): ReactElement {
  const { pathname } = useLocation();
  return (
    <>
      <p>elsewhere</p>
      <p data-testid='location'>{pathname}</p>
    </>
  );
}
