# Appendix C. Complete export index

This index covers every name exported by the two package entries. A value can be imported at runtime; a type requires a type import. Additional contracts reached through their signatures appear in the linked module pages and are not advertised as root exports.

[Contents](./README.md) · [Previous: errors and values](./errors-and-values.md)

## @nocobase/db

418 exports: 69 values and 349 types.

| Export                                                                                                        | Kind  | Topic                                                        |
| ------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------ |
| [AggregateAst](./signatures/inputs.md#aggregateast)                                                           | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateBuilder](./signatures/inputs.md#aggregatebuilder)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateExpression](./signatures/inputs.md#aggregateexpression)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateFunction](./signatures/inputs.md#aggregatefunction)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateNode](./signatures/inputs.md#aggregatenode)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateOptions](./signatures/inputs.md#aggregateoptions)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateResult](./signatures/inputs.md#aggregateresult)                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateSelection](./signatures/inputs.md#aggregateselection)                                               | type  | [Repository inputs and result types](./repository.md)        |
| [AggregateSelectionResult](./signatures/inputs.md#aggregateselectionresult)                                   | type  | [Repository inputs and result types](./repository.md)        |
| [AnyConnectionConfig](./signatures/connection.md#anyconnectionconfig)                                         | type  | [Connection](./connection.md)                                |
| [BaseConnectionConfig](./signatures/connection.md#baseconnectionconfig)                                       | type  | [Connection](./connection.md)                                |
| [BaseSchemaInspector](./signatures/schema.md#baseschemainspector)                                             | value | [Physical schema inspection](./collection-and-schema.md)     |
| [BooleanFilterOperators](./signatures/inputs.md#booleanfilteroperators)                                       | type  | [Repository inputs and result types](./repository.md)        |
| [BuilderExecOptions](./signatures/builder.md#builderexecoptions)                                              | type  | [Collection schema and builders](./collection-and-schema.md) |
| [BuilderResult](./signatures/builder.md#builderresult)                                                        | type  | [Collection schema and builders](./collection-and-schema.md) |
| [COLLECTION_ARTIFACT_FILE_NAMES](./signatures/artifacts.md#collection_artifact_file_names)                    | value | [Collection artifacts](./collection-and-schema.md)           |
| [COLLECTION_ARTIFACT_FORMAT_VERSION](./signatures/artifacts.md#collection_artifact_format_version)            | value | [Collection artifacts](./collection-and-schema.md)           |
| [COLLECTION_ARTIFACT_MANIFEST_FILE_NAME](./signatures/artifacts.md#collection_artifact_manifest_file_name)    | value | [Collection artifacts](./collection-and-schema.md)           |
| [ChecksumMismatch](./signatures/migration.md#checksummismatch)                                                | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [ChecksumMismatchPolicy](./signatures/migration.md#checksummismatchpolicy)                                    | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [CollectionAlterBuilder](./signatures/builder.md#collectionalterbuilder)                                      | type  | [Collection schema and builders](./collection-and-schema.md) |
| [CollectionArtifactCollectionFile](./signatures/artifacts.md#collectionartifactcollectionfile)                | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactFileKind](./signatures/artifacts.md#collectionartifactfilekind)                            | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactFiles](./signatures/artifacts.md#collectionartifactfiles)                                  | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactFormatVersion](./signatures/artifacts.md#collectionartifactformatversion)                  | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactInput](./signatures/artifacts.md#collectionartifactinput)                                  | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactManifest](./signatures/artifacts.md#collectionartifactmanifest)                            | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactManifestInput](./signatures/artifacts.md#collectionartifactmanifestinput)                  | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactMetadataFile](./signatures/artifacts.md#collectionartifactmetadatafile)                    | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactNameError](./signatures/artifacts.md#collectionartifactnameerror)                          | value | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactNameErrorCode](./signatures/artifacts.md#collectionartifactnameerrorcode)                  | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionArtifactSchemaFile](./signatures/artifacts.md#collectionartifactschemafile)                        | type  | [Collection artifacts](./collection-and-schema.md)           |
| [CollectionBuilder](./signatures/builder.md#collectionbuilder)                                                | type  | [Collection schema and builders](./collection-and-schema.md) |
| [CollectionDefinition](./signatures/builder.md#collectiondefinition)                                          | type  | [Collection schema and builders](./collection-and-schema.md) |
| [CollectionDefinitionBuilder](./signatures/builder.md#collectiondefinitionbuilder)                            | type  | [Collection schema and builders](./collection-and-schema.md) |
| [CollectionDiagnosis](./signatures/collections.md#collectiondiagnosis)                                        | type  | [Resolved collections](./collection-and-schema.md)           |
| [CollectionDiagnosisIssue](./signatures/collections.md#collectiondiagnosisissue)                              | type  | [Resolved collections](./collection-and-schema.md)           |
| [CollectionDiagnosisIssueCode](./signatures/collections.md#collectiondiagnosisissuecode)                      | type  | [Resolved collections](./collection-and-schema.md)           |
| [CollectionMetadataConflictError](./signatures/metadata.md#collectionmetadataconflicterror)                   | value | [Collection metadata](./collection-and-schema.md)            |
| [CollectionMetadataDocument](./signatures/metadata.md#collectionmetadatadocument)                             | type  | [Collection metadata](./collection-and-schema.md)            |
| [CollectionMetadataPatchError](./signatures/metadata.md#collectionmetadatapatcherror)                         | value | [Collection metadata](./collection-and-schema.md)            |
| [CollectionMetadataStore](./signatures/metadata.md#collectionmetadatastore)                                   | type  | [Collection metadata](./collection-and-schema.md)            |
| [CollectionMetadataStoreConfig](./signatures/connection.md#collectionmetadatastoreconfig)                     | type  | [Connection](./connection.md)                                |
| [CollectionMetadataStoreReadOnlyError](./signatures/metadata.md#collectionmetadatastorereadonlyerror)         | value | [Collection metadata](./collection-and-schema.md)            |
| [CollectionMetadataStoreRequiredError](./signatures/database-manager.md#collectionmetadatastorerequirederror) | value | [DatabaseManager](./database-manager.md)                     |
| [CollectionMetadataValidationError](./signatures/metadata.md#collectionmetadatavalidationerror)               | value | [Collection metadata](./collection-and-schema.md)            |
| [CollectionOperation](./signatures/builder.md#collectionoperation)                                            | type  | [Collection schema and builders](./collection-and-schema.md) |
| [CollectionRelationValidationError](./signatures/collections.md#collectionrelationvalidationerror)            | value | [Resolved collections](./collection-and-schema.md)           |
| [CollectionResolutionError](./signatures/collections.md#collectionresolutionerror)                            | value | [Resolved collections](./collection-and-schema.md)           |
| [CollectionResolutionResult](./signatures/collections.md#collectionresolutionresult)                          | type  | [Resolved collections](./collection-and-schema.md)           |
| [CollectionResolutionWarning](./signatures/collections.md#collectionresolutionwarning)                        | type  | [Resolved collections](./collection-and-schema.md)           |
| [ComparisonOperator](./signatures/query.md#comparisonoperator)                                                | type  | [Query and expressions](./query.md)                          |
| [ConnectTarget](./signatures/inputs.md#connecttarget)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [ConnectionCollections](./signatures/collections.md#connectioncollections)                                    | type  | [Resolved collections](./collection-and-schema.md)           |
| [ConnectionConfig](./signatures/connection.md#connectionconfig)                                               | type  | [Connection](./connection.md)                                |
| [ConnectionConfigFromDrivers](./signatures/database-manager.md#connectionconfigfromdrivers)                   | type  | [DatabaseManager](./database-manager.md)                     |
| [CreateManyOptions](./signatures/repository.md#createmanyoptions)                                             | type  | [Repository operations](./repository.md)                     |
| [CreateManyResult](./signatures/repository.md#createmanyresult)                                               | type  | [Repository operations](./repository.md)                     |
| [CreateMigratorOptions](./signatures/migration.md#createmigratoroptions)                                      | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [CreateMutationValues](./signatures/inputs.md#createmutationvalues)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [CreateNode](./signatures/policies.md#createnode)                                                             | type  | [Repository policies](./permissions.md)                      |
| [CreateOneOptions](./signatures/repository.md#createoneoptions)                                               | type  | [Repository operations](./repository.md)                     |
| [CreatePolicyNodeBuilder](./signatures/policies.md#createpolicynodebuilder)                                   | type  | [Repository policies](./permissions.md)                      |
| [CreateRelationFieldMutationBuilder](./signatures/inputs.md#createrelationfieldmutationbuilder)               | type  | [Repository inputs and result types](./repository.md)        |
| [CreateRelationFieldMutationInput](./signatures/inputs.md#createrelationfieldmutationinput)                   | type  | [Repository inputs and result types](./repository.md)        |
| [CreateRelationFieldMutationJsonInput](./signatures/inputs.md#createrelationfieldmutationjsoninput)           | type  | [Repository inputs and result types](./repository.md)        |
| [CreateSeederOptions](./signatures/seed.md#createseederoptions)                                               | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [CreateTarget](./signatures/inputs.md#createtarget)                                                           | type  | [Repository inputs and result types](./repository.md)        |
| [CreatedTargetReference](./signatures/repository.md#createdtargetreference)                                   | type  | [Repository operations](./repository.md)                     |
| [DatabaseCapabilities](./signatures/drivers.md#databasecapabilities)                                          | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseConfig](./signatures/database-manager.md#databaseconfig)                                             | type  | [DatabaseManager](./database-manager.md)                     |
| [DatabaseConfigFromDrivers](./signatures/database-manager.md#databaseconfigfromdrivers)                       | type  | [DatabaseManager](./database-manager.md)                     |
| [DatabaseConnection](./signatures/connection.md#databaseconnection)                                           | type  | [Connection](./connection.md)                                |
| [DatabaseDialect](./signatures/connection.md#databasedialect)                                                 | type  | [Connection](./connection.md)                                |
| [DatabaseDriver](./signatures/connection.md#databasedriver)                                                   | type  | [Connection](./connection.md)                                |
| [DatabaseDriverDefinition](./signatures/drivers.md#databasedriverdefinition)                                  | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseDriverFactory](./signatures/drivers.md#databasedriverfactory)                                        | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseDriverRegistration](./signatures/drivers.md#databasedriverregistration)                              | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseDriverRuntime](./signatures/drivers.md#databasedriverruntime)                                        | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseDriverRuntimeContext](./signatures/drivers.md#databasedriverruntimecontext)                          | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseDriverRuntimeFactory](./signatures/drivers.md#databasedriverruntimefactory)                          | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseManager](./signatures/database-manager.md#databasemanager)                                           | type  | [DatabaseManager](./database-manager.md)                     |
| [DatabaseMigratorOptions](./signatures/migration.md#databasemigratoroptions)                                  | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [DatabaseNumericRuntimeStrategy](./signatures/drivers.md#databasenumericruntimestrategy)                      | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseQueryRuntimeStrategy](./signatures/drivers.md#databasequeryruntimestrategy)                          | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseRepositoryRuntimeStrategy](./signatures/drivers.md#databaserepositoryruntimestrategy)                | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseSchemaRuntimeStrategy](./signatures/drivers.md#databaseschemaruntimestrategy)                        | type  | [Driver and runtime extension](./driver-extension.md)        |
| [DatabaseScope](./signatures/policies.md#databasescope)                                                       | type  | [Repository policies](./permissions.md)                      |
| [DatabaseScopePolicies](./signatures/policies.md#databasescopepolicies)                                       | type  | [Repository policies](./permissions.md)                      |
| [DatabaseSeederOptions](./signatures/seed.md#databaseseederoptions)                                           | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [DatabaseTaskConfig](./signatures/migration.md#databasetaskconfig)                                            | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [DateFilterOperators](./signatures/inputs.md#datefilteroperators)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [DecodedPhysicalCollectionCursor](./signatures/schema.md#decodedphysicalcollectioncursor)                     | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [DeleteManyOptions](./signatures/repository.md#deletemanyoptions)                                             | type  | [Repository operations](./repository.md)                     |
| [DeleteManyResult](./signatures/repository.md#deletemanyresult)                                               | type  | [Repository operations](./repository.md)                     |
| [DeleteNode](./signatures/policies.md#deletenode)                                                             | type  | [Repository policies](./permissions.md)                      |
| [DeleteOneOptions](./signatures/repository.md#deleteoneoptions)                                               | type  | [Repository operations](./repository.md)                     |
| [DeleteOneResult](./signatures/repository.md#deleteoneresult)                                                 | type  | [Repository operations](./repository.md)                     |
| [DeletePolicyNodeBuilder](./signatures/policies.md#deletepolicynodebuilder)                                   | type  | [Repository policies](./permissions.md)                      |
| [DeleteQuery](./signatures/query.md#deletequery)                                                              | type  | [Query and expressions](./query.md)                          |
| [DescribeMutationOptions](./signatures/repository.md#describemutationoptions)                                 | type  | [Repository operations](./repository.md)                     |
| [DirectoryCollectionMetadataStore](./signatures/metadata.md#directorycollectionmetadatastore)                 | value | [Collection metadata](./collection-and-schema.md)            |
| [DirectoryCollectionMetadataStoreConfig](./signatures/connection.md#directorycollectionmetadatastoreconfig)   | type  | [Connection](./connection.md)                                |
| [DirectoryCollectionMetadataStoreOptions](./signatures/metadata.md#directorycollectionmetadatastoreoptions)   | type  | [Collection metadata](./collection-and-schema.md)            |
| [DriverConnectionConfig](./signatures/database-manager.md#driverconnectionconfig)                             | type  | [DatabaseManager](./database-manager.md)                     |
| [DynamicUpdateMutationInput](./signatures/inputs.md#dynamicupdatemutationinput)                               | type  | [Repository inputs and result types](./repository.md)        |
| [EmptyFilterOperators](./signatures/inputs.md#emptyfilteroperators)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [ExplainRepositoryEventsOptions](./signatures/events.md#explainrepositoryeventsoptions)                       | type  | [Repository mutation events](./events.md)                    |
| [Expression](./signatures/query.md#expression)                                                                | type  | [Query and expressions](./query.md)                          |
| [ExpressionBuilder](./signatures/query.md#expressionbuilder)                                                  | type  | [Query and expressions](./query.md)                          |
| [ExtensibleDatabaseConfig](./signatures/database-manager.md#extensibledatabaseconfig)                         | type  | [DatabaseManager](./database-manager.md)                     |
| [FieldDefinition](./signatures/builder.md#fielddefinition)                                                    | type  | [Collection schema and builders](./collection-and-schema.md) |
| [FieldDefinitionBuilder](./signatures/builder.md#fielddefinitionbuilder)                                      | type  | [Collection schema and builders](./collection-and-schema.md) |
| [FieldMetadata](./signatures/metadata.md#fieldmetadata)                                                       | type  | [Collection metadata](./collection-and-schema.md)            |
| [FieldWritePolicy](./signatures/policies.md#fieldwritepolicy)                                                 | type  | [Repository policies](./permissions.md)                      |
| [FieldWritePolicyBuilder](./signatures/policies.md#fieldwritepolicybuilder)                                   | type  | [Repository policies](./permissions.md)                      |
| [FieldWritePolicyInput](./signatures/policies.md#fieldwritepolicyinput)                                       | type  | [Repository policies](./permissions.md)                      |
| [FilterAst](./signatures/inputs.md#filterast)                                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [FilterBuilder](./signatures/inputs.md#filterbuilder)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [FilterConditionNode](./signatures/inputs.md#filterconditionnode)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [FilterFieldGroup](./signatures/inputs.md#filterfieldgroup)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [FilterGroupNode](./signatures/inputs.md#filtergroupnode)                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [FilterLiteral](./signatures/inputs.md#filterliteral)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [FilterNode](./signatures/inputs.md#filternode)                                                               | type  | [Repository inputs and result types](./repository.md)        |
| [FilterOnlyOptions](./signatures/repository.md#filteronlyoptions)                                             | type  | [Repository operations](./repository.md)                     |
| [FilterOperand](./signatures/inputs.md#filteroperand)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [FilterOperator](./signatures/inputs.md#filteroperator)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [FilterRelationNode](./signatures/inputs.md#filterrelationnode)                                               | type  | [Repository inputs and result types](./repository.md)        |
| [FilterScalar](./signatures/inputs.md#filterscalar)                                                           | type  | [Repository inputs and result types](./repository.md)        |
| [FilterShorthand](./signatures/inputs.md#filtershorthand)                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [FilterShorthandValue](./signatures/inputs.md#filtershorthandvalue)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [FilterValue](./signatures/inputs.md#filtervalue)                                                             | type  | [Repository inputs and result types](./repository.md)        |
| [FilterVariable](./signatures/inputs.md#filtervariable)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [FindManyOptions](./signatures/repository.md#findmanyoptions)                                                 | type  | [Repository operations](./repository.md)                     |
| [FindOneOptions](./signatures/repository.md#findoneoptions)                                                   | type  | [Repository operations](./repository.md)                     |
| [GroupByOptions](./signatures/inputs.md#groupbyoptions)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [GroupByResult](./signatures/inputs.md#groupbyresult)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [GroupBySelectionResult](./signatures/inputs.md#groupbyselectionresult)                                       | type  | [Repository inputs and result types](./repository.md)        |
| [InMemoryCollectionMetadataStore](./signatures/metadata.md#inmemorycollectionmetadatastore)                   | value | [Collection metadata](./collection-and-schema.md)            |
| [InsertQuery](./signatures/query.md#insertquery)                                                              | type  | [Query and expressions](./query.md)                          |
| [JsonFilterOperators](./signatures/inputs.md#jsonfilteroperators)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [JsonResultForm](./signatures/values.md#jsonresultform)                                                       | type  | [Value normalization and errors](./errors-and-values.md)     |
| [JsonValue](./signatures/values.md#jsonvalue)                                                                 | type  | [Value normalization and errors](./errors-and-values.md)     |
| [MigrationContext](./signatures/migration.md#migrationcontext)                                                | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationDefinition](./signatures/migration.md#migrationdefinition)                                          | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationHistoryRecord](./signatures/migration.md#migrationhistoryrecord)                                    | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationRepairOptions](./signatures/migration.md#migrationrepairoptions)                                    | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationRepairResult](./signatures/migration.md#migrationrepairresult)                                      | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationRollbackOptions](./signatures/migration.md#migrationrollbackoptions)                                | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationRollbackResult](./signatures/migration.md#migrationrollbackresult)                                  | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationRunResult](./signatures/migration.md#migrationrunresult)                                            | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationSource](./signatures/migration.md#migrationsource)                                                  | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [MigrationTransactionMode](./signatures/migration.md#migrationtransactionmode)                                | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [Migrator](./signatures/migration.md#migrator)                                                                | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [ModuleCollectionMetadataStore](./signatures/metadata.md#modulecollectionmetadatastore)                       | value | [Collection metadata](./collection-and-schema.md)            |
| [MutationLiteral](./signatures/inputs.md#mutationliteral)                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [MutationScope](./signatures/repository.md#mutationscope)                                                     | type  | [Repository operations](./repository.md)                     |
| [MutationValidationError](./signatures/repository.md#mutationvalidationerror)                                 | type  | [Repository operations](./repository.md)                     |
| [MutationValidationResult](./signatures/repository.md#mutationvalidationresult)                               | type  | [Repository operations](./repository.md)                     |
| [MutationValueInput](./signatures/inputs.md#mutationvalueinput)                                               | type  | [Repository inputs and result types](./repository.md)        |
| [MutationValuesInput](./signatures/inputs.md#mutationvaluesinput)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [MutationVariable](./signatures/inputs.md#mutationvariable)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [NestedCreateOptions](./signatures/inputs.md#nestedcreateoptions)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [NonEmptyRepositorySort](./signatures/inputs.md#nonemptyrepositorysort)                                       | type  | [Repository inputs and result types](./repository.md)        |
| [NonEmptySortAst](./signatures/inputs.md#nonemptysortast)                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [NormalizedCreateNode](./signatures/policies.md#normalizedcreatenode)                                         | type  | [Repository policies](./permissions.md)                      |
| [NormalizedDeleteNode](./signatures/policies.md#normalizeddeletenode)                                         | type  | [Repository policies](./permissions.md)                      |
| [NormalizedPhysicalCollectionListOptions](./signatures/schema.md#normalizedphysicalcollectionlistoptions)     | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [NormalizedReadNode](./signatures/policies.md#normalizedreadnode)                                             | type  | [Repository policies](./permissions.md)                      |
| [NormalizedRelationShapeNode](./signatures/policies.md#normalizedrelationshapenode)                           | type  | [Repository policies](./permissions.md)                      |
| [NormalizedRelationWriteNode](./signatures/policies.md#normalizedrelationwritenode)                           | type  | [Repository policies](./permissions.md)                      |
| [NormalizedRepositoryPolicy](./signatures/policies.md#normalizedrepositorypolicy)                             | type  | [Repository policies](./permissions.md)                      |
| [NormalizedThroughNode](./signatures/policies.md#normalizedthroughnode)                                       | type  | [Repository policies](./permissions.md)                      |
| [NormalizedWriteNode](./signatures/policies.md#normalizedwritenode)                                           | type  | [Repository policies](./permissions.md)                      |
| [NumberFilterOperators](./signatures/inputs.md#numberfilteroperators)                                         | type  | [Repository inputs and result types](./repository.md)        |
| [NumericCapabilityStrategy](./signatures/schema.md#numericcapabilitystrategy)                                 | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [NumericMutationBuilder](./signatures/inputs.md#numericmutationbuilder)                                       | type  | [Repository inputs and result types](./repository.md)        |
| [NumericMutationInput](./signatures/inputs.md#numericmutationinput)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [NumericMutationJsonInput](./signatures/inputs.md#numericmutationjsoninput)                                   | type  | [Repository inputs and result types](./repository.md)        |
| [NumericMutationOperand](./signatures/inputs.md#numericmutationoperand)                                       | type  | [Repository inputs and result types](./repository.md)        |
| [NumericMutationOperandInput](./signatures/inputs.md#numericmutationoperandinput)                             | type  | [Repository inputs and result types](./repository.md)        |
| [NumericMutationOperation](./signatures/inputs.md#numericmutationoperation)                                   | type  | [Repository inputs and result types](./repository.md)        |
| [OptimisticLockDefinition](./signatures/builder.md#optimisticlockdefinition)                                  | type  | [Collection schema and builders](./collection-and-schema.md) |
| [PartialReadNode](./signatures/policies.md#partialreadnode)                                                   | type  | [Repository policies](./permissions.md)                      |
| [PartialRepositoryPolicy](./signatures/policies.md#partialrepositorypolicy)                                   | type  | [Repository policies](./permissions.md)                      |
| [PhysicalCheckConstraintSchema](./signatures/schema.md#physicalcheckconstraintschema)                         | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalCollectionIdentifier](./signatures/schema.md#physicalcollectionidentifier)                           | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalCollectionKind](./signatures/schema.md#physicalcollectionkind)                                       | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalCollectionSchema](./signatures/schema.md#physicalcollectionschema)                                   | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalCollectionSummary](./signatures/schema.md#physicalcollectionsummary)                                 | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalDataType](./signatures/schema.md#physicaldatatype)                                                   | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalForeignKeySchema](./signatures/schema.md#physicalforeignkeyschema)                                   | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalIndexKey](./signatures/schema.md#physicalindexkey)                                                   | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalIndexSchema](./signatures/schema.md#physicalindexschema)                                             | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalSchemaInfo](./signatures/schema.md#physicalschemainfo)                                               | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalTypeNormalizationStrategy](./signatures/schema.md#physicaltypenormalizationstrategy)                 | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PhysicalUniqueConstraintSchema](./signatures/schema.md#physicaluniqueconstraintschema)                       | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [PolicyRecord](./signatures/policies.md#policyrecord)                                                         | type  | [Repository policies](./permissions.md)                      |
| [PolicyRef](./signatures/policies.md#policyref)                                                               | type  | [Repository policies](./permissions.md)                      |
| [PolicyScalarValue](./signatures/policies.md#policyscalarvalue)                                               | type  | [Repository policies](./permissions.md)                      |
| [PolicyScope](./signatures/policies.md#policyscope)                                                           | type  | [Repository policies](./permissions.md)                      |
| [QueryAdapter](./signatures/query.md#queryadapter)                                                            | type  | [Query and expressions](./query.md)                          |
| [ReadNode](./signatures/policies.md#readnode)                                                                 | type  | [Repository policies](./permissions.md)                      |
| [ReadPolicyNodeBuilder](./signatures/policies.md#readpolicynodebuilder)                                       | type  | [Repository policies](./permissions.md)                      |
| [RelationClearNode](./signatures/inputs.md#relationclearnode)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [RelationCombineResult](./signatures/inputs.md#relationcombineresult)                                         | type  | [Repository inputs and result types](./repository.md)        |
| [RelationConnectInput](./signatures/inputs.md#relationconnectinput)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationCreateInput](./signatures/inputs.md#relationcreateinput)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationCreateNode](./signatures/policies.md#relationcreatenode)                                             | type  | [Repository policies](./permissions.md)                      |
| [RelationCreateShapePolicyBuilder](./signatures/policies.md#relationcreateshapepolicybuilder)                 | type  | [Repository policies](./permissions.md)                      |
| [RelationCreateValues](./signatures/inputs.md#relationcreatevalues)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationCreateValuesInput](./signatures/inputs.md#relationcreatevaluesinput)                                 | type  | [Repository inputs and result types](./repository.md)        |
| [RelationCreateWritePolicy](./signatures/policies.md#relationcreatewritepolicy)                               | type  | [Repository policies](./permissions.md)                      |
| [RelationCreateWritePolicyBuilder](./signatures/policies.md#relationcreatewritepolicybuilder)                 | type  | [Repository policies](./permissions.md)                      |
| [RelationDeleteInput](./signatures/inputs.md#relationdeleteinput)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationDeleteInputList](./signatures/inputs.md#relationdeleteinputlist)                                     | type  | [Repository inputs and result types](./repository.md)        |
| [RelationDeleteTarget](./signatures/inputs.md#relationdeletetarget)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationFieldBuilder](./signatures/builder.md#relationfieldbuilder)                                          | type  | [Collection schema and builders](./collection-and-schema.md) |
| [RelationFieldDefinition](./signatures/builder.md#relationfielddefinition)                                    | type  | [Collection schema and builders](./collection-and-schema.md) |
| [RelationFilterOperators](./signatures/inputs.md#relationfilteroperators)                                     | type  | [Repository inputs and result types](./repository.md)        |
| [RelationMetadata](./signatures/metadata.md#relationmetadata)                                                 | type  | [Collection metadata](./collection-and-schema.md)            |
| [RelationModifyNode](./signatures/inputs.md#relationmodifynode)                                               | type  | [Repository inputs and result types](./repository.md)        |
| [RelationMutationAst](./signatures/inputs.md#relationmutationast)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationMutationNode](./signatures/inputs.md#relationmutationnode)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationPatchNode](./signatures/inputs.md#relationpatchnode)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [RelationPolicyNodeBuilder](./signatures/policies.md#relationpolicynodebuilder)                               | type  | [Repository policies](./permissions.md)                      |
| [RelationReplaceNode](./signatures/inputs.md#relationreplacenode)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationSelectBranchNode](./signatures/inputs.md#relationselectbranchnode)                                   | type  | [Repository inputs and result types](./repository.md)        |
| [RelationSelectBuilder](./signatures/inputs.md#relationselectbuilder)                                         | type  | [Repository inputs and result types](./repository.md)        |
| [RelationSelectResultNode](./signatures/inputs.md#relationselectresultnode)                                   | type  | [Repository inputs and result types](./repository.md)        |
| [RelationSelectionExpression](./signatures/inputs.md#relationselectionexpression)                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationSetNode](./signatures/inputs.md#relationsetnode)                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [RelationShapeNode](./signatures/policies.md#relationshapenode)                                               | type  | [Repository policies](./permissions.md)                      |
| [RelationShapePolicyBuilder](./signatures/policies.md#relationshapepolicybuilder)                             | type  | [Repository policies](./permissions.md)                      |
| [RelationTargetSelector](./signatures/inputs.md#relationtargetselector)                                       | type  | [Repository inputs and result types](./repository.md)        |
| [RelationTargetSelectorInput](./signatures/inputs.md#relationtargetselectorinput)                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpdateInput](./signatures/inputs.md#relationupdateinput)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpdateInputList](./signatures/inputs.md#relationupdateinputlist)                                     | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpdateTarget](./signatures/inputs.md#relationupdatetarget)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpdateValues](./signatures/inputs.md#relationupdatevalues)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpsertInput](./signatures/inputs.md#relationupsertinput)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpsertInputList](./signatures/inputs.md#relationupsertinputlist)                                     | type  | [Repository inputs and result types](./repository.md)        |
| [RelationUpsertPolicyBuilder](./signatures/policies.md#relationupsertpolicybuilder)                           | type  | [Repository policies](./permissions.md)                      |
| [RelationUpsertTarget](./signatures/inputs.md#relationupserttarget)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [RelationWriteNode](./signatures/policies.md#relationwritenode)                                               | type  | [Repository policies](./permissions.md)                      |
| [RelationWriteOperation](./signatures/policies.md#relationwriteoperation)                                     | type  | [Repository policies](./permissions.md)                      |
| [RelationWritePolicy](./signatures/policies.md#relationwritepolicy)                                           | type  | [Repository policies](./permissions.md)                      |
| [RelationWritePolicyBuilder](./signatures/policies.md#relationwritepolicybuilder)                             | type  | [Repository policies](./permissions.md)                      |
| [Repository](./signatures/repository.md#repository)                                                           | type  | [Repository operations](./repository.md)                     |
| [RepositoryAggregateNumeric](./signatures/inputs.md#repositoryaggregatenumeric)                               | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryContext](./signatures/inputs.md#repositorycontext)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryCursor](./signatures/inputs.md#repositorycursor)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryCursorDirection](./signatures/inputs.md#repositorycursordirection)                                 | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryError](./signatures/values.md#repositoryerror)                                                     | value | [Value normalization and errors](./errors-and-values.md)     |
| [RepositoryErrorCode](./signatures/values.md#repositoryerrorcode)                                             | type  | [Value normalization and errors](./errors-and-values.md)     |
| [RepositoryErrorOptions](./signatures/values.md#repositoryerroroptions)                                       | type  | [Value normalization and errors](./errors-and-values.md)     |
| [RepositoryErrorStatus](./signatures/values.md#repositoryerrorstatus)                                         | type  | [Value normalization and errors](./errors-and-values.md)     |
| [RepositoryEventErrorContext](./signatures/events.md#repositoryeventerrorcontext)                             | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventMeta](./signatures/events.md#repositoryeventmeta)                                             | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventMetaBag](./signatures/events.md#repositoryeventmetabag)                                       | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventMetaEntry](./signatures/events.md#repositoryeventmetaentry)                                   | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventPhase](./signatures/events.md#repositoryeventphase)                                           | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventStrategy](./signatures/events.md#repositoryeventstrategy)                                     | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventSubscriptionDescription](./signatures/events.md#repositoryeventsubscriptiondescription)       | type  | [Repository mutation events](./events.md)                    |
| [RepositoryEventsExplanation](./signatures/events.md#repositoryeventsexplanation)                             | type  | [Repository mutation events](./events.md)                    |
| [RepositoryFilter](./signatures/inputs.md#repositoryfilter)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryMutationCount](./signatures/events.md#repositorymutationcount)                                     | type  | [Repository mutation events](./events.md)                    |
| [RepositoryMutationDescription](./signatures/repository.md#repositorymutationdescription)                     | type  | [Repository operations](./repository.md)                     |
| [RepositoryMutationEvent](./signatures/events.md#repositorymutationevent)                                     | type  | [Repository mutation events](./events.md)                    |
| [RepositoryMutationEventBase](./signatures/events.md#repositorymutationeventbase)                             | type  | [Repository mutation events](./events.md)                    |
| [RepositoryMutationListeners](./signatures/events.md#repositorymutationlisteners)                             | type  | [Repository mutation events](./events.md)                    |
| [RepositoryMutationOperation](./signatures/events.md#repositorymutationoperation)                             | type  | [Repository mutation events](./events.md)                    |
| [RepositoryMutationRows](./signatures/events.md#repositorymutationrows)                                       | type  | [Repository mutation events](./events.md)                    |
| [RepositoryMutationScalarValue](./signatures/inputs.md#repositorymutationscalarvalue)                         | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryMutationSubscriptionOptions](./signatures/events.md#repositorymutationsubscriptionoptions)         | type  | [Repository mutation events](./events.md)                    |
| [RepositoryOperations](./signatures/policies.md#repositoryoperations)                                         | type  | [Repository policies](./permissions.md)                      |
| [RepositoryPath](./signatures/inputs.md#repositorypath)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryPolicy](./signatures/policies.md#repositorypolicy)                                                 | type  | [Repository policies](./permissions.md)                      |
| [RepositoryPolicyBuilder](./signatures/policies.md#repositorypolicybuilder)                                   | type  | [Repository policies](./permissions.md)                      |
| [RepositoryQuery](./signatures/repository.md#repositoryquery)                                                 | type  | [Repository operations](./repository.md)                     |
| [RepositoryReadOptions](./signatures/repository.md#repositoryreadoptions)                                     | type  | [Repository operations](./repository.md)                     |
| [RepositoryRecord](./signatures/inputs.md#repositoryrecord)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryRelationMutationDescription](./signatures/repository.md#repositoryrelationmutationdescription)     | type  | [Repository operations](./repository.md)                     |
| [RepositorySelect](./signatures/inputs.md#repositoryselect)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [RepositorySort](./signatures/inputs.md#repositorysort)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [RepositoryUniqueFieldSetDescription](./signatures/repository.md#repositoryuniquefieldsetdescription)         | type  | [Repository operations](./repository.md)                     |
| [Row](./signatures/query.md#row)                                                                              | type  | [Query and expressions](./query.md)                          |
| [RowChange](./signatures/events.md#rowchange)                                                                 | type  | [Repository mutation events](./events.md)                    |
| [RowChangeKind](./signatures/events.md#rowchangekind)                                                         | type  | [Repository mutation events](./events.md)                    |
| [ScalarCreateValues](./signatures/inputs.md#scalarcreatevalues)                                               | type  | [Repository inputs and result types](./repository.md)        |
| [ScalarUpdateValues](./signatures/inputs.md#scalarupdatevalues)                                               | type  | [Repository inputs and result types](./repository.md)        |
| [SchemaInspectionWarning](./signatures/schema.md#schemainspectionwarning)                                     | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [SchemaInspector](./signatures/schema.md#schemainspector)                                                     | type  | [Physical schema inspection](./collection-and-schema.md)     |
| [SchemaManagementMode](./signatures/connection.md#schemamanagementmode)                                       | type  | [Connection](./connection.md)                                |
| [SchemaManagementNotAllowedError](./signatures/connection.md#schemamanagementnotallowederror)                 | value | [Connection](./connection.md)                                |
| [ScopedDatabaseConnection](./signatures/policies.md#scopeddatabaseconnection)                                 | type  | [Repository policies](./permissions.md)                      |
| [ScopedRepository](./signatures/policies.md#scopedrepository)                                                 | type  | [Repository policies](./permissions.md)                      |
| [SeedContext](./signatures/seed.md#seedcontext)                                                               | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedDefinition](./signatures/seed.md#seeddefinition)                                                         | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedHistoryEntry](./signatures/seed.md#seedhistoryentry)                                                     | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedHistoryRecord](./signatures/seed.md#seedhistoryrecord)                                                   | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedHistoryStatus](./signatures/seed.md#seedhistorystatus)                                                   | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedRepairOptions](./signatures/seed.md#seedrepairoptions)                                                   | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedRepairResult](./signatures/seed.md#seedrepairresult)                                                     | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedRunResult](./signatures/seed.md#seedrunresult)                                                           | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedSampleOptions](./signatures/seed.md#seedsampleoptions)                                                   | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedSampleRunResult](./signatures/seed.md#seedsamplerunresult)                                               | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedSource](./signatures/seed.md#seedsource)                                                                 | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SeedTransactionMode](./signatures/seed.md#seedtransactionmode)                                               | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [Seeder](./signatures/seed.md#seeder)                                                                         | type  | [Seeds and sample data](./migration-and-seed.md)             |
| [SelectAst](./signatures/inputs.md#selectast)                                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [SelectBuilder](./signatures/inputs.md#selectbuilder)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [SelectIncludeNode](./signatures/inputs.md#selectincludenode)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [SelectNode](./signatures/inputs.md#selectnode)                                                               | type  | [Repository inputs and result types](./repository.md)        |
| [SelectQuery](./signatures/query.md#selectquery)                                                              | type  | [Query and expressions](./query.md)                          |
| [SingleMutationResult](./signatures/repository.md#singlemutationresult)                                       | type  | [Repository operations](./repository.md)                     |
| [SingleMutationSelector](./signatures/repository.md#singlemutationselector)                                   | type  | [Repository operations](./repository.md)                     |
| [SortAggregateBuilder](./signatures/inputs.md#sortaggregatebuilder)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [SortAggregateNode](./signatures/inputs.md#sortaggregatenode)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [SortAst](./signatures/inputs.md#sortast)                                                                     | type  | [Repository inputs and result types](./repository.md)        |
| [SortBuilder](./signatures/inputs.md#sortbuilder)                                                             | type  | [Repository inputs and result types](./repository.md)        |
| [SortDirection](./signatures/inputs.md#sortdirection)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [SortExpression](./signatures/inputs.md#sortexpression)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [SortFieldBuilder](./signatures/inputs.md#sortfieldbuilder)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [SortFieldNode](./signatures/inputs.md#sortfieldnode)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [SortNode](./signatures/inputs.md#sortnode)                                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [SortNullsBuilder](./signatures/inputs.md#sortnullsbuilder)                                                   | type  | [Repository inputs and result types](./repository.md)        |
| [SortNullsPosition](./signatures/inputs.md#sortnullsposition)                                                 | type  | [Repository inputs and result types](./repository.md)        |
| [SortRelationBuilder](./signatures/inputs.md#sortrelationbuilder)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [SqlBool](./signatures/query.md#sqlbool)                                                                      | type  | [Query and expressions](./query.md)                          |
| [StaleTaskLockTakeover](./signatures/migration.md#staletasklocktakeover)                                      | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [StringFilterOperators](./signatures/inputs.md#stringfilteroperators)                                         | type  | [Repository inputs and result types](./repository.md)        |
| [StringFilterOptions](./signatures/inputs.md#stringfilteroptions)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [TASK_LOCK_EXPIRY_MS](./signatures/migration.md#task_lock_expiry_ms)                                          | value | [Migrations and task locks](./migration-and-seed.md)         |
| [TASK_LOCK_HEARTBEAT_INTERVAL_MS](./signatures/migration.md#task_lock_heartbeat_interval_ms)                  | value | [Migrations and task locks](./migration-and-seed.md)         |
| [TaskLockBusyDetails](./signatures/migration.md#tasklockbusydetails)                                          | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [TaskLockBusyError](./signatures/migration.md#tasklockbusyerror)                                              | value | [Migrations and task locks](./migration-and-seed.md)         |
| [TaskLockReleaseOptions](./signatures/migration.md#tasklockreleaseoptions)                                    | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [TaskLockReleaseResult](./signatures/migration.md#tasklockreleaseresult)                                      | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [TaskLockState](./signatures/migration.md#tasklockstate)                                                      | type  | [Migrations and task locks](./migration-and-seed.md)         |
| [TextFilterOperators](./signatures/inputs.md#textfilteroperators)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [ThroughFieldsPolicyBuilder](./signatures/policies.md#throughfieldspolicybuilder)                             | type  | [Repository policies](./permissions.md)                      |
| [ThroughPolicyBuilder](./signatures/policies.md#throughpolicybuilder)                                         | type  | [Repository policies](./permissions.md)                      |
| [ThroughWritePolicy](./signatures/policies.md#throughwritepolicy)                                             | type  | [Repository policies](./permissions.md)                      |
| [ThroughWritePolicyBuilder](./signatures/policies.md#throughwritepolicybuilder)                               | type  | [Repository policies](./permissions.md)                      |
| [TimeFilterOperators](./signatures/inputs.md#timefilteroperators)                                             | type  | [Repository inputs and result types](./repository.md)        |
| [TransactionCallbackPhase](./signatures/transactions.md#transactioncallbackphase)                             | type  | [Transactions](./transactions.md)                            |
| [UniqueSelector](./signatures/inputs.md#uniqueselector)                                                       | type  | [Repository inputs and result types](./repository.md)        |
| [UnsupportedCapabilityError](./signatures/drivers.md#unsupportedcapabilityerror)                              | value | [Driver and runtime extension](./driver-extension.md)        |
| [UpdateManyOptions](./signatures/repository.md#updatemanyoptions)                                             | type  | [Repository operations](./repository.md)                     |
| [UpdateManyResult](./signatures/repository.md#updatemanyresult)                                               | type  | [Repository operations](./repository.md)                     |
| [UpdateMutationValues](./signatures/inputs.md#updatemutationvalues)                                           | type  | [Repository inputs and result types](./repository.md)        |
| [UpdateOneOptions](./signatures/repository.md#updateoneoptions)                                               | type  | [Repository operations](./repository.md)                     |
| [UpdateQuery](./signatures/query.md#updatequery)                                                              | type  | [Query and expressions](./query.md)                          |
| [UpdateRelationFieldMutationBuilder](./signatures/inputs.md#updaterelationfieldmutationbuilder)               | type  | [Repository inputs and result types](./repository.md)        |
| [UpdateRelationFieldMutationInput](./signatures/inputs.md#updaterelationfieldmutationinput)                   | type  | [Repository inputs and result types](./repository.md)        |
| [UpdateRelationFieldMutationJsonInput](./signatures/inputs.md#updaterelationfieldmutationjsoninput)           | type  | [Repository inputs and result types](./repository.md)        |
| [UpsertOneOptions](./signatures/repository.md#upsertoneoptions)                                               | type  | [Repository operations](./repository.md)                     |
| [UpsertPhysicalRowOptions](./signatures/drivers.md#upsertphysicalrowoptions)                                  | type  | [Driver and runtime extension](./driver-extension.md)        |
| [UpsertWritePolicy](./signatures/policies.md#upsertwritepolicy)                                               | type  | [Repository policies](./permissions.md)                      |
| [UpsertWritePolicyBuilder](./signatures/policies.md#upsertwritepolicybuilder)                                 | type  | [Repository policies](./permissions.md)                      |
| [UpsertWritePolicyInput](./signatures/policies.md#upsertwritepolicyinput)                                     | type  | [Repository policies](./permissions.md)                      |
| [ValidateMutationOptions](./signatures/repository.md#validatemutationoptions)                                 | type  | [Repository operations](./repository.md)                     |
| [ValuesBuilder](./signatures/inputs.md#valuesbuilder)                                                         | type  | [Repository inputs and result types](./repository.md)        |
| [WriteNode](./signatures/policies.md#writenode)                                                               | type  | [Repository policies](./permissions.md)                      |
| [WritePolicy](./signatures/policies.md#writepolicy)                                                           | type  | [Repository policies](./permissions.md)                      |
| [WritePolicyBuilder](./signatures/policies.md#writepolicybuilder)                                             | type  | [Repository policies](./permissions.md)                      |
| [WritePolicyInput](./signatures/policies.md#writepolicyinput)                                                 | type  | [Repository policies](./permissions.md)                      |
| [WritePolicyNodeBuilder](./signatures/policies.md#writepolicynodebuilder)                                     | type  | [Repository policies](./permissions.md)                      |
| [WritePolicyProblem](./signatures/values.md#writepolicyproblem)                                               | type  | [Value normalization and errors](./errors-and-values.md)     |
| [assertCollectionArtifactDirectoryNames](./signatures/artifacts.md#assertcollectionartifactdirectorynames)    | value | [Collection artifacts](./collection-and-schema.md)           |
| [buildRepositoryPolicy](./signatures/policies.md#buildrepositorypolicy)                                       | value | [Repository policies](./permissions.md)                      |
| [buildUpsertWritePolicy](./signatures/policies.md#buildupsertwritepolicy)                                     | value | [Repository policies](./permissions.md)                      |
| [buildWritePolicy](./signatures/policies.md#buildwritepolicy)                                                 | value | [Repository policies](./permissions.md)                      |
| [createDatabaseManager](./signatures/database-manager.md#createdatabasemanager)                               | value | [DatabaseManager](./database-manager.md)                     |
| [createMigrator](./signatures/migration.md#createmigrator)                                                    | value | [Migrations and task locks](./migration-and-seed.md)         |
| [createSeeder](./signatures/seed.md#createseeder)                                                             | value | [Seeds and sample data](./migration-and-seed.md)             |
| [databaseManagerToken](./signatures/database-manager.md#databasemanagertoken)                                 | value | [DatabaseManager](./database-manager.md)                     |
| [defineCollectionMetadata](./signatures/metadata.md#definecollectionmetadata)                                 | value | [Collection metadata](./collection-and-schema.md)            |
| [defineDatabase](./signatures/database-manager.md#definedatabase)                                             | value | [DatabaseManager](./database-manager.md)                     |
| [defineMigration](./signatures/migration.md#definemigration)                                                  | value | [Migrations and task locks](./migration-and-seed.md)         |
| [defineRepositoryEventMeta](./signatures/events.md#definerepositoryeventmeta)                                 | value | [Repository mutation events](./events.md)                    |
| [defineSeed](./signatures/seed.md#defineseed)                                                                 | value | [Seeds and sample data](./migration-and-seed.md)             |
| [expandPolicyRefs](./signatures/policies.md#expandpolicyrefs)                                                 | value | [Repository policies](./permissions.md)                      |
| [extractLegacyCollectionMetadata](./signatures/metadata.md#extractlegacycollectionmetadata)                   | value | [Collection metadata](./collection-and-schema.md)            |
| [filterOperatorsForFieldType](./signatures/values.md#filteroperatorsforfieldtype)                             | value | [Value normalization and errors](./errors-and-values.md)     |
| [findCollectionArtifactNameConflicts](./signatures/artifacts.md#findcollectionartifactnameconflicts)          | value | [Collection artifacts](./collection-and-schema.md)           |
| [isManagedField](./signatures/values.md#ismanagedfield)                                                       | value | [Value normalization and errors](./errors-and-values.md)     |
| [isSortableFieldType](./signatures/values.md#issortablefieldtype)                                             | value | [Value normalization and errors](./errors-and-values.md)     |
| [isTaskLockBusyError](./signatures/migration.md#istasklockbusyerror)                                          | value | [Migrations and task locks](./migration-and-seed.md)         |
| [isTemporalType](./signatures/values.md#istemporaltype)                                                       | value | [Value normalization and errors](./errors-and-values.md)     |
| [loadMigrations](./signatures/migration.md#loadmigrations)                                                    | value | [Migrations and task locks](./migration-and-seed.md)         |
| [loadSeeds](./signatures/seed.md#loadseeds)                                                                   | value | [Seeds and sample data](./migration-and-seed.md)             |
| [narrowRepositoryPolicy](./signatures/policies.md#narrowrepositorypolicy)                                     | value | [Repository policies](./permissions.md)                      |
| [normalizePhysicalDataType](./signatures/schema.md#normalizephysicaldatatype)                                 | value | [Physical schema inspection](./collection-and-schema.md)     |
| [normalizeReferentialAction](./signatures/schema.md#normalizereferentialaction)                               | value | [Physical schema inspection](./collection-and-schema.md)     |
| [normalizeRepositoryPolicy](./signatures/policies.md#normalizerepositorypolicy)                               | value | [Repository policies](./permissions.md)                      |
| [normalizeTemporalValue](./signatures/values.md#normalizetemporalvalue)                                       | value | [Value normalization and errors](./errors-and-values.md)     |
| [numberValue](./signatures/schema.md#numbervalue)                                                             | value | [Physical schema inspection](./collection-and-schema.md)     |
| [numericCapabilities](./signatures/schema.md#numericcapabilities-1)                                           | value | [Physical schema inspection](./collection-and-schema.md)     |
| [optionalString](./signatures/schema.md#optionalstring)                                                       | value | [Physical schema inspection](./collection-and-schema.md)     |
| [parseColumnDefault](./signatures/schema.md#parsecolumndefault)                                               | value | [Physical schema inspection](./collection-and-schema.md)     |
| [rawRows](./signatures/schema.md#rawrows)                                                                     | value | [Physical schema inspection](./collection-and-schema.md)     |
| [ref](./signatures/policies.md#ref)                                                                           | value | [Repository policies](./permissions.md)                      |
| [repositoryErrorStatuses](./signatures/values.md#repositoryerrorstatuses)                                     | value | [Value normalization and errors](./errors-and-values.md)     |
| [resolveDatabaseDriver](./signatures/drivers.md#resolvedatabasedriver)                                        | value | [Driver and runtime extension](./driver-extension.md)        |
| [serializeCollectionArtifact](./signatures/artifacts.md#serializecollectionartifact)                          | value | [Collection artifacts](./collection-and-schema.md)           |
| [serializeCollectionArtifactManifest](./signatures/artifacts.md#serializecollectionartifactmanifest)          | value | [Collection artifacts](./collection-and-schema.md)           |
| [sqliteAffinity](./signatures/schema.md#sqliteaffinity)                                                       | value | [Physical schema inspection](./collection-and-schema.md)     |
| [supportsFilterShorthand](./signatures/values.md#supportsfiltershorthand)                                     | value | [Value normalization and errors](./errors-and-values.md)     |
| [temporalFractionalSecondsPrecision](./signatures/schema.md#temporalfractionalsecondsprecision)               | value | [Physical schema inspection](./collection-and-schema.md)     |
| [upsertPhysicalRow](./signatures/drivers.md#upsertphysicalrow)                                                | value | [Driver and runtime extension](./driver-extension.md)        |
| [validateCollectionArtifactDirectoryName](./signatures/artifacts.md#validatecollectionartifactdirectoryname)  | value | [Collection artifacts](./collection-and-schema.md)           |
| [validateCollectionMetadataDocument](./signatures/metadata.md#validatecollectionmetadatadocument)             | value | [Collection metadata](./collection-and-schema.md)            |
| [validateMigrations](./signatures/migration.md#validatemigrations)                                            | value | [Migrations and task locks](./migration-and-seed.md)         |
| [validateSeeds](./signatures/seed.md#validateseeds)                                                           | value | [Seeds and sample data](./migration-and-seed.md)             |
| [writableFields](./signatures/values.md#writablefields)                                                       | value | [Value normalization and errors](./errors-and-values.md)     |
| [writePolicyProblems](./signatures/values.md#writepolicyproblems)                                             | value | [Value normalization and errors](./errors-and-values.md)     |

## @nocobase/db/testing

21 exports: 12 values and 9 types.

| Export                                                                                         | Kind  | Topic                               |
| ---------------------------------------------------------------------------------------------- | ----- | ----------------------------------- |
| [CollectionRenameAtomicityError](./signatures/testing.md#collectionrenameatomicityerror)       | value | [Testing entry point](./testing.md) |
| [DatabaseCollectionMetadataStore](./signatures/testing.md#databasecollectionmetadatastore)     | value | [Testing entry point](./testing.md) |
| [DefaultFilterBuilder](./signatures/testing.md#defaultfilterbuilder)                           | value | [Testing entry point](./testing.md) |
| [KnexConnectionConfig](./signatures/testing.md#knexconnectionconfig)                           | type  | [Testing entry point](./testing.md) |
| [ProvisionedTestDatabase](./signatures/testing.md#provisionedtestdatabase)                     | type  | [Testing entry point](./testing.md) |
| [SqlTestDatabaseProvisionerOptions](./signatures/testing.md#sqltestdatabaseprovisioneroptions) | type  | [Testing entry point](./testing.md) |
| [SqlTestDatabaseStatements](./signatures/testing.md#sqltestdatabasestatements)                 | type  | [Testing entry point](./testing.md) |
| [TestDatabaseCloneOptions](./signatures/testing.md#testdatabasecloneoptions)                   | type  | [Testing entry point](./testing.md) |
| [TestDatabaseEnvironment](./signatures/testing.md#testdatabaseenvironment)                     | type  | [Testing entry point](./testing.md) |
| [TestDatabaseListOptions](./signatures/testing.md#testdatabaselistoptions)                     | type  | [Testing entry point](./testing.md) |
| [TestDatabaseProvisionOptions](./signatures/testing.md#testdatabaseprovisionoptions)           | type  | [Testing entry point](./testing.md) |
| [TestDatabaseProvisioner](./signatures/testing.md#testdatabaseprovisioner)                     | type  | [Testing entry point](./testing.md) |
| [attachDatabaseDriverRuntime](./signatures/testing.md#attachdatabasedriverruntime)             | value | [Testing entry point](./testing.md) |
| [compileJsonCondition](./signatures/testing.md#compilejsoncondition)                           | value | [Testing entry point](./testing.md) |
| [createKnexClient](./signatures/testing.md#createknexclient)                                   | value | [Testing entry point](./testing.md) |
| [createSqlTestDatabaseProvisioner](./signatures/testing.md#createsqltestdatabaseprovisioner)   | value | [Testing entry point](./testing.md) |
| [resolveDatabaseCapabilities](./signatures/testing.md#resolvedatabasecapabilities)             | value | [Testing entry point](./testing.md) |
| [resolveKnexConnectionConfig](./signatures/testing.md#resolveknexconnectionconfig)             | value | [Testing entry point](./testing.md) |
| [temporalBinding](./signatures/testing.md#temporalbinding)                                     | value | [Testing entry point](./testing.md) |
| [temporalProjection](./signatures/testing.md#temporalprojection)                               | value | [Testing entry point](./testing.md) |
| [validateJsonCondition](./signatures/testing.md#validatejsoncondition)                         | value | [Testing entry point](./testing.md) |
