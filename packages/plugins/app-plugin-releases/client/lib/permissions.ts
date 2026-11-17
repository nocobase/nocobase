import type { AppAction } from '../../shared/access.js';
import type { AppSummary } from '../../shared/releases.js';
import type { Me } from '../hooks/use-releases.js';

/** Whether the caller may act on this App: what the server answered for it, else whether their scope may allow it. */
export function canOnApp(
  me: Me,
  action: AppAction,
  app: AppSummary | undefined,
): boolean {
  if (!app) return false;
  // A single App's read says what the server would allow, related Apps included.
  if (app.allowed) return app.allowed.includes(action);
  const scope = me.permissions.scopes[`rel.apps/${action}`];
  if (scope === 'all' || scope === 'none') return scope === 'all';
  // The application may relate more Apps than the ones created; the server decides those.
  return scope.users.length > 0;
}

/**
 * Who may open the environments and an environment's page: those who may read environments (the setting), and App
 * readers, who list and create an environment's Apps there. Each part of the pages keeps its own check.
 */
export function canEnterEnvironments(me: Me): boolean {
  return (
    me.permissions.settings['rel.environments/read'] ||
    me.permissions.pages['rel-apps']
  );
}
