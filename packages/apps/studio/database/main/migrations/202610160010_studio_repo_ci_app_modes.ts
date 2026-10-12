import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Each application of a repository is connected in a mode of its own (`server/builds/ci-modes.ts`): every stored choice
// of `studioRepoCi.setups` (`{ [kind]: { mode, apps: [{ directory, appId }] } }`) gives each of its applications the
// choice's `mode` as `apps[*].mode`. The choice keeps its `mode`, which is the first application's from now on. Down
// drops the applications' modes, the choice keeping the first application's.
type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parse(value: unknown): Json | null {
  if (typeof value !== 'string') return isRecord(value) ? value : null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Every stored choice of a row rewritten by `change`; null when nothing changed. */
function rewrite(
  value: unknown,
  change: (setup: Json) => Json | null,
): string | null {
  const setups = parse(value);
  if (!setups) return null;
  let changed = false;
  const next: Json = {};
  for (const [kind, setup] of Object.entries(setups)) {
    const updated = isRecord(setup) ? change(setup) : null;
    next[kind] = updated ?? setup;
    if (updated) changed = true;
  }
  return changed ? JSON.stringify(next) : null;
}

async function each(
  query: Parameters<MigrationDefinition['up']>[0]['query'],
  change: (setup: Json) => Json | null,
): Promise<void> {
  const rows = await query
    .selectFrom('studioRepoCi')
    .select(['resourceId', 'setups'])
    .where('setups', 'is not', null)
    .execute();
  for (const row of rows) {
    const setups = rewrite(row.setups, change);
    if (setups)
      await query
        .updateTable('studioRepoCi')
        .set({ setups })
        .where('resourceId', '=', String(row.resourceId))
        .execute();
  }
}

const migration: MigrationDefinition = defineMigration({
  name: '202610160010_studio_repo_ci_app_modes',

  async up({ query }) {
    await each(query, (setup) => {
      if (typeof setup.mode !== 'string' || !Array.isArray(setup.apps))
        return null;
      return {
        ...setup,
        apps: setup.apps.map((app: unknown) =>
          isRecord(app) && typeof app.mode !== 'string'
            ? { ...app, mode: setup.mode }
            : app,
        ),
      };
    });
  },

  async down({ query }) {
    await each(query, (setup) => {
      if (!Array.isArray(setup.apps)) return null;
      const first: unknown = setup.apps[0];
      return {
        ...setup,
        ...(isRecord(first) && typeof first.mode === 'string'
          ? { mode: first.mode }
          : {}),
        apps: setup.apps.map((app: unknown) => {
          if (!isRecord(app)) return app;
          const { mode: _mode, ...rest } = app;
          return rest;
        }),
      };
    });
  },
});

export default migration;
