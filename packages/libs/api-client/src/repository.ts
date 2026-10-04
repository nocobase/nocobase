import type {
  FilterAst,
  SelectAst,
  SortAst,
  AggregateAst,
  RepositoryFilter,
  RepositorySelect,
  RepositorySort,
  AggregateOptions,
  MutationValuesInput,
  CreateMutationValues,
  UpdateMutationValues,
  BuiltMutationValues,
  JsonValueOf,
} from '@nocobase/repository-input';
import {
  buildFindManyOptions,
  buildFindOneOptions,
  buildCountOptions,
  buildExistsOptions,
  buildAggregateOptions,
  buildGroupByOptions,
  buildCreateOneOptions,
  buildUpdateOneOptions,
  buildDeleteOneOptions,
} from './repository-options.js';
import { ApiClientError } from './errors.js';
import type { ApiRequestOptions } from './types.js';

export type RemoteFilterAst = FilterAst;
export type RemoteSelectAst = SelectAst;
export type RemoteSortAst = SortAst;
export type RemoteAggregateAst = AggregateAst;
export type RemoteRepositoryFilter<TRecord extends object> =
  RepositoryFilter<TRecord>;

/** SQL scalar values serialized over JSON; bigint and date values become strings. */
export type RemoteAggregateResult = Readonly<
  Record<string, string | number | boolean | null>
>;

export interface RemoteAggregateOptions<TRecord extends object> {
  readonly filter?: RemoteRepositoryFilter<TRecord>;
  readonly aggregate: AggregateOptions<TRecord>['aggregate'];
}

export interface RemoteGroupByOptions<
  TRecord extends object,
> extends RemoteAggregateOptions<TRecord> {
  readonly by: readonly [keyof TRecord & string, ...(keyof TRecord & string)[]];
  readonly having?: RemoteRepositoryFilter<RemoteAggregateResult>;
  readonly sort?: RepositorySort<RemoteAggregateResult>;
}

export interface RemoteRepositoryReadOptions<TRecord extends object> {
  readonly select?: RepositorySelect<TRecord>;
}

export interface RemoteFindManyOptions<
  TRecord extends object,
> extends RemoteRepositoryReadOptions<TRecord> {
  readonly filter?: RemoteRepositoryFilter<TRecord>;
  readonly sort?: RepositorySort<TRecord>;
  readonly distinct?: readonly [
    keyof TRecord & string,
    ...(keyof TRecord & string)[],
  ];
  readonly limit?: number;
  readonly offset?: number;
  readonly cursor?:
    Readonly<Partial<TRecord>> | JsonValueOf<Readonly<Partial<TRecord>>>;
  readonly direction?: 'forward' | 'backward';
}

export interface RemoteFindOneOptions<
  TRecord extends object,
> extends RemoteRepositoryReadOptions<TRecord> {
  readonly filter: RemoteRepositoryFilter<TRecord>;
  readonly sort?: RepositorySort<TRecord>;
}

export interface RemoteFilterOnlyOptions<TRecord extends object> {
  readonly filter?: RemoteRepositoryFilter<TRecord>;
}

export interface RemoteCreateOneOptions<
  TCreate extends object,
  TRecord extends object,
> extends RemoteRepositoryReadOptions<TRecord> {
  readonly values:
    | MutationValuesInput<CreateMutationValues<TCreate>>
    | BuiltMutationValues<CreateMutationValues<TCreate>>;
  readonly idempotencyKey?: string;
}

export interface RemoteUpdateOneOptions<
  TRecord extends object,
  TUpdate extends object,
> extends RemoteRepositoryReadOptions<TRecord> {
  readonly filter: RemoteRepositoryFilter<TRecord>;
  readonly values:
    | MutationValuesInput<UpdateMutationValues<TUpdate>>
    | BuiltMutationValues<UpdateMutationValues<TUpdate>>;
  readonly ifVersion?: string | number;
  readonly idempotencyKey?: string;
}

export interface RemoteDeleteOneOptions<
  TRecord extends object,
> extends RemoteRepositoryReadOptions<TRecord> {
  readonly filter: RemoteRepositoryFilter<TRecord>;
  readonly ifVersion?: string | number;
  readonly idempotencyKey?: string;
}

export interface RemoteMutationResult<TRecord extends object> {
  readonly record: TRecord;
  readonly createdTargets: readonly RemoteCreatedTargetReference[];
  readonly version?: string | number;
}

export interface RemoteCreatedTargetReference {
  readonly clientKey: string;
  readonly collection: string;
  readonly unique: {
    readonly kind: 'unique';
    readonly fields: readonly string[];
    readonly values: Readonly<Record<string, unknown>>;
  };
}

export interface RemoteDeleteResult<TRecord extends object> {
  readonly deleted: true;
  readonly record?: TRecord;
}

