// Supported package API. Internal modules are intentionally not re-exported.
export {
  CollectionMetadataStoreRequiredError,
  createDatabaseManager,
} from './database/manager.js';
export { upsertPhysicalRow } from './database/upsert-physical-row.js';
export type { UpsertPhysicalRowOptions } from './database/upsert-physical-row.js';
export { databaseManagerToken } from './database/token.js';
export { resolveDatabaseDriver } from './database/resolve-driver.js';
export { defineDatabase } from './database/config.js';
export { SchemaManagementNotAllowedError } from './database/schema-management.js';
export type {
  AnyConnectionConfig,
  BaseConnectionConfig,
  ConnectionConfig,
  DatabaseConfig,
  DatabaseConfigFromDrivers,
  ConnectionConfigFromDrivers,
  DriverConnectionConfig,
  DatabaseDialect,
  DatabaseDriverDefinition,
  DatabaseDriverFactory,
  DatabaseDriverRegistration,
  DatabaseDriver,
  ExtensibleDatabaseConfig,
  SchemaManagementMode,
  CollectionMetadataStoreConfig,
  DirectoryCollectionMetadataStoreConfig,
} from './database/config.js';
export type { DatabaseConnection } from './database/connection.js';
export type { TransactionCallbackPhase } from './database/internal/transaction-callbacks.js';
export { defineRepositoryEventMeta } from './repository/events/meta.js';
export type {
  ExplainRepositoryEventsOptions,
  RepositoryEventErrorContext,
  RepositoryEventMeta,
  RepositoryEventMetaBag,
  RepositoryEventMetaEntry,
  RepositoryEventPhase,
  RepositoryEventStrategy,
  RepositoryEventSubscriptionDescription,
  RepositoryEventsExplanation,
  RepositoryMutationCount,
  RepositoryMutationEvent,
  RepositoryMutationEventBase,
  RepositoryMutationListeners,
  RepositoryMutationOperation,
  RepositoryMutationRows,
  RepositoryMutationSubscriptionOptions,
  RowChange,
  RowChangeKind,
} from './repository/events/types.js';
export type { DatabaseManager } from './database/manager.js';
export type {
  DatabaseDriverRuntime,
  DatabaseDriverRuntimeContext,
  DatabaseDriverRuntimeFactory,
  DatabaseNumericRuntimeStrategy,
  DatabaseQueryRuntimeStrategy,
  DatabaseRepositoryRuntimeStrategy,
  DatabaseSchemaRuntimeStrategy,
} from './database/runtime.js';

export { CollectionRelationValidationError } from './collection/registry/relation-validator.js';
export { CollectionResolutionError } from './collection/resolver/errors.js';
export type {
  BuilderExecOptions,
  BuilderResult,
  CollectionAlterBuilder,
  CollectionDefinition,
  CollectionDefinitionBuilder,
  CollectionOperation,
  FieldDefinition,
  FieldDefinitionBuilder,
  RelationFieldBuilder,
  RelationFieldDefinition,
  OptimisticLockDefinition,
} from './collection/types.js';
export type { CollectionBuilder } from './collection/builder/builder.js';
export type {
  CollectionDiagnosis,
  CollectionDiagnosisIssue,
  CollectionDiagnosisIssueCode,
  ConnectionCollections,
} from './collection/registry/types.js';
export type {
  CollectionResolutionResult,
  CollectionResolutionWarning,
} from './collection/resolver/types.js';
export {
  COLLECTION_ARTIFACT_FILE_NAMES,
  COLLECTION_ARTIFACT_FORMAT_VERSION,
  COLLECTION_ARTIFACT_MANIFEST_FILE_NAME,
  assertCollectionArtifactDirectoryNames,
  CollectionArtifactNameError,
  findCollectionArtifactNameConflicts,
  serializeCollectionArtifact,
  serializeCollectionArtifactManifest,
  validateCollectionArtifactDirectoryName,
} from './collection/artifact/index.js';
export type {
  CollectionArtifactCollectionFile,
  CollectionArtifactFileKind,
  CollectionArtifactFiles,
  CollectionArtifactFormatVersion,
  CollectionArtifactInput,
  CollectionArtifactManifest,
  CollectionArtifactManifestInput,
  CollectionArtifactMetadataFile,
  CollectionArtifactNameErrorCode,
  CollectionArtifactSchemaFile,
} from './collection/artifact/index.js';

