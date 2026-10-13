import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

/** Retain bookmarked composer links while removing the homepage. */
export default function HomeRedirect(): ReactElement {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/chat', search, hash }} replace />;
}
