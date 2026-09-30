import type { LocalesContribution, LocalesModule } from './types.js';

/**
 * Resolves a `locales` contribution to its module, importing it first when it was given as a function.
 */
export async function resolveLocalesContribution(
  contribution: LocalesContribution,
): Promise<LocalesModule> {
  return typeof contribution === 'function' ? contribution() : contribution;
}
