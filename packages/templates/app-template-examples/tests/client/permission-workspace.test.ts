import { describe, expect, it } from 'vitest';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import appRuntime from '../../client/runtime.js';
import { permissionWorkspaceSelection } from '../../client/pages/settings/permission-workspace.js';

const flatten = (
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] =>
  routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);

// The role editor shows the objects a page uses from this selection; a stale entry silently shows nothing.
describe('the application’s permission selection', () => {
  it('maps only pages this application registers, by route name', async () => {
    const { routes } = await resolveAppRuntime(appRuntime);
    const pages = new Set(
      flatten(routes)
        .filter((route) => route.source === 'application')
        .map((route) => route.name),
    );
    const mapped = Object.keys(permissionWorkspaceSelection.pages ?? {});
    expect(mapped.filter((page) => !pages.has(page))).toEqual([]);
  });

  it('lists each object once and maps pages only to objects it lists', () => {
    const ids = permissionWorkspaceSelection.business.map(
      (object) => `${object.type}:${object.id}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    const listed = new Set(
      permissionWorkspaceSelection.business.map((object) => object.id),
    );
    const referenced = Object.values(
      permissionWorkspaceSelection.pages ?? {},
    ).flatMap((uses) => [...(uses.primary ?? []), ...(uses.related ?? [])]);
    expect(referenced.filter((id) => !listed.has(id))).toEqual([]);
  });
});
