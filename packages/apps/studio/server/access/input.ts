/**
 * What a role write may hold: each business action of the catalog at a level it offers, each settings capability on or
 * off. Anything else is 400 `ABILITY_NOT_OFFERED`; a malformed body is 400 `INVALID_ABILITIES`.
 */
import type { Level } from '../../shared/access.js';
import type { Catalog } from './catalog.js';
import { invalid } from './errors.js';
import { noAbilities, noSettings } from './grants.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function malformed(): never {
  throw invalid(
    'INVALID_ABILITIES',
    'abilities must map business actions to a level, settings must map capabilities to true or false.',
  );
}

export function checkAbilities(
  input: unknown,
  catalog: Catalog,
): Record<string, Level> {
  if (input === undefined) return noAbilities(catalog);
  if (!isRecord(input)) malformed();
  const result = noAbilities(catalog);
  for (const [key, level] of Object.entries(input)) {
    if (!catalog.action(key))
      throw invalid('ABILITY_NOT_OFFERED', `${key} is not a business action.`);
    const levels = catalog.levelsOf(key);
    if (typeof level !== 'string' || !levels.includes(level as Level))
      throw invalid(
        'ABILITY_NOT_OFFERED',
        `${key} offers ${levels.join(', ')}, not ${String(level)}.`,
      );
    result[key] = level as Level;
  }
  return result;
}

export function checkSettings(
  input: unknown,
  catalog: Catalog,
): Record<string, boolean> {
  if (input === undefined) return noSettings(catalog);
  if (!isRecord(input)) malformed();
  const result = noSettings(catalog);
  const offered = new Set(catalog.settingsKeys);
  for (const [key, on] of Object.entries(input)) {
    if (!offered.has(key))
      throw invalid(
        'ABILITY_NOT_OFFERED',
        `${key} is not a settings capability.`,
      );
    if (typeof on !== 'boolean') malformed();
    result[key] = on;
  }
  return result;
}
