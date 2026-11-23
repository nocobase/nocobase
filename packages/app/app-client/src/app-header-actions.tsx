import { useContext, type ReactElement } from 'react';
import { appHeaderActionsToken } from './app-header-action-registry.js';
import { ClientApplicationContext } from './application-context.js';

/** Renders registered actions inside the host's authenticated header. */
export function AppHeaderActions(): ReactElement | null {
  const services = useContext(ClientApplicationContext)?.services;
  if (!services?.has(appHeaderActionsToken)) return null;
  const actions = services.resolve(appHeaderActionsToken).list();
  return (
    <>
      {actions.map(({ id, component: Action }) => (
        <Action key={id} />
      ))}
    </>
  );
}
