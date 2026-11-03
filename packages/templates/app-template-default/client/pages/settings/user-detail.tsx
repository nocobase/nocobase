import type { ReactElement } from 'react';
import {
  Navigate,
  useLocation,
  useOutlet,
  useOutletContext,
  useResolvedPath,
} from 'react-router';
import type { ManagedUser } from '@nocobase/app-plugin-users/client/user-client';

/** Keep stored route identifiers and old detail links while using one editor. */
export default function UserDetail(): ReactElement {
  const parent = useOutletContext<{
    reload: (updated?: ManagedUser) => void;
  }>();
  const location = useLocation();
  const listPath = useResolvedPath('..').pathname;
  const outlet = useOutlet({ ...parent, listPath });
  return (
    outlet ?? (
      <Navigate to={{ pathname: 'edit', search: location.search }} replace />
    )
  );
}