export type {
  ComparisonOperator,
  DeleteQuery,
  Expression,
  ExpressionBuilder,
  InsertQuery,
  QueryAdapter,
  Row,
  SelectQuery,
  SqlBool,
  UpdateQuery,
} from './query/types.js';

export { defineMigration } from './migration/define.js';
export { loadMigrations, validateMigrations } from './migration/loader.js';
export { createMigrator } from './migration/migrator.js';
export {
  isTaskLockBusyError,
  TASK_LOCK_EXPIRY_MS,
  TASK_LOCK_HEARTBEAT_INTERVAL_MS,
  TaskLockBusyError,
} from './migration/internal/lock.js';
export type { Migrator } from './migration/migrator.js';
export type {
  ChecksumMismatch,
  ChecksumMismatchPolicy,
} from './migration/checksum-history.js';
export type {
  CreateMigratorOptions,
  DatabaseMigratorOptions,
  MigrationContext,
  MigrationHistoryRecord,
  MigrationDefinition,
  MigrationRepairOptions,
  MigrationRepairResult,
  MigrationRollbackOptions,
  MigrationRollbackResult,
  StaleTaskLockTakeover,
  TaskLockBusyDetails,
  TaskLockReleaseOptions,
  TaskLockReleaseResult,
  TaskLockState,
  MigrationRunResult,
  MigrationSource,
  MigrationTransactionMode,
} from './migration/types.js';

export { defineSeed } from './seed/define.js';
export { loadSeeds, validateSeeds } from './seed/loader.js';
export { createSeeder } from './seed/seeder.js';
export type { Seeder } from './seed/seeder.js';
export type {
  CreateSeederOptions,
  DatabaseSeederOptions,
  SeedContext,
  SeedDefinition,
  SeedHistoryRecord,
  SeedRepairOptions,
  SeedRepairResult,
  SeedRunResult,
  SeedSource,
  SeedTransactionMode,
} from './seed/types.js';

export {
  CollectionMetadataConflictError,
  CollectionMetadataStoreReadOnlyError,
} from './metadata/document-store-errors.js';
export { CollectionMetadataPatchError } from './metadata/service-errors.js';
export { CollectionMetadataValidationError } from './metadata/errors.js';
export { defineCollectionMetadata } from './metadata/define.js';
export { extractLegacyCollectionMetadata } from './metadata/legacy-extraction.js';
export { InMemoryCollectionMetadataStore } from './metadata/in-memory-document-store.js';
export { ModuleCollectionMetadataStore } from './metadata/module-document-store.js';
export { DirectoryCollectionMetadataStore } from './metadata/directory-document-store.js';
export type { DirectoryCollectionMetadataStoreOptions } from './metadata/directory-document-store.js';
export { validateCollectionMetadataDocument } from './metadata/validation.js';
export type {
  CollectionMetadataDocument,
  FieldMetadata,
  RelationMetadata,
} from './metadata/document.js';
export type { CollectionMetadataStore } from './metadata/document-store.js';

