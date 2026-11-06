export { createApiClient, type ApiClient } from './client.js';
export { ApiClientError, type ApiClientErrorOptions } from './errors.js';
export {
  createRemoteRepository,
  type CreateRemoteRepositoryOptions,
  type RemoteAggregateAst,
  type RemoteAggregateOptions,
  type RemoteAggregateResult,
  type RemoteGroupByOptions,
  type RemoteCreatedTargetReference,
  type RemoteCreateOneOptions,
  type RemoteDeleteOneOptions,
  type RemoteDeleteResult,
  type RemoteFilterOnlyOptions,
  type RemoteFilterAst,
  type RemoteFindManyOptions,
  type RemoteFindOneOptions,
  type RemoteMutationResult,
  type RemoteRepository,
  type RemoteRepositoryAction,
  type RemoteRepositoryFilter,
  type RemoteRepositoryQuery,
  type RemoteRepositoryReadOptions,
  type RemoteSelectAst,
  type RemoteSortAst,
  type RemoteUpdateOneOptions,
  type RepositoryApiResponse,
  type RepositoryRequest,
  type RepositoryStream,
} from './repository.js';
export type {
  ApiBodyRequestOptions,
  ApiClientHeaders,
  ApiJsonRequestOptions,
  ApiQuery,
  ApiQueryScalar,
  ApiQueryValue,
  ApiRequestBaseOptions,
  ApiRequestMethod,
  ApiRequestOptions,
  CreateApiClientOptions,
} from './types.js';

export * from './repository-options.js';
export {
  buildFilter,
  buildSelect,
  buildSort,
  buildAggregate,
  buildCreateValues,
  buildUpdateValues,
} from '@nocobase/repository-input';
export type {
  FilterBuilder,
  FilterNode,
  SelectBuilder,
  RelationSelectBuilder,
  SortBuilder,
  SortExpression,
  AggregateBuilder,
  AggregateExpression,
  ValuesBuilder,
  NumericMutationBuilder,
  CreateRelationFieldMutationBuilder,
  UpdateRelationFieldMutationBuilder,
  JsonValue,
  JsonValueOf,
} from '@nocobase/repository-input';

export { createOperationKey } from './operation-key.js';
