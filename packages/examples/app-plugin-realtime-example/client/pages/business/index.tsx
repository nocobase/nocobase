import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation, useResolvedPath } from 'react-router';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
export default function BusinessPage(): ReactElement {
  const location = useLocation();
  const root = useResolvedPath('.');
  const { session } = useAuthentication();
  if (
    location.pathname.replace(/\/$/u, '') === root.pathname.replace(/\/$/u, '')
  )
    return (
      <Navigate to={{ pathname: 'tasks', search: location.search }} replace />
    );
  return <Outlet key={`${session?.user.id}:${session?.session.id}`} />;
}
