import { Outlet } from 'react-router';
import { ExternalAppsList } from './external-apps.js';

/** Preserve the existing /external-apps/new URL while giving its dialog a list background on direct links too. */
export default function ExternalAppsLayout() {
  return (
    <>
      <ExternalAppsList />
      <Outlet />
    </>
  );
}
