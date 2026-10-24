import { describe, expect, it } from 'vitest';
import {
  overlapCases,
  withOverlapFixture,
} from '../helpers/overlapping-routes.js';

describe('overlapping API handler reachability', () => {
  it.each(overlapCases)(
    '$name matches native Hono and retains only proven matrix links',
    async (scenario) => {
      await withOverlapFixture(
        scenario,
        ({ sources, modules, calls, response }) => {
          expect(response.status).toBe(200);
          expect(calls).toEqual(scenario.calls);
          const names = {
            db: '@nocobase/db',
            mail: '@nocobase/app-plugin-mail',
          };
          expect(sources.routes[0]?.apiProviders ?? []).toEqual(
            scenario.providers.map((key) => names[key]).sort(),
          );
          expect(sources.complete).toBe(scenario.complete);
          expect(
            modules[0]?.links.map((link) => link.capability).sort(),
          ).toEqual(
            [
              'interface',
              'usersAndOrganizations',
              'permissions',
              'files',
              ...scenario.providers.map((key) =>
                key === 'db' ? 'dataModeling' : key,
              ),
            ].sort(),
          );
          expect(modules[0]?.complete).toBe(scenario.complete);
        },
      );
    },
  );
});