export interface RemoteRepository<
  TRecord extends object = Record<string, unknown>,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> {
  findMany(
    options?: RemoteFindManyOptions<TRecord>,
  ): RemoteRepositoryQuery<TRecord>;
  findOne(options: RemoteFindOneOptions<TRecord>): Promise<TRecord | undefined>;
  aggregate(
    options: RemoteAggregateOptions<TRecord>,
  ): Promise<RemoteAggregateResult>;
  groupBy(
    options: RemoteGroupByOptions<TRecord>,
  ): Promise<RemoteAggregateResult[]>;
  count(options?: RemoteFilterOnlyOptions<TRecord>): Promise<number>;
  exists(options?: RemoteFilterOnlyOptions<TRecord>): Promise<boolean>;
  createOne(
    options: RemoteCreateOneOptions<TCreate, TRecord>,
  ): Promise<RemoteMutationResult<TRecord>>;
  updateOne(
    options: RemoteUpdateOneOptions<TRecord, TUpdate>,
  ): Promise<RemoteMutationResult<TRecord>>;
  deleteOne(
    options: RemoteDeleteOneOptions<TRecord>,
  ): Promise<RemoteDeleteResult<TRecord>>;
}

export interface RemoteRepositoryQuery<T>
  extends PromiseLike<T[]>, AsyncIterable<T> {
  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T[] | TResult>;
  finally(onfinally?: (() => void) | null): Promise<T[]>;
}

export type RemoteRepositoryAction =
  | 'findMany'
  | 'findOne'
  | 'count'
  | 'aggregate'
  | 'groupBy'
  | 'exists'
  | 'createOne'
  | 'updateOne'
  | 'deleteOne';

export interface RepositoryApiResponse<TResult> {
  readonly data: TResult;
}

export interface RepositoryRequest {
  <TResult, TJson = unknown>(
    options: ApiRequestOptions<TJson>,
  ): Promise<TResult>;
}

export interface RepositoryStream {
  <TJson = unknown>(
    options: ApiRequestOptions<TJson>,
  ): Promise<ReadableStream<Uint8Array>>;
}

export interface CreateRemoteRepositoryOptions {
  readonly name: string;
  readonly request: RepositoryRequest;
  readonly stream: RepositoryStream;
}

export function createRemoteRepository<
  TRecord extends object = Record<string, unknown>,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
>(
  options: CreateRemoteRepositoryOptions,
): RemoteRepository<TRecord, TCreate, TUpdate> {
  const actionPath = (action: RemoteRepositoryAction): string =>
    `/${encodeURIComponent(options.name)}:${action}`;
  const call = <TResult, TJson>(
    action: RemoteRepositoryAction,
    json: TJson,
  ): Promise<TResult> =>
    options
      .request<RepositoryApiResponse<TResult>, TJson>({
        path: actionPath(action),
        method: 'POST',
        json,
      })
      .then((response): TResult => response.data);

  return {
    findMany: (
      input: RemoteFindManyOptions<TRecord> = {},
    ): RemoteRepositoryQuery<TRecord> => {
      const snapshot = buildFindManyOptions<TRecord>(input);
      return new DefaultRemoteRepositoryQuery(
        () => call('findMany', snapshot),
        () =>
          iterateRepositoryStream<TRecord>(
            options.stream,
            actionPath('findMany'),
            snapshot,
          ),
      );
    },
    findOne: async (
      input: RemoteFindOneOptions<TRecord>,
    ): Promise<TRecord | undefined> =>
      (await call<TRecord | null, RemoteFindOneOptions<TRecord>>(
        'findOne',
        buildFindOneOptions<TRecord>(input),
      )) ?? undefined,
    aggregate: (
      input: RemoteAggregateOptions<TRecord>,
    ): Promise<RemoteAggregateResult> =>
      call('aggregate', buildAggregateOptions<TRecord>(input)),
    groupBy: (
      input: RemoteGroupByOptions<TRecord>,
    ): Promise<RemoteAggregateResult[]> =>
      call('groupBy', buildGroupByOptions<TRecord>(input)),
    count: (input: RemoteFilterOnlyOptions<TRecord> = {}): Promise<number> =>
      call('count', buildCountOptions<TRecord>(input)),
    exists: (input: RemoteFilterOnlyOptions<TRecord> = {}): Promise<boolean> =>
      call('exists', buildExistsOptions<TRecord>(input)),
    createOne: (
      input: RemoteCreateOneOptions<TCreate, TRecord>,
    ): Promise<RemoteMutationResult<TRecord>> =>
      call('createOne', buildCreateOneOptions<TCreate, TRecord>(input)),
    updateOne: (
      input: RemoteUpdateOneOptions<TRecord, TUpdate>,
    ): Promise<RemoteMutationResult<TRecord>> =>
      call('updateOne', buildUpdateOneOptions<TRecord, TUpdate>(input)),
    deleteOne: (
      input: RemoteDeleteOneOptions<TRecord>,
    ): Promise<RemoteDeleteResult<TRecord>> =>
      call('deleteOne', buildDeleteOneOptions<TRecord>(input)),
  };
}

