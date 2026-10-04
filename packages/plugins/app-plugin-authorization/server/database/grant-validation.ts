import type { PermissionGrant } from '@nocobase/authorization/core';
import type {
  FieldWritePolicy,
  RelationWritePolicy,
  ThroughWritePolicy,
  WritePolicy,
  WritePolicyProblem,
} from '@nocobase/db';

/** One invalid member of a Permission Set body, named by its dotted path in that body. */
export interface GrantFieldViolation {
  readonly field: string;
  readonly description: string;
}

/** What a grant check needs from the database plugin: db's verdict on a write policy for one Collection. */
export interface WriteGrantChecker {
  writePolicyProblems(
    name: string,
    policy: WritePolicy,
  ): Promise<readonly WritePolicyProblem[] | undefined>;
}

const writeActions: ReadonlySet<string> = new Set(['create', 'update']);

/**
 * Every field and relation a `database.collection` `create` or `update` grant names that a write could never use: a
 * field that does not exist or that db assigns itself, a relation that does not exist, `through` on a relation that has
 * none. Such a grant would be accepted and then fail every write it allows with an opaque `500`, because db refuses a
 * Policy that names one, so it is reported here, against the request body path of the offending member.
 *
 * `'*'` is never a problem: it resolves to the fields a write may name. A grant on a wildcard resource, on a
 * Collection db does not know, or with no database at all has nothing to check against and is left alone; read and
 * delete grants carry no write fields.
 */
export async function databaseGrantViolations(
  checker: WriteGrantChecker,
  grants: readonly PermissionGrant[],
  prefix: string = 'grants',
): Promise<GrantFieldViolation[]> {
  const violations: GrantFieldViolation[] = [];
  for (const [grantIndex, grant] of grants.entries()) {
    if (
      grant.resource.type !== 'database.collection' ||
      grant.resource.id === '*'
    )
      continue;
    for (const [actionIndex, entry] of grant.actions.entries()) {
      const policy: unknown = entry.policy;
      if (!writeActions.has(entry.action) || !isRecord(policy)) continue;
      if (policy.type !== 'database') continue;
      const base = `${prefix}.${grantIndex}.actions.${actionIndex}.policy`;
      const shape = writeShape(policy, base, violations);
      const problems = await checker.writePolicyProblems(
        grant.resource.id,
        shape,
      );
      for (const problem of problems ?? [])
        violations.push({
          field: [base, ...problem.path].join('.'),
          description: problem.message,
        });
    }
  }
  return violations;
}

/** The write policy a permission node describes, with `'*'` left out because it never names a field db refuses. */
function writeShape(
  node: Readonly<Record<string, unknown>>,
  path: string,
  violations: GrantFieldViolation[],
): WritePolicy {
  const relations = node.relations;
  const fields = fieldShape(node, path, violations);
  if (relations === undefined || relations === false) return fields;
  if (!isRecord(relations)) {
    violations.push({
      field: `${path}.relations`,
      description: 'Expected false or relation permissions by name.',
    });
    return fields;
  }
  return {
    ...fields,
    relations: Object.fromEntries(
      Object.entries(relations).map(([name, rule]) => [
        name,
        relationShape(rule, `${path}.relations.${name}`, violations),
      ]),
    ),
  };
}

function fieldShape(
  node: Readonly<Record<string, unknown>>,
  path: string,
  violations: GrantFieldViolation[],
): FieldWritePolicy {
  const fields = node.fields;
  if (fields === undefined || fields === '*') return {};
  if (
    Array.isArray(fields) &&
    fields.every((field: unknown) => typeof field === 'string')
  )
    return { fields };
  violations.push({
    field: `${path}.fields`,
    description: "Expected '*' or a list of field names.",
  });
  return {};
}

function relationShape(
  rule: unknown,
  path: string,
  violations: GrantFieldViolation[],
): RelationWritePolicy {
  if (!isRecord(rule)) {
    violations.push({
      field: path,
      description: 'Expected a relation permission.',
    });
    return {};
  }
  const nested = (key: string): WritePolicy | undefined => {
    const value = rule[key];
    return isRecord(value)
      ? writeShape(value, `${path}.${key}`, violations)
      : undefined;
  };
  const create = nested('create');
  const update = nested('update');
  const upsert = rule.upsert;
  return {
    ...(create
      ? {
          create: {
            ...create,
            ...throughShape(rule.create, `${path}.create`, violations),
          },
        }
      : {}),
    ...(update ? { update } : {}),
    ...(isRecord(upsert) && isRecord(upsert.create) && isRecord(upsert.update)
      ? {
          upsert: {
            create: writeShape(
              upsert.create,
              `${path}.upsert.create`,
              violations,
            ),
            update: writeShape(
              upsert.update,
              `${path}.upsert.update`,
              violations,
            ),
          },
        }
      : {}),
    ...(isRecord(rule.connect)
      ? { connect: throughShape(rule.connect, `${path}.connect`, violations) }
      : {}),
    ...(isRecord(rule.set)
      ? { set: throughShape(rule.set, `${path}.set`, violations) }
      : {}),
  };
}

function throughShape(
  node: unknown,
  path: string,
  violations: GrantFieldViolation[],
): ThroughWritePolicy {
  if (!isRecord(node)) return {};
  const through = node.through;
  if (through === undefined) return {};
  if (through === false) return { through: false };
  if (!isRecord(through)) {
    violations.push({
      field: `${path}.through`,
      description: 'Expected false or a through permission.',
    });
    return {};
  }
  return { through: fieldShape(through, `${path}.through`, violations) };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