export type { DatabaseCapabilities } from './schema/adapter.js';
export type { SchemaInspector } from './schema/inspector/types.js';
export { BaseSchemaInspector } from './schema/inspector/base.js';
export type { NormalizedPhysicalCollectionListOptions } from './schema/inspector/base.js';
export {
  numberValue,
  optionalString,
  rawRows,
} from './schema/inspector/shared/result.js';
export {
  normalizePhysicalDataType,
  normalizeReferentialAction,
  parseColumnDefault,
  temporalFractionalSecondsPrecision,
} from './schema/inspector/shared/type-normalization.js';
export type { PhysicalTypeNormalizationStrategy } from './schema/inspector/shared/type-normalization.js';
export type { NumericCapabilityStrategy } from './schema/inspector/shared/column-capabilities.js';
export {
  numericCapabilities,
  sqliteAffinity,
} from './schema/inspector/shared/column-capabilities.js';
export type { DecodedPhysicalCollectionCursor } from './schema/inspector/shared/cursor.js';
export type {
  PhysicalCheckConstraintSchema,
  PhysicalDataType,
  PhysicalCollectionIdentifier,
  PhysicalCollectionKind,
  PhysicalCollectionSchema,
  PhysicalCollectionSummary,
  PhysicalForeignKeySchema,
  PhysicalIndexKey,
  PhysicalIndexSchema,
  PhysicalSchemaInfo,
  PhysicalUniqueConstraintSchema,
  SchemaInspectionWarning,
} from './schema/inspector/types.js';

export { UnsupportedCapabilityError } from './schema/capabilities.js';

export { RepositoryError } from './repository/errors.js';
export type { JsonResultForm, JsonValue } from './json.js';
export {
  isTemporalType,
  normalizeTemporalValue,
} from './repository/temporal.js';
export type {
  AggregateAst,
  AggregateBuilder,
  AggregateExpression,
  AggregateFunction,
  AggregateNode,
  AggregateOptions,
  AggregateResult,
  AggregateSelection,
  AggregateSelectionResult,
  BooleanFilterOperators,
  NumericMutationOperand,
  NumericMutationOperandInput,
  MutationVariable,
  MutationLiteral,
  MutationValueInput,
  MutationValuesInput,
  ScalarCreateValues,
  ValuesBuilder,
  NumericMutationOperation,
  NumericMutationJsonInput,
  NumericMutationBuilder,
  NumericMutationInput,
  ScalarUpdateValues,
  DynamicUpdateMutationInput,
  ConnectTarget,
  CreateManyOptions,
  CreateManyResult,
  CreateMutationValues,
  CreateOneOptions,
  CreateRelationFieldMutationBuilder,
  CreateRelationFieldMutationInput,
  CreateRelationFieldMutationJsonInput,
  CreateTarget,
  CreatedTargetReference,
  DateFilterOperators,
  DeleteManyOptions,
  DeleteManyResult,
  DeleteOneOptions,
  DeleteOneResult,
  DescribeMutationOptions,
  EmptyFilterOperators,
  FilterAst,
  FilterBuilder,
  FilterConditionNode,
  FilterFieldGroup,
  FilterGroupNode,
  FilterLiteral,
  FilterNode,
  FilterOnlyOptions,
  FilterOperator,
  FilterOperand,
  FilterRelationNode,
  FilterScalar,
  FilterShorthand,
  FilterShorthandValue,
  FilterValue,
  FilterVariable,
  FindManyOptions,
  FindOneOptions,
  GroupByOptions,
  GroupByResult,
  GroupBySelectionResult,
  JsonFilterOperators,
  MutationScope,
  MutationValidationError,
  MutationValidationResult,
  NestedCreateOptions,
  NonEmptyRepositorySort,
  NonEmptySortAst,
  NumberFilterOperators,
  RelationClearNode,
  RelationCreateValues,
  RelationCreateValuesInput,
  RelationDeleteInput,
  RelationDeleteInputList,
  RelationDeleteTarget,
  RelationFilterOperators,
  RelationMutationAst,
  RelationMutationNode,
  RelationModifyNode,
  RelationPatchNode,
  RelationReplaceNode,
  RelationSetNode,
  RelationTargetSelector,
  RelationTargetSelectorInput,
  RelationUpdateInput,
  RelationUpdateInputList,
  RelationUpdateTarget,
  RelationUpdateValues,
  RelationUpsertInput,
  RelationUpsertInputList,
  RelationUpsertTarget,
  Repository,
  RepositoryAggregateNumeric,
  RepositoryContext,
  RepositoryCursor,
  RepositoryCursorDirection,
  RepositoryFilter,
  RepositoryMutationDescription,
  RepositoryMutationScalarValue,
  RepositoryPath,
  RepositoryReadOptions,
  RepositoryQuery,
  RepositoryRecord,
  RepositoryRelationMutationDescription,
  RepositorySelect,
  RepositorySort,
  RepositoryUniqueFieldSetDescription,
  PolicyRecord,
  RepositoryOperations,
  ScopedRepository,
  RelationSelectBuilder,
  RelationConnectInput,
  RelationCreateInput,
  RelationSelectBranchNode,
  RelationSelectResultNode,
  RelationSelectionExpression,
  RelationCombineResult,
  SelectAst,
  SelectBuilder,
  SelectIncludeNode,
  SelectNode,
  SingleMutationResult,
  SingleMutationSelector,
  SortAggregateBuilder,
  SortAggregateNode,
  SortAst,
  SortBuilder,
  SortDirection,
  SortExpression,
  SortFieldBuilder,
  SortFieldNode,
  SortNullsPosition,
  SortNullsBuilder,
  SortNode,
  SortRelationBuilder,
  StringFilterOperators,
  StringFilterOptions,
  TextFilterOperators,
  TimeFilterOperators,
  UniqueSelector,
  UpdateManyOptions,
  UpdateManyResult,
  UpdateMutationValues,
  UpdateOneOptions,
  UpsertOneOptions,
  UpdateRelationFieldMutationBuilder,
  UpdateRelationFieldMutationInput,
  UpdateRelationFieldMutationJsonInput,
  ValidateMutationOptions,
} from './repository/types.js';
export type {
  RepositoryErrorCode,
  RepositoryErrorOptions,
} from './repository/errors.js';