class DefaultRemoteRepositoryQuery<T> implements RemoteRepositoryQuery<T> {
  private mode?: 'array' | 'iterator';
  private promise?: Promise<T[]>;

  constructor(
    private readonly execute: () => Promise<T[]>,
    private readonly iterate: () => AsyncIterable<T>,
  ) {}

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.collect().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T[] | TResult> {
    return this.collect().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T[]> {
    return this.collect().finally(onfinally);
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.mode) throw queryConsumptionError();
    this.mode = 'iterator';
    return this.iterate()[Symbol.asyncIterator]();
  }

  private collect(): Promise<T[]> {
    if (this.mode === 'iterator') {
      return Promise.reject(queryConsumptionError());
    }
    if (!this.promise) {
      this.mode = 'array';
      this.promise = this.execute();
    }
    return this.promise;
  }
}

interface RepositoryRecordFrame<T> {
  readonly type: 'record';
  readonly data: T;
}

interface RepositoryEndFrame {
  readonly type: 'end';
}

interface RepositoryErrorFrame {
  readonly type: 'error';
  readonly error: {
    readonly reason?: string;
    readonly domain?: string;
    readonly message: string;
  };
}

type RepositoryStreamFrame<T> =
  RepositoryRecordFrame<T> | RepositoryEndFrame | RepositoryErrorFrame;

async function* iterateRepositoryStream<T>(
  streamRequest: RepositoryStream,
  path: string,
  input: unknown,
): AsyncIterable<T> {
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let ended = false;
  try {
    const body = await streamRequest({
      path,
      method: 'POST',
      headers: { Accept: 'application/x-ndjson' },
      json: input,
      signal: controller.signal,
    });
    reader = body.getReader();
    for await (const line of readLines(reader)) {
      if (!line.trim()) continue;
      const frame = parseRepositoryStreamFrame<T>(line, path);
      switch (frame.type) {
        case 'record':
          yield frame.data;
          break;
        case 'end':
          ended = true;
          return;
        case 'error':
          throw repositoryStreamError(
            frame.error.message,
            frame.error.reason,
            path,
            frame,
            frame.error.domain,
          );
      }
    }
    if (!ended) {
      throw repositoryStreamError(
        'Repository stream ended without an end frame.',
        'INCOMPLETE_REPOSITORY_STREAM',
        path,
      );
    }
  } finally {
    await reader?.cancel().catch(() => undefined);
    controller.abort();
  }
}

async function* readLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncIterable<string> {
  const decoder = new TextDecoder();
  let buffered = '';
  while (true) {
    const result = await reader.read();
    buffered += decoder.decode(result.value, { stream: !result.done });
    let newline = buffered.indexOf('\n');
    while (newline !== -1) {
      const line = buffered.slice(0, newline).replace(/\r$/u, '');
      buffered = buffered.slice(newline + 1);
      yield line;
      newline = buffered.indexOf('\n');
    }
    if (result.done) break;
  }
  if (buffered) yield buffered.replace(/\r$/u, '');
}

function parseRepositoryStreamFrame<T>(
  line: string,
  path: string,
): RepositoryStreamFrame<T> {
  let value: unknown;
  try {
    value = JSON.parse(line) as unknown;
  } catch {
    throw repositoryStreamError(
      'Repository stream contains invalid JSON.',
      'INVALID_REPOSITORY_STREAM',
      path,
      line,
    );
  }
  if (!isObject(value) || typeof value.type !== 'string') {
    throw invalidFrame(path, value);
  }
  if (value.type === 'record' && isObject(value.data)) {
    return value as unknown as RepositoryRecordFrame<T>;
  }
  if (value.type === 'end') return { type: 'end' };
  if (
    value.type === 'error' &&
    isObject(value.error) &&
    typeof value.error.message === 'string' &&
    (value.error.reason === undefined ||
      typeof value.error.reason === 'string') &&
    (value.error.domain === undefined || typeof value.error.domain === 'string')
  ) {
    return value as unknown as RepositoryErrorFrame;
  }
  throw invalidFrame(path, value);
}

function invalidFrame(path: string, payload: unknown): ApiClientError {
  return repositoryStreamError(
    'Repository stream contains an invalid frame.',
    'INVALID_REPOSITORY_STREAM',
    path,
    payload,
  );
}

function repositoryStreamError(
  message: string,
  reason: string | undefined,
  path: string,
  payload?: unknown,
  domain?: string,
): ApiClientError {
  return new ApiClientError(message, {
    status: 200,
    reason,
    domain,
    payload,
    method: 'POST',
    url: path,
  });
}

function queryConsumptionError(): Error & { readonly code: string } {
  return Object.assign(
    new Error(
      'A remote Repository query cannot mix consumption modes or be iterated twice. Create a new findMany query to execute again.',
    ),
    { code: 'QUERY_ALREADY_CONSUMED' },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
