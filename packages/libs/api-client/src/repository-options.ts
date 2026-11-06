import {
  buildAggregate,
  buildFilter,
  buildSelect,
  buildSort,
  buildCreateValues,
  buildUpdateValues,
} from '@nocobase/repository-input';
import type {
  FilterAst,
  FilterShorthand,
  SelectAst,
  SortAst,
  AggregateAst,
  CreateMutationValues,
  UpdateMutationValues,
  MutationValuesInput,
  BuiltMutationValues,
  RepositoryRecord,
  JsonValueOf,
} from '@nocobase/repository-input';
import {
  snapshotJson,
  isRecord,
  inputError,
} from '@nocobase/repository-input/internal/json';
import type {
  RemoteAggregateOptions,
  RemoteGroupByOptions,
  RemoteFindManyOptions,
  RemoteFindOneOptions,
  RemoteFilterOnlyOptions,
  RemoteCreateOneOptions,
  RemoteUpdateOneOptions,
  RemoteDeleteOneOptions,
} from './repository.js';

export type RemoteFilterJson<T extends object> = FilterAst | FilterShorthand<T>;
export type RemoteFindManyOptionsJson<T extends object> = Omit<
  RemoteFindManyOptions<T>,
  'filter' | 'select' | 'sort' | 'cursor'
> & {
  readonly cursor?: JsonValueOf<Readonly<Partial<T>>>;
  readonly filter?: RemoteFilterJson<T>;
  readonly select?: SelectAst;
  readonly sort?: SortAst;
};
export type RemoteFindOneOptionsJson<T extends object> = Omit<
  RemoteFindOneOptions<T>,
  'filter' | 'select' | 'sort'
> & {
  readonly filter: RemoteFilterJson<T>;
  readonly select?: SelectAst;
  readonly sort?: SortAst;
};
export interface RemoteFilterOnlyOptionsJson<T extends object> {
  readonly filter?: RemoteFilterJson<T>;
}
export type RemoteAggregateOptionsJson<T extends object> =
  RemoteFilterOnlyOptionsJson<T> & { readonly aggregate: AggregateAst };
export type RemoteGroupByOptionsJson<T extends object> = Omit<
  RemoteGroupByOptions<T>,
  'filter' | 'aggregate' | 'having' | 'sort'
> &
  RemoteAggregateOptionsJson<T> & {
    readonly having?: RemoteFilterJson<RepositoryRecord>;
    readonly sort?: SortAst;
  };
export type RemoteCreateOneOptionsJson<
  TCreate extends object,
  TRecord extends object = RepositoryRecord,
> = Omit<
  RemoteCreateOneOptions<TCreate, TRecord>,
  'values' | 'select' | 'idempotencyKey' | 'signal'
> & {
  readonly values: BuiltMutationValues<CreateMutationValues<TCreate>>;
  readonly select?: SelectAst;
};
export type RemoteUpdateOneOptionsJson<
  TRecord extends object,
  TUpdate extends object = Partial<TRecord>,
> = Omit<
  RemoteUpdateOneOptions<TRecord, TUpdate>,
  'values' | 'filter' | 'select' | 'idempotencyKey' | 'signal'
> & {
  readonly values: BuiltMutationValues<UpdateMutationValues<TUpdate>>;
  readonly filter: RemoteFilterJson<TRecord>;
  readonly select?: SelectAst;
};
export type RemoteDeleteOneOptionsJson<TRecord extends object> = Omit<
  RemoteDeleteOneOptions<TRecord>,
  'filter' | 'select' | 'idempotencyKey' | 'signal'
> & { readonly filter: RemoteFilterJson<TRecord>; readonly select?: SelectAst };

