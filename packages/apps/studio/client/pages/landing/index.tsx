import { useAuthorizationClient } from '@nocobase/app-plugin-authorization/client';
import { useEffect, useState, type ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

/**
 * The application root opens My tasks, or the inbox for someone My tasks' page grant does not reach. URL-addressed
 * account settings and filters are kept.
 */
export default function LandingPage(): ReactElement | null {
  const { search, hash } = useLocation();
  const client = useAuthorizationClient();
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void client
      .can({ resource: { type: 'page', id: 'pm-my-issues' }, action: 'access' })
      .catch(() => false)
      .then((allowed) => {
        if (active) setTarget(allowed ? '/my-issues' : '/inbox');
      });
    return () => {
      active = false;
    };
  }, [client]);
  if (!target) return null;
  return <Navigate to={{ pathname: target, search, hash }} replace />;
}