export { buildRepositoryPolicy } from './repository/policy/build.js';
export type {
  CreatePolicyNodeBuilder,
  DeletePolicyNodeBuilder,
  ReadPolicyNodeBuilder,
  RelationCreateShapePolicyBuilder,
  RelationPolicyNodeBuilder,
  RelationShapePolicyBuilder,
  RelationUpsertPolicyBuilder,
  RepositoryPolicyBuilder,
  ThroughFieldsPolicyBuilder,
  ThroughPolicyBuilder,
  WritePolicyNodeBuilder,
} from './repository/policy/build.js';
export { normalizeRepositoryPolicy } from './repository/policy/normalize.js';
export { narrowRepositoryPolicy } from './repository/policy/narrow.js';
export { expandPolicyRefs, ref } from './repository/policy/refs.js';
export type { ScopedDatabaseConnection } from './database/connection.js';
export type {
  CreateNode,
  DeleteNode,
  NormalizedCreateNode,
  NormalizedDeleteNode,
  NormalizedReadNode,
  NormalizedRelationShapeNode,
  NormalizedRelationWriteNode,
  NormalizedRepositoryPolicy,
  NormalizedThroughNode,
  NormalizedWriteNode,
  PartialReadNode,
  PartialRepositoryPolicy,
  PolicyRef,
  PolicyScalarValue,
  PolicyScope,
  ReadNode,
  RelationCreateNode,
  RelationShapeNode,
  RelationWriteNode,
  RepositoryPolicy,
  WriteNode,
} from './repository/policy/types.js';

export {
  buildWritePolicy,
  buildUpsertWritePolicy,
  type WritePolicy,
  type WritePolicyInput,
  type WritePolicyBuilder,
  type FieldWritePolicy,
  type FieldWritePolicyInput,
  type FieldWritePolicyBuilder,
  type RelationWritePolicy,
  type RelationWritePolicyBuilder,
  type RelationCreateWritePolicy,
  type RelationCreateWritePolicyBuilder,
  type ThroughWritePolicy,
  type ThroughWritePolicyBuilder,
  type UpsertWritePolicy,
  type UpsertWritePolicyInput,
  type UpsertWritePolicyBuilder,
  type RelationWriteOperation,
} from './repository/write-policy.js';

export type { DatabaseTaskConfig } from './task-config.js';
