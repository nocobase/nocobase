import type { ReactElement } from 'react';
import { useLocation } from 'react-router';

/** Where the router is, for asserting navigation and query strings. */
export function LocationProbe(): ReactElement {
  const location = useLocation();
  return (
    <output data-testid='location'>{`${location.pathname}${location.search}`}</output>
  );
}