/** Construct a wire snapshot; do not execute HTTP or supply server defaults. */
function buildOptions(input: object, fields: readonly string[]): unknown {
  if (!isRecord(input)) inputError([], 'Expected a Repository options object.');
  const output = { ...input } as Record<string, unknown>;
  delete output.idempotencyKey;
  delete output.signal;
  for (const field of fields) {
    const value = output[field];
    if (value === undefined) continue;
    switch (field) {
      case 'filter':
      case 'having':
        if (typeof value === 'function')
          output[field] = buildFilter(
            value as Parameters<typeof buildFilter>[0],
          );
        break;
      case 'select':
        output[field] = buildSelect(value as Parameters<typeof buildSelect>[0]);
        break;
      case 'sort':
        output[field] = buildSort(value as Parameters<typeof buildSort>[0]);
        break;
      case 'aggregate':
        output[field] = buildAggregate(
          value as Parameters<typeof buildAggregate>[0],
        );
        break;
    }
  }
  return snapshotJson(output);
}

export function buildFindManyOptions<T extends object = RepositoryRecord>(
  input: RemoteFindManyOptions<NoInfer<T>> = {},
): RemoteFindManyOptionsJson<T> {
  return buildOptions(input, [
    'filter',
    'select',
    'sort',
  ]) as RemoteFindManyOptionsJson<T>;
}
export function buildFindOneOptions<T extends object = RepositoryRecord>(
  input: RemoteFindOneOptions<NoInfer<T>>,
): RemoteFindOneOptionsJson<T> {
  return buildOptions(input, [
    'filter',
    'select',
    'sort',
  ]) as RemoteFindOneOptionsJson<T>;
}
export function buildCountOptions<T extends object = RepositoryRecord>(
  input: RemoteFilterOnlyOptions<NoInfer<T>> = {},
): RemoteFilterOnlyOptionsJson<T> {
  return buildOptions(input, ['filter']) as RemoteFilterOnlyOptionsJson<T>;
}
export function buildExistsOptions<T extends object = RepositoryRecord>(
  input: RemoteFilterOnlyOptions<NoInfer<T>> = {},
): RemoteFilterOnlyOptionsJson<T> {
  return buildOptions(input, ['filter']) as RemoteFilterOnlyOptionsJson<T>;
}
export function buildAggregateOptions<T extends object = RepositoryRecord>(
  input: RemoteAggregateOptions<NoInfer<T>>,
): RemoteAggregateOptionsJson<T> {
  return buildOptions(input, [
    'filter',
    'aggregate',
  ]) as RemoteAggregateOptionsJson<T>;
}
export function buildGroupByOptions<T extends object = RepositoryRecord>(
  input: RemoteGroupByOptions<NoInfer<T>>,
): RemoteGroupByOptionsJson<T> {
  return buildOptions(input, [
    'filter',
    'aggregate',
    'having',
    'sort',
  ]) as RemoteGroupByOptionsJson<T>;
}
export function buildCreateOneOptions<
  TCreate extends object = RepositoryRecord,
  TRecord extends object = TCreate,
>(
  input: RemoteCreateOneOptions<NoInfer<TCreate>, NoInfer<TRecord>>,
): RemoteCreateOneOptionsJson<TCreate, TRecord> {
  return buildOptions(
    {
      ...input,
      values: buildCreateValues(
        input.values as MutationValuesInput<CreateMutationValues<TCreate>>,
      ),
    },
    ['select'],
  ) as RemoteCreateOneOptionsJson<TCreate, TRecord>;
}
export function buildUpdateOneOptions<
  TRecord extends object = RepositoryRecord,
  TUpdate extends object = Partial<TRecord>,
>(
  input: RemoteUpdateOneOptions<NoInfer<TRecord>, NoInfer<TUpdate>>,
): RemoteUpdateOneOptionsJson<TRecord, TUpdate> {
  return buildOptions(
    {
      ...input,
      values: buildUpdateValues(
        input.values as MutationValuesInput<UpdateMutationValues<TUpdate>>,
      ),
    },
    ['filter', 'select'],
  ) as RemoteUpdateOneOptionsJson<TRecord, TUpdate>;
}
export function buildDeleteOneOptions<
  TRecord extends object = RepositoryRecord,
>(
  input: RemoteDeleteOneOptions<NoInfer<TRecord>>,
): RemoteDeleteOneOptionsJson<TRecord> {
  return buildOptions(input, [
    'filter',
    'select',
  ]) as RemoteDeleteOneOptionsJson<TRecord>;
}
