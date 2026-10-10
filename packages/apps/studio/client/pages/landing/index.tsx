import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

/** Preserve URL-addressed account settings and inbox filters when entering at the application root. */
export default function LandingPage(): ReactElement {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/inbox', search, hash }} replace />;
}
