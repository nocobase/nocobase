/**
 * What each level (`LEVELS`, `shared/access.ts`) reaches for a caller: every record, none, or the records related to a
 * set of users. Roles hold the level actions the plugins register (`edit.related`); the plugins are only ever told the
 * resolved `Scope`, and filter by "the record relates to a user of the set" without knowing which level gave it.
 */
import type { Level, Scope } from '../../shared/access.js';

/** The users a level reaches for `userId`; it may read the database, once per level and request. */
export type LevelResolver = (userId: string) => Scope | Promise<Scope>;

/** Every level's resolver: adding a level to `LEVELS` fails to compile until it has one. */
export type LevelResolvers = Readonly<Record<Level, LevelResolver>>;

/** `none` reaches nothing, `related` the caller alone, `all` every record. */
export const BUILT_IN_LEVELS = {
  none: () => 'none',
  related: (userId) => ({ users: [userId] }),
  all: () => 'all',
} as const satisfies Readonly<
  Record<'none' | 'related' | 'all', LevelResolver>
>;

/** Each action's level resolved for `userId`, each distinct level once. */
export async function resolveScopes(
  resolvers: LevelResolvers,
  abilities: Readonly<Record<string, Level>>,
  userId: string,
): Promise<Record<string, Scope>> {
  const resolved = new Map<Level, Scope>();
  for (const level of new Set(Object.values(abilities)))
    resolved.set(level, await resolvers[level](userId));
  return Object.fromEntries(
    Object.entries(abilities).map(([key, level]) => [
      key,
      resolved.get(level) ?? 'none',
    ]),
  );
}
