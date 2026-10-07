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
