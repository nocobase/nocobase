import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

/** Keeps stored route identifiers and old detail links working by forwarding them to the editor. */
export default function UserDetail(): ReactElement {
  const location = useLocation();
  return (
    <Navigate to={{ pathname: 'edit', search: location.search }} replace />
  );
}
