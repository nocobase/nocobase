import type {
  Principal,
  RecordAccessDefinition,
  RecordAccessReference,
} from '@nocobase/authorization/core';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { condition, type DatabaseScope } from './scope.js';

/** Which column carries the principal. The default suits most collections. */
export interface RecordOwnerParams {
  field?: string;
}

export interface CustomFilterParams {
  filter: DatabaseScope;
}

export class UserContextRequiredError extends Error {
  constructor() {
    super('This record access requires a user principal.');
  }
}

function userId(principal: Principal): string {
  if (principal.type !== 'user') throw new UserContextRequiredError();
  return principal.id;
}

const title = (key: string) => ({ key, ns: AUTHORIZATION_NAMESPACE });

/** DB-specific applicability metadata, interpreted only by the DB adapter. */
export interface DatabaseRecordAccessDefinition<
  P = unknown,
> extends RecordAccessDefinition<P> {
  requiredFields?: readonly string[];
}

/** The built-in record access, registered by `databasePlugin`. */
export const builtInRecordAccess: readonly DatabaseRecordAccessDefinition[] = [
  {
    key: 'allRecords',
    collections: ['*'],
    title: title('options.recordAccessPolicies.allRecords'),
    resolve: () => true,
  },
  {
    key: 'recordsIOwn',
    collections: ['*'],
    personal: true,
    requiredFields: ['ownerId'],
    title: title('options.recordAccessPolicies.recordsIOwn'),
    resolve: ({ principal, params }) =>
      condition(
        (params as RecordOwnerParams | undefined)?.field ?? 'ownerId',
        '$eq',
        userId(principal),
      ),
  },
  {
    key: 'recordsICreated',
    collections: ['*'],
    personal: true,
    requiredFields: ['createdById'],
    title: title('options.recordAccessPolicies.recordsICreated'),
    resolve: ({ principal, params }) =>
      condition(
        (params as RecordOwnerParams | undefined)?.field ?? 'createdById',
        '$eq',
        userId(principal),
      ),
  },
  {
    key: 'customFilter',
    collections: ['*'],
    title: title('options.recordAccessPolicies.customFilter'),
    description: title('options.recordAccessPolicies.customFilterHint'),
    paramsSchema: { type: 'filter-node' },
    resolve: ({ params }) => {
      if (!params || typeof params !== 'object' || !('filter' in params))
        throw new Error('Custom Filter requires filter params');
      return (params as CustomFilterParams).filter;
    },
  },
];

export interface BuiltInRecordAccess {
  readonly allRecords: RecordAccessReference<'allRecords'>;
  readonly recordsIOwn: RecordAccessReference<'recordsIOwn'>;
  readonly recordsICreated: RecordAccessReference<'recordsICreated'>;
  readonly customFilter: RecordAccessReference<'customFilter'>;
}

/** References to the built-in record access, for type-safe options and grants. */
export const recordAccess: BuiltInRecordAccess = {
  allRecords: { key: 'allRecords', collections: ['*'] },
  recordsIOwn: { key: 'recordsIOwn', collections: ['*'] },
  recordsICreated: { key: 'recordsICreated', collections: ['*'] },
  customFilter: { key: 'customFilter', collections: ['*'] },
};

export function databaseRecordAccessApplicable(
  definition: RecordAccessDefinition,
  fields: readonly string[],
): boolean {
  const required: unknown = Reflect.get(definition, 'requiredFields');
  return (
    required === undefined ||
    (Array.isArray(required) &&
      required.every(
        (field: unknown) => typeof field === 'string' && fields.includes(field),
      ))
  );
}
