import type { AppAuthorization } from './authorization.js';
import { databaseHost } from './database/api.js';
import { databaseGrantViolations } from './database/grant-validation.js';

/**
 * Every stored grant that no longer applies, one message naming its Permission Set, resource, action and problem: a
 * composite grant that no longer expands against the current composite definitions, and a `database.collection`
 * create or update grant, given directly or through a composite action, that names a field or relation a write can no
 * longer use. The Permission Set routes refuse both when a set is saved, so these come from a seed, a direct write, or
 * a Collection or definition that changed afterwards.
 */
export async function storedGrantProblems(
  authz: AppAuthorization,
): Promise<string[]> {
  const sets = await authz.permissionSets.list();
  const checker = databaseHost(authz.database);
  const problems: string[] = [];
  for (const set of sets) {
    for (const grant of set.grants) {
      const label = `${grant.resource.type}:${grant.resource.id}`;
      for (const action of grant.actions) {
        const reason = authz.compositeResources.validateGrant({
          resource: grant.resource,
          action: action.action,
          ...(action.policy === undefined ? {} : { policy: action.policy }),
        });
        if (reason !== undefined) {
          problems.push(
            `Permission set ${set.key} grants ${label}.${action.action}, which no longer applies: ${reason}`,
          );
          continue;
        }
        if (!checker || grant.resource.type !== 'composite') continue;
        // What a composite action grants comes from its definition, so its write fields are checked as they are now.
        const definition = authz.compositeResources.getAction(
          grant.resource.id,
          action.action,
        );
        for (const violation of await databaseGrantViolations(
          checker,
          definition?.grants ?? [],
        ))
          problems.push(
            `Permission set ${set.key} grants ${label}.${action.action}, whose database grants name what a write cannot use: ${violation.description}`,
          );
      }
    }
    if (!checker) continue;
    for (const violation of await databaseGrantViolations(checker, set.grants))
      problems.push(
        `Permission set ${set.key} has a write grant that no longer applies at ${violation.field}: ${violation.description}`,
      );
  }
  return problems;
}

export interface StoredGrantReportOptions {
  /** Warn instead of throwing. */
  production: boolean;
  warn(message: string): void;
}

/** Throws in development and warns in production, as the workspace check does. */
export function reportStoredGrants(
  problems: readonly string[],
  options: StoredGrantReportOptions,
): void {
  if (!problems.length) return;
  if (!options.production)
    throw new Error(
      `Authorization has invalid stored grants:\n- ${problems.join('\n- ')}`,
    );
  for (const problem of problems) options.warn(`Authorization: ${problem}`);
}
