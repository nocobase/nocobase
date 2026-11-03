# Repository inputs and result types: signatures

Describe filters, projections, ordering, aggregation, scalar mutations and relation mutations. Builder callbacks receive their builders from repository methods. A type export alone does not provide a runtime constructor or a build function.

[Chapter](../repository.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                   | Access              |
| ----------------------------------------------------------------------------- | ------------------- |
| [AggregateAst](#aggregateast)                                                 | `@nocobase/db` type |
| [AggregateBuilder](#aggregatebuilder)                                         | `@nocobase/db` type |
| [AggregateExpression](#aggregateexpression)                                   | `@nocobase/db` type |
| [AggregateFunction](#aggregatefunction)                                       | `@nocobase/db` type |
| [AggregateNode](#aggregatenode)                                               | `@nocobase/db` type |
| [AggregateOptions](#aggregateoptions)                                         | `@nocobase/db` type |
| [AggregateResult](#aggregateresult)                                           | `@nocobase/db` type |
| [AggregateSelection](#aggregateselection)                                     | `@nocobase/db` type |
| [AggregateSelectionResult](#aggregateselectionresult)                         | `@nocobase/db` type |
| [AnyRelationSelectBuilder](#anyrelationselectbuilder)                         | Supporting contract |
| [AnySelectBuilder](#anyselectbuilder)                                         | Supporting contract |
| [BooleanFilterOperators](#booleanfilteroperators)                             | `@nocobase/db` type |
| [ConnectTarget](#connecttarget)                                               | `@nocobase/db` type |
| [CreateMutationProperty](#createmutationproperty)                             | Supporting contract |
| [CreateMutationValues](#createmutationvalues)                                 | `@nocobase/db` type |
| [CreateRelationFieldMutationBuilder](#createrelationfieldmutationbuilder)     | `@nocobase/db` type |
| [CreateRelationFieldMutationInput](#createrelationfieldmutationinput)         | `@nocobase/db` type |
| [CreateRelationFieldMutationJsonInput](#createrelationfieldmutationjsoninput) | `@nocobase/db` type |
| [CreateTarget](#createtarget)                                                 | `@nocobase/db` type |
| [DateFilterOperators](#datefilteroperators)                                   | `@nocobase/db` type |
| [DynamicUpdateMutationInput](#dynamicupdatemutationinput)                     | `@nocobase/db` type |
| [EmptyFilterOperators](#emptyfilteroperators)                                 | `@nocobase/db` type |
| [FilterAst](#filterast)                                                       | `@nocobase/db` type |
| [FilterBuilder](#filterbuilder)                                               | `@nocobase/db` type |
| [FilterConditionNode](#filterconditionnode)                                   | `@nocobase/db` type |
| [FilterFieldGroup](#filterfieldgroup)                                         | `@nocobase/db` type |
| [FilterGroupNode](#filtergroupnode)                                           | `@nocobase/db` type |
| [FilterLiteral](#filterliteral)                                               | `@nocobase/db` type |
| [FilterNode](#filternode)                                                     | `@nocobase/db` type |
| [FilterOperand](#filteroperand)                                               | `@nocobase/db` type |
| [FilterOperator](#filteroperator)                                             | `@nocobase/db` type |
| [FilterRelationNode](#filterrelationnode)                                     | `@nocobase/db` type |
| [FilterScalar](#filterscalar)                                                 | `@nocobase/db` type |
| [FilterShorthand](#filtershorthand)                                           | `@nocobase/db` type |
| [FilterShorthandValue](#filtershorthandvalue)                                 | `@nocobase/db` type |
| [FilterValue](#filtervalue)                                                   | `@nocobase/db` type |
| [FilterVariable](#filtervariable)                                             | `@nocobase/db` type |
| [GroupByOptions](#groupbyoptions)                                             | `@nocobase/db` type |
| [GroupByResult](#groupbyresult)                                               | `@nocobase/db` type |
| [GroupBySelectionResult](#groupbyselectionresult)                             | `@nocobase/db` type |
| [JsonFilterOperators](#jsonfilteroperators)                                   | `@nocobase/db` type |
| [MergeRelationResults](#mergerelationresults)                                 | Supporting contract |
| [MutationLiteral](#mutationliteral)                                           | `@nocobase/db` type |
| [MutationValueInput](#mutationvalueinput)                                     | `@nocobase/db` type |
| [MutationValuesInput](#mutationvaluesinput)                                   | `@nocobase/db` type |
| [MutationVariable](#mutationvariable)                                         | `@nocobase/db` type |
| [NestedCreateOptions](#nestedcreateoptions)                                   | `@nocobase/db` type |
| [NonEmptyRepositorySort](#nonemptyrepositorysort)                             | `@nocobase/db` type |
| [NonEmptySortAst](#nonemptysortast)                                           | `@nocobase/db` type |
| [NumberFilterOperators](#numberfilteroperators)                               | `@nocobase/db` type |
| [NumericMutationBuilder](#numericmutationbuilder)                             | `@nocobase/db` type |
| [NumericMutationInput](#numericmutationinput)                                 | `@nocobase/db` type |
| [NumericMutationJsonInput](#numericmutationjsoninput)                         | `@nocobase/db` type |
| [NumericMutationOperand](#numericmutationoperand)                             | `@nocobase/db` type |
| [NumericMutationOperandInput](#numericmutationoperandinput)                   | `@nocobase/db` type |
| [NumericMutationOperation](#numericmutationoperation)                         | `@nocobase/db` type |
| [RelationClearNode](#relationclearnode)                                       | `@nocobase/db` type |
| [RelationCombineResult](#relationcombineresult)                               | `@nocobase/db` type |
| [RelationConnectInput](#relationconnectinput)                                 | `@nocobase/db` type |
| [RelationCreateInput](#relationcreateinput)                                   | `@nocobase/db` type |
| [RelationCreateTargetInput](#relationcreatetargetinput)                       | Supporting contract |
| [RelationCreateValues](#relationcreatevalues)                                 | `@nocobase/db` type |
| [RelationCreateValuesInput](#relationcreatevaluesinput)                       | `@nocobase/db` type |
| [RelationDeleteInput](#relationdeleteinput)                                   | `@nocobase/db` type |
| [RelationDeleteInputList](#relationdeleteinputlist)                           | `@nocobase/db` type |
| [RelationDeleteTarget](#relationdeletetarget)                                 | `@nocobase/db` type |
| [RelationFilterOperators](#relationfilteroperators)                           | `@nocobase/db` type |
| [RelationModifyNode](#relationmodifynode)                                     | `@nocobase/db` type |
| [RelationMutationAst](#relationmutationast)                                   | `@nocobase/db` type |
| [RelationMutationNode](#relationmutationnode)                                 | `@nocobase/db` type |
| [RelationPatchNode](#relationpatchnode)                                       | `@nocobase/db` type |
| [RelationReplaceNode](#relationreplacenode)                                   | `@nocobase/db` type |
| [RelationSelectBranchNode](#relationselectbranchnode)                         | `@nocobase/db` type |
| [RelationSelectBuilder](#relationselectbuilder)                               | `@nocobase/db` type |
| [RelationSelectResultNode](#relationselectresultnode)                         | `@nocobase/db` type |
| [RelationSelectionExpression](#relationselectionexpression)                   | `@nocobase/db` type |
| [RelationSetNode](#relationsetnode)                                           | `@nocobase/db` type |
| [RelationTargetSelector](#relationtargetselector)                             | `@nocobase/db` type |
| [RelationTargetSelectorInput](#relationtargetselectorinput)                   | `@nocobase/db` type |
| [RelationUpdateInput](#relationupdateinput)                                   | `@nocobase/db` type |
| [RelationUpdateInputList](#relationupdateinputlist)                           | `@nocobase/db` type |
| [RelationUpdateTarget](#relationupdatetarget)                                 | `@nocobase/db` type |
| [RelationUpdateValues](#relationupdatevalues)                                 | `@nocobase/db` type |
| [RelationUpsertInput](#relationupsertinput)                                   | `@nocobase/db` type |
| [RelationUpsertInputList](#relationupsertinputlist)                           | `@nocobase/db` type |
| [RelationUpsertTarget](#relationupserttarget)                                 | `@nocobase/db` type |
| [RepositoryAggregateNumeric](#repositoryaggregatenumeric)                     | `@nocobase/db` type |
| [RepositoryContext](#repositorycontext)                                       | `@nocobase/db` type |
| [RepositoryCursor](#repositorycursor)                                         | `@nocobase/db` type |
| [RepositoryCursorDirection](#repositorycursordirection)                       | `@nocobase/db` type |
| [RepositoryFilter](#repositoryfilter)                                         | `@nocobase/db` type |
| [RepositoryMutationScalarValue](#repositorymutationscalarvalue)               | `@nocobase/db` type |
| [RepositoryPath](#repositorypath)                                             | `@nocobase/db` type |
| [RepositoryRecord](#repositoryrecord)                                         | `@nocobase/db` type |
| [RepositorySelect](#repositoryselect)                                         | `@nocobase/db` type |
| [RepositorySort](#repositorysort)                                             | `@nocobase/db` type |
| [ScalarCreateValues](#scalarcreatevalues)                                     | `@nocobase/db` type |
| [ScalarUpdateValues](#scalarupdatevalues)                                     | `@nocobase/db` type |
| [SelectAst](#selectast)                                                       | `@nocobase/db` type |
| [SelectBuilder](#selectbuilder)                                               | `@nocobase/db` type |
| [SelectIncludeNode](#selectincludenode)                                       | `@nocobase/db` type |
| [SelectNode](#selectnode)                                                     | `@nocobase/db` type |
| [SelectedBuilderRecord](#selectedbuilderrecord)                               | Supporting contract |
| [SortAggregateBuilder](#sortaggregatebuilder)                                 | `@nocobase/db` type |
| [SortAggregateNode](#sortaggregatenode)                                       | `@nocobase/db` type |
| [SortAst](#sortast)                                                           | `@nocobase/db` type |
| [SortBuilder](#sortbuilder)                                                   | `@nocobase/db` type |
| [SortDirection](#sortdirection)                                               | `@nocobase/db` type |
| [SortExpression](#sortexpression)                                             | `@nocobase/db` type |
| [SortFieldBuilder](#sortfieldbuilder)                                         | `@nocobase/db` type |
| [SortFieldNode](#sortfieldnode)                                               | `@nocobase/db` type |
| [SortNode](#sortnode)                                                         | `@nocobase/db` type |
| [SortNullsBuilder](#sortnullsbuilder)                                         | `@nocobase/db` type |
| [SortNullsPosition](#sortnullsposition)                                       | `@nocobase/db` type |
| [SortRelationBuilder](#sortrelationbuilder)                                   | `@nocobase/db` type |
| [StringFilterOperators](#stringfilteroperators)                               | `@nocobase/db` type |
| [StringFilterOptions](#stringfilteroptions)                                   | `@nocobase/db` type |
| [TextFilterOperators](#textfilteroperators)                                   | `@nocobase/db` type |
| [TimeFilterOperators](#timefilteroperators)                                   | `@nocobase/db` type |
| [UniqueSelector](#uniqueselector)                                             | `@nocobase/db` type |
| [UpdateMutationProperty](#updatemutationproperty)                             | Supporting contract |
| [UpdateMutationValues](#updatemutationvalues)                                 | `@nocobase/db` type |
| [UpdateRelationFieldMutationBuilder](#updaterelationfieldmutationbuilder)     | `@nocobase/db` type |
| [UpdateRelationFieldMutationInput](#updaterelationfieldmutationinput)         | `@nocobase/db` type |
| [UpdateRelationFieldMutationJsonInput](#updaterelationfieldmutationjsoninput) | `@nocobase/db` type |
| [ValuesBuilder](#valuesbuilder)                                               | `@nocobase/db` type |
| [aggregateExpressionType](#aggregateexpressiontype)                           | Supporting contract |
| [relationSelectionType](#relationselectiontype)                               | Supporting contract |
| [selectBuilderState](#selectbuilderstate)                                     | Supporting contract |

## AggregateAst

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateAst } from '@nocobase/db'`.

```ts
export interface AggregateAst {
  readonly kind: 'aggregate';
  readonly version: 1;
  readonly collection?: string;
  readonly items: readonly AggregateNode[];
}
```

Related declarations: [AggregateNode](./inputs.md#aggregatenode).

## AggregateBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateBuilder } from '@nocobase/db'`.

```ts
export interface AggregateBuilder<TRecord extends object = RepositoryRecord> {
  count(field?: keyof TRecord & string): AggregateExpression<number>;
  sum(
    field: keyof TRecord & string,
  ): AggregateExpression<RepositoryAggregateNumeric | null>;
  avg(
    field: keyof TRecord & string,
  ): AggregateExpression<RepositoryAggregateNumeric | null>;
  min<TKey extends keyof TRecord & string>(
    field: TKey,
  ): AggregateExpression<TRecord[TKey] | null>;
  max<TKey extends keyof TRecord & string>(
    field: TKey,
  ): AggregateExpression<TRecord[TKey] | null>;
}
```

Related declarations: [AggregateExpression](./inputs.md#aggregateexpression), [RepositoryAggregateNumeric](./inputs.md#repositoryaggregatenumeric), [RepositoryRecord](./inputs.md#repositoryrecord).

## AggregateExpression

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateExpression } from '@nocobase/db'`.

```ts
export interface AggregateExpression<T = unknown> {
  readonly kind: 'aggregateExpression';
  readonly [aggregateExpressionType]?: T;
}
```

Related declarations: [aggregateExpressionType](./inputs.md#aggregateexpressiontype).

## AggregateFunction

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateFunction } from '@nocobase/db'`.

```ts
export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';
```

## AggregateNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateNode } from '@nocobase/db'`.

```ts
export type AggregateNode =
  | {
      readonly kind: 'count';
      readonly alias: string;
      readonly field?: string;
    }
  | {
      readonly kind: Exclude<AggregateFunction, 'count'>;
      readonly alias: string;
      readonly field: string;
    };
```

Related declarations: [AggregateFunction](./inputs.md#aggregatefunction).

## AggregateOptions

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateOptions } from '@nocobase/db'`.

```ts
export interface AggregateOptions<TRecord extends object> {
  readonly filter?: RepositoryFilter<TRecord>;
  readonly aggregate:
    | AggregateAst
    | ((aggregate: AggregateBuilder<TRecord>) => AggregateSelection);
  readonly context?: RepositoryContext;
}
```

Related declarations: [AggregateAst](./inputs.md#aggregateast), [AggregateBuilder](./inputs.md#aggregatebuilder), [AggregateSelection](./inputs.md#aggregateselection), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryFilter](./inputs.md#repositoryfilter).

## AggregateResult

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateResult } from '@nocobase/db'`.

```ts
export type AggregateResult = Readonly<
  Record<string, RepositoryMutationScalarValue>
>;
```

Related declarations: [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## AggregateSelection

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateSelection } from '@nocobase/db'`.

```ts
export type AggregateSelection = Readonly<
  Record<string, AggregateExpression<unknown>>
>;
```

Related declarations: [AggregateExpression](./inputs.md#aggregateexpression).

## AggregateSelectionResult

[Source](../../../../repository-input/src/types.ts)

Import: `import type { AggregateSelectionResult } from '@nocobase/db'`.

```ts
export type AggregateSelectionResult<TSelection extends AggregateSelection> = {
  readonly [
    TKey in keyof TSelection
  ]: TSelection[TKey] extends AggregateExpression<infer TValue>
    ? TValue
    : never;
};
```

Related declarations: [AggregateExpression](./inputs.md#aggregateexpression), [AggregateSelection](./inputs.md#aggregateselection).

## AnyRelationSelectBuilder

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type AnyRelationSelectBuilder<TRecord extends object> =
  RelationSelectBuilder<TRecord, keyof TRecord, boolean, boolean, object>;
```

Related declarations: [RelationSelectBuilder](./inputs.md#relationselectbuilder).

## AnySelectBuilder

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type AnySelectBuilder<TRecord extends object> = SelectBuilder<
  TRecord,
  keyof TRecord,
  boolean,
  boolean,
  object
>;
```

Related declarations: [SelectBuilder](./inputs.md#selectbuilder).

## BooleanFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { BooleanFilterOperators } from '@nocobase/db'`.

```ts
export interface BooleanFilterOperators extends EmptyFilterOperators {
  isTrue(): FilterConditionNode;
  isFalse(): FilterConditionNode;
}
```

Related declarations: [EmptyFilterOperators](./inputs.md#emptyfilteroperators), [FilterConditionNode](./inputs.md#filterconditionnode).

## ConnectTarget

[Source](../../../../repository-input/src/types.ts)

Import: `import type { ConnectTarget } from '@nocobase/db'`.

```ts
export interface ConnectTarget {
  readonly kind: 'connect';
  readonly by: UniqueSelector;
  readonly through?: RepositoryRecord;
}
```

Related declarations: [RepositoryRecord](./inputs.md#repositoryrecord), [UniqueSelector](./inputs.md#uniqueselector).

## CreateMutationProperty

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
type CreateMutationProperty<T> = unknown extends T
  ? RepositoryMutationScalarValue | CreateRelationFieldMutationInput
  : T extends object
    ? T | CreateRelationFieldMutationInput
    : T;
```

Related declarations: [CreateRelationFieldMutationInput](./inputs.md#createrelationfieldmutationinput), [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## CreateMutationValues

[Source](../../../../repository-input/src/types.ts)

Import: `import type { CreateMutationValues } from '@nocobase/db'`.

```ts
export type CreateMutationValues<TCreate extends object> = {
  readonly [TKey in keyof TCreate]:
    | CreateMutationProperty<TCreate[TKey]>
    | MutationVariable
    | MutationLiteral<TCreate[TKey]>;
};
```

Related declarations: [CreateMutationProperty](./inputs.md#createmutationproperty), [MutationLiteral](./inputs.md#mutationliteral), [MutationVariable](./inputs.md#mutationvariable).

## CreateRelationFieldMutationBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { CreateRelationFieldMutationBuilder } from '@nocobase/db'`.

```ts
export interface CreateRelationFieldMutationBuilder {
  create(values: RelationCreateValues, options?: NestedCreateOptions): this;
  connect(
    values: RelationTargetSelector,
    options?: Pick<NestedCreateOptions, 'through'>,
  ): this;
}
```

Related declarations: [NestedCreateOptions](./inputs.md#nestedcreateoptions), [RelationCreateValues](./inputs.md#relationcreatevalues), [RelationTargetSelector](./inputs.md#relationtargetselector).

## CreateRelationFieldMutationInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { CreateRelationFieldMutationInput } from '@nocobase/db'`.

```ts
export type CreateRelationFieldMutationInput =
  | CreateRelationFieldMutationJsonInput
  | ((
      relation: CreateRelationFieldMutationBuilder,
    ) => CreateRelationFieldMutationBuilder);
```

Related declarations: [CreateRelationFieldMutationBuilder](./inputs.md#createrelationfieldmutationbuilder), [CreateRelationFieldMutationJsonInput](./inputs.md#createrelationfieldmutationjsoninput).

## CreateRelationFieldMutationJsonInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { CreateRelationFieldMutationJsonInput } from '@nocobase/db'`.

```ts
export interface CreateRelationFieldMutationJsonInput {
  readonly create?: RelationCreateValuesInput;
  readonly connect?: RelationTargetSelectorInput;
}
```

Related declarations: [RelationCreateValuesInput](./inputs.md#relationcreatevaluesinput), [RelationTargetSelectorInput](./inputs.md#relationtargetselectorinput).

## CreateTarget

[Source](../../../../repository-input/src/types.ts)

Import: `import type { CreateTarget } from '@nocobase/db'`.

```ts
export interface CreateTarget {
  readonly kind: 'create';
  readonly clientKey?: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly relations?: RelationMutationAst;
  readonly through?: RepositoryRecord;
}
```

Related declarations: [RelationMutationAst](./inputs.md#relationmutationast), [RepositoryRecord](./inputs.md#repositoryrecord).

## DateFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { DateFilterOperators } from '@nocobase/db'`.

```ts
export interface DateFilterOperators extends EmptyFilterOperators {
  on(value: FilterOperand<string | Date>): FilterConditionNode;
  notOn(value: FilterOperand<string | Date>): FilterConditionNode;
  before(value: FilterOperand<string | Date>): FilterConditionNode;
  after(value: FilterOperand<string | Date>): FilterConditionNode;
  notBefore(value: FilterOperand<string | Date>): FilterConditionNode;
  notAfter(value: FilterOperand<string | Date>): FilterConditionNode;
  between(
    value: readonly [
      FilterOperand<string | Date>,
      FilterOperand<string | Date>,
    ],
  ): FilterConditionNode;
}
```

Related declarations: [EmptyFilterOperators](./inputs.md#emptyfilteroperators), [FilterConditionNode](./inputs.md#filterconditionnode), [FilterOperand](./inputs.md#filteroperand).

## DynamicUpdateMutationInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { DynamicUpdateMutationInput } from '@nocobase/db'`.

Collection metadata determines the callback's scalar or relation capabilities at runtime.

```ts
/** Collection metadata determines the callback's scalar or relation capabilities at runtime. */
export type DynamicUpdateMutationInput =
  | RepositoryMutationScalarValue
  | MutationVariable
  | MutationLiteral
  | UpdateRelationFieldMutationJsonInput
  | NumericMutationJsonInput
  | ((
      value: UpdateRelationFieldMutationBuilder & NumericMutationBuilder,
    ) => UpdateRelationFieldMutationBuilder | NumericMutationJsonInput);
```

Related declarations: [MutationLiteral](./inputs.md#mutationliteral), [MutationVariable](./inputs.md#mutationvariable), [NumericMutationBuilder](./inputs.md#numericmutationbuilder), [NumericMutationJsonInput](./inputs.md#numericmutationjsoninput), [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue), [UpdateRelationFieldMutationBuilder](./inputs.md#updaterelationfieldmutationbuilder), [UpdateRelationFieldMutationJsonInput](./inputs.md#updaterelationfieldmutationjsoninput).

## EmptyFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { EmptyFilterOperators } from '@nocobase/db'`.

```ts
export interface EmptyFilterOperators {
  empty(): FilterConditionNode;
  notEmpty(): FilterConditionNode;
}
```

Related declarations: [FilterConditionNode](./inputs.md#filterconditionnode).

## FilterAst

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterAst } from '@nocobase/db'`.

```ts
export interface FilterAst {
  readonly kind: 'filter';
  readonly version: 1;
  readonly collection?: string;
  readonly root: FilterGroupNode;
}
```

Related declarations: [FilterGroupNode](./inputs.md#filtergroupnode).

## FilterBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterBuilder } from '@nocobase/db'`.

```ts
export interface FilterBuilder<_TRecord extends object = RepositoryRecord> {
  and(items: readonly FilterNode[]): FilterGroupNode;
  or(items: readonly FilterNode[]): FilterGroupNode;
  variable(path: string): FilterVariable;
  string(path: string | RepositoryPath): StringFilterOperators;
  text(path: string | RepositoryPath): TextFilterOperators;
  number(path: string | RepositoryPath): NumberFilterOperators;
  date(path: string | RepositoryPath): DateFilterOperators;
  time(path: string | RepositoryPath): TimeFilterOperators;
  boolean(path: string | RepositoryPath): BooleanFilterOperators;
  json(path: string | RepositoryPath): JsonFilterOperators;
  relation<TTarget extends object = RepositoryRecord>(
    path: string | RepositoryPath,
  ): RelationFilterOperators<TTarget>;
}
```

Related declarations: [BooleanFilterOperators](./inputs.md#booleanfilteroperators), [DateFilterOperators](./inputs.md#datefilteroperators), [FilterGroupNode](./inputs.md#filtergroupnode), [FilterNode](./inputs.md#filternode), [FilterVariable](./inputs.md#filtervariable), [JsonFilterOperators](./inputs.md#jsonfilteroperators), [NumberFilterOperators](./inputs.md#numberfilteroperators), [RelationFilterOperators](./inputs.md#relationfilteroperators), [RepositoryPath](./inputs.md#repositorypath), [RepositoryRecord](./inputs.md#repositoryrecord), [StringFilterOperators](./inputs.md#stringfilteroperators), [TextFilterOperators](./inputs.md#textfilteroperators), [TimeFilterOperators](./inputs.md#timefilteroperators).

## FilterConditionNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterConditionNode } from '@nocobase/db'`.

```ts
export interface FilterConditionNode {
  readonly kind: 'condition';
  readonly path: RepositoryPath;
  readonly operator: FilterOperator;
  readonly value?: FilterValue;
  readonly mode?: 'default' | 'insensitive';
  readonly jsonPath?: readonly (string | number)[];
}
```

Related declarations: [FilterOperator](./inputs.md#filteroperator), [FilterValue](./inputs.md#filtervalue), [RepositoryPath](./inputs.md#repositorypath).

## FilterFieldGroup

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterFieldGroup } from '@nocobase/db'`.

```ts
export type FilterFieldGroup =
  'string' | 'text' | 'number' | 'date' | 'time' | 'boolean' | 'json';
```

## FilterGroupNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterGroupNode } from '@nocobase/db'`.

```ts
export interface FilterGroupNode {
  readonly kind: 'group';
  readonly logic: 'and' | 'or';
  readonly items: readonly FilterNode[];
}
```

Related declarations: [FilterNode](./inputs.md#filternode).

## FilterLiteral

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterLiteral } from '@nocobase/db'`.

```ts
export type FilterLiteral =
  | FilterScalar
  | readonly FilterLiteral[]
  | {
      readonly [key: string]: FilterLiteral;
    };
```

Related declarations: [FilterScalar](./inputs.md#filterscalar).

## FilterNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterNode } from '@nocobase/db'`.

```ts
export type FilterNode =
  FilterGroupNode | FilterConditionNode | FilterRelationNode;
```

Related declarations: [FilterConditionNode](./inputs.md#filterconditionnode), [FilterGroupNode](./inputs.md#filtergroupnode), [FilterRelationNode](./inputs.md#filterrelationnode).

## FilterOperand

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterOperand } from '@nocobase/db'`.

```ts
export type FilterOperand<T> = T | FilterVariable;
```

Related declarations: [FilterVariable](./inputs.md#filtervariable).

## FilterOperator

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterOperator } from '@nocobase/db'`.

```ts
export type FilterOperator =
  | '$jsonEq'
  | '$jsonNe'
  | '$jsonHas'
  | '$jsonHasSome'
  | '$jsonHasEvery'
  | '$jsonEmpty'
  | '$jsonNotEmpty'
  | '$jsonDbNull'
  | '$jsonNull'
  | '$jsonAnyNull'
  | '$includes'
  | '$notIncludes'
  | '$startsWith'
  | '$endsWith'
  | '$eq'
  | '$ne'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$empty'
  | '$notEmpty'
  | '$dateOn'
  | '$dateNotOn'
  | '$dateBefore'
  | '$dateAfter'
  | '$dateNotBefore'
  | '$dateNotAfter'
  | '$dateBetween'
  | '$isTruly'
  | '$isFalsy';
```

## FilterRelationNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterRelationNode } from '@nocobase/db'`.

```ts
export interface FilterRelationNode {
  readonly kind: 'relation';
  readonly path: RepositoryPath;
  readonly quantifier:
    'exists' | 'notExists' | 'some' | 'none' | 'empty' | 'notEmpty';
  readonly filter?: FilterGroupNode;
}
```

Related declarations: [FilterGroupNode](./inputs.md#filtergroupnode), [RepositoryPath](./inputs.md#repositorypath).

## FilterScalar

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterScalar } from '@nocobase/db'`.

```ts
export type FilterScalar = string | number | boolean | null;
```

## FilterShorthand

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterShorthand } from '@nocobase/db'`.

```ts
export type FilterShorthand<TRecord extends object> = Readonly<
  Partial<{
    [TKey in keyof TRecord]: FilterShorthandValue;
  }>
>;
```

Related declarations: [FilterShorthandValue](./inputs.md#filtershorthandvalue).

## FilterShorthandValue

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterShorthandValue } from '@nocobase/db'`.

```ts
export type FilterShorthandValue = string | number | boolean | null;
```

## FilterValue

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterValue } from '@nocobase/db'`.

```ts
export type FilterValue =
  FilterLiteral | FilterVariable | readonly (FilterLiteral | FilterVariable)[];
```

Related declarations: [FilterLiteral](./inputs.md#filterliteral), [FilterVariable](./inputs.md#filtervariable).

## FilterVariable

[Source](../../../../repository-input/src/types.ts)

Import: `import type { FilterVariable } from '@nocobase/db'`.

```ts
export interface FilterVariable {
  readonly kind: 'variable';
  readonly path: string;
}
```

## GroupByOptions

[Source](../../../../repository-input/src/types.ts)

Import: `import type { GroupByOptions } from '@nocobase/db'`.

```ts
export interface GroupByOptions<
  TRecord extends object,
  TResult extends object = RepositoryRecord,
> {
  readonly by: readonly [keyof TRecord & string, ...(keyof TRecord & string)[]];
  readonly aggregate:
    | AggregateAst
    | ((aggregate: AggregateBuilder<TRecord>) => AggregateSelection);
  readonly filter?: RepositoryFilter<TRecord>;
  readonly having?: RepositoryFilter<TResult>;
  readonly sort?: RepositorySort<TResult>;
  readonly context?: RepositoryContext;
}
```

Related declarations: [AggregateAst](./inputs.md#aggregateast), [AggregateBuilder](./inputs.md#aggregatebuilder), [AggregateSelection](./inputs.md#aggregateselection), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySort](./inputs.md#repositorysort).

## GroupByResult

[Source](../../../../repository-input/src/types.ts)

Import: `import type { GroupByResult } from '@nocobase/db'`.

```ts
export type GroupByResult = Readonly<
  Record<string, RepositoryMutationScalarValue>
>;
```

Related declarations: [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## GroupBySelectionResult

[Source](../../../../repository-input/src/types.ts)

Import: `import type { GroupBySelectionResult } from '@nocobase/db'`.

```ts
export type GroupBySelectionResult<
  TRecord extends object,
  TBy extends readonly (keyof TRecord & string)[],
  TSelection extends AggregateSelection,
> = Readonly<Pick<TRecord, TBy[number]>> & AggregateSelectionResult<TSelection>;
```

Related declarations: [AggregateSelection](./inputs.md#aggregateselection), [AggregateSelectionResult](./inputs.md#aggregateselectionresult).

## JsonFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { JsonFilterOperators } from '@nocobase/db'`.

```ts
export interface JsonFilterOperators {
  path(path: readonly (string | number)[]): JsonFilterOperators;
  eq(value: FilterOperand<FilterLiteral>): FilterConditionNode;
  ne(value: FilterOperand<FilterLiteral>): FilterConditionNode;
  has(value: FilterOperand<FilterScalar>): FilterConditionNode;
  hasSome(value: FilterOperand<readonly FilterScalar[]>): FilterConditionNode;
  hasEvery(value: FilterOperand<readonly FilterScalar[]>): FilterConditionNode;
  isEmpty(): FilterConditionNode;
  isNotEmpty(): FilterConditionNode;
  isDbNull(): FilterConditionNode;
  isJsonNull(): FilterConditionNode;
  isAnyNull(): FilterConditionNode;
}
```

Related declarations: [FilterConditionNode](./inputs.md#filterconditionnode), [FilterLiteral](./inputs.md#filterliteral), [FilterOperand](./inputs.md#filteroperand), [FilterScalar](./inputs.md#filterscalar).

## MergeRelationResults

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
type MergeRelationResults<TRecord, TRelations> = keyof TRelations extends never
  ? TRecord
  : Omit<TRecord, keyof TRelations> & TRelations;
```

## MutationLiteral

[Source](../../../../repository-input/src/types.ts)

Import: `import type { MutationLiteral } from '@nocobase/db'`.

```ts
export type MutationLiteral<T = RepositoryMutationScalarValue> = {
  readonly kind: 'literal';
  readonly value: T;
};
```

Related declarations: [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## MutationValueInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { MutationValueInput } from '@nocobase/db'`.

```ts
export type MutationValueInput<T> = T | MutationVariable | MutationLiteral<T>;
```

Related declarations: [MutationLiteral](./inputs.md#mutationliteral), [MutationVariable](./inputs.md#mutationvariable).

## MutationValuesInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { MutationValuesInput } from '@nocobase/db'`.

```ts
export type MutationValuesInput<T> = T | ((values: ValuesBuilder) => T);
```

Related declarations: [ValuesBuilder](./inputs.md#valuesbuilder).

## MutationVariable

[Source](../../../../repository-input/src/types.ts)

Import: `import type { MutationVariable } from '@nocobase/db'`.

```ts
export type MutationVariable = {
  readonly [K in keyof FilterVariable]: FilterVariable[K];
};
```

Related declarations: [FilterVariable](./inputs.md#filtervariable).

## NestedCreateOptions

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NestedCreateOptions } from '@nocobase/db'`.

```ts
export interface NestedCreateOptions {
  readonly clientKey?: string;
  readonly through?: RepositoryRecord;
}
```

Related declarations: [RepositoryRecord](./inputs.md#repositoryrecord).

## NonEmptyRepositorySort

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NonEmptyRepositorySort } from '@nocobase/db'`.

```ts
export type NonEmptyRepositorySort<TRecord extends object> =
  | NonEmptySortAst
  | ((
      sort: SortBuilder<TRecord>,
    ) => SortExpression | readonly [SortExpression, ...SortExpression[]]);
```

Related declarations: [NonEmptySortAst](./inputs.md#nonemptysortast), [SortBuilder](./inputs.md#sortbuilder), [SortExpression](./inputs.md#sortexpression).

## NonEmptySortAst

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NonEmptySortAst } from '@nocobase/db'`.

```ts
export interface NonEmptySortAst extends SortAst {
  readonly items: readonly [SortNode, ...SortNode[]];
}
```

Related declarations: [SortAst](./inputs.md#sortast), [SortNode](./inputs.md#sortnode).

## NumberFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumberFilterOperators } from '@nocobase/db'`.

```ts
export interface NumberFilterOperators extends EmptyFilterOperators {
  eq(value: FilterOperand<number | string | null>): FilterConditionNode;
  ne(value: FilterOperand<number | string | null>): FilterConditionNode;
  gt(value: FilterOperand<number | string>): FilterConditionNode;
  gte(value: FilterOperand<number | string>): FilterConditionNode;
  lt(value: FilterOperand<number | string>): FilterConditionNode;
  lte(value: FilterOperand<number | string>): FilterConditionNode;
}
```

Related declarations: [EmptyFilterOperators](./inputs.md#emptyfilteroperators), [FilterConditionNode](./inputs.md#filterconditionnode), [FilterOperand](./inputs.md#filteroperand).

## NumericMutationBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumericMutationBuilder } from '@nocobase/db'`.

```ts
export interface NumericMutationBuilder {
  increment(value: NumericMutationOperandInput): NumericMutationJsonInput;
  decrement(value: NumericMutationOperandInput): NumericMutationJsonInput;
  multiply(value: NumericMutationOperandInput): NumericMutationJsonInput;
  divide(value: NumericMutationOperandInput): NumericMutationJsonInput;
}
```

Related declarations: [NumericMutationJsonInput](./inputs.md#numericmutationjsoninput), [NumericMutationOperandInput](./inputs.md#numericmutationoperandinput).

## NumericMutationInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumericMutationInput } from '@nocobase/db'`.

```ts
export type NumericMutationInput =
  | NumericMutationJsonInput
  | ((value: NumericMutationBuilder) => NumericMutationJsonInput);
```

Related declarations: [NumericMutationBuilder](./inputs.md#numericmutationbuilder), [NumericMutationJsonInput](./inputs.md#numericmutationjsoninput).

## NumericMutationJsonInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumericMutationJsonInput } from '@nocobase/db'`.

```ts
export type NumericMutationJsonInput = {
  [TOperation in NumericMutationOperation]: Readonly<
    Record<TOperation, NumericMutationOperandInput> &
      Partial<Record<Exclude<NumericMutationOperation, TOperation>, never>>
  >;
}[NumericMutationOperation];
```

Related declarations: [NumericMutationOperandInput](./inputs.md#numericmutationoperandinput), [NumericMutationOperation](./inputs.md#numericmutationoperation).

## NumericMutationOperand

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumericMutationOperand } from '@nocobase/db'`.

```ts
export type NumericMutationOperand = number | bigint | string;
```

## NumericMutationOperandInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumericMutationOperandInput } from '@nocobase/db'`.

```ts
export type NumericMutationOperandInput =
  MutationValueInput<NumericMutationOperand>;
```

Related declarations: [MutationValueInput](./inputs.md#mutationvalueinput), [NumericMutationOperand](./inputs.md#numericmutationoperand).

## NumericMutationOperation

[Source](../../../../repository-input/src/types.ts)

Import: `import type { NumericMutationOperation } from '@nocobase/db'`.

```ts
export type NumericMutationOperation =
  'increment' | 'decrement' | 'multiply' | 'divide';
```

## RelationClearNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationClearNode } from '@nocobase/db'`.

```ts
export interface RelationClearNode {
  readonly kind: 'relation';
  readonly field: string;
  readonly action: 'clear';
}
```

## RelationCombineResult

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationCombineResult } from '@nocobase/db'`.

```ts
export type RelationCombineResult<TRecord extends object, TBranches> = {
  readonly [
    K in keyof TBranches
  ]: TBranches[K] extends RelationSelectionExpression<infer T>
    ? T
    : TBranches[K] extends AnySelectBuilder<TRecord>
      ? SelectedBuilderRecord<TRecord, TBranches[K]>[]
      : never;
};
```

Related declarations: [AnySelectBuilder](./inputs.md#anyselectbuilder), [RelationSelectionExpression](./inputs.md#relationselectionexpression), [SelectedBuilderRecord](./inputs.md#selectedbuilderrecord).

## RelationConnectInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationConnectInput } from '@nocobase/db'`.

```ts
export type RelationConnectInput = {
  readonly where: RelationTargetSelector;
  readonly through: RepositoryRecord;
};
```

Related declarations: [RelationTargetSelector](./inputs.md#relationtargetselector), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationCreateInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationCreateInput } from '@nocobase/db'`.

```ts
export type RelationCreateInput =
  | RelationCreateTargetInput
  | {
      readonly values: RelationCreateValues;
      readonly through: RepositoryRecord;
    };
```

Related declarations: [RelationCreateTargetInput](./inputs.md#relationcreatetargetinput), [RelationCreateValues](./inputs.md#relationcreatevalues), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationCreateTargetInput

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface RelationCreateTargetInput {
  readonly kind: 'relationCreate';
  readonly version: 1;
  readonly values: RelationCreateValues;
  readonly clientKey?: string;
  readonly through?: RepositoryRecord;
}
```

Related declarations: [RelationCreateValues](./inputs.md#relationcreatevalues), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationCreateValues

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationCreateValues } from '@nocobase/db'`.

```ts
export type RelationCreateValues = Readonly<
  Record<
    string,
    | RepositoryMutationScalarValue
    | MutationVariable
    | MutationLiteral
    | CreateRelationFieldMutationInput
  >
>;
```

Related declarations: [CreateRelationFieldMutationInput](./inputs.md#createrelationfieldmutationinput), [MutationLiteral](./inputs.md#mutationliteral), [MutationVariable](./inputs.md#mutationvariable), [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## RelationCreateValuesInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationCreateValuesInput } from '@nocobase/db'`.

```ts
export type RelationCreateValuesInput =
  | RelationCreateValues
  | RelationCreateInput
  | readonly (RelationCreateValues | RelationCreateInput)[];
```

Related declarations: [RelationCreateInput](./inputs.md#relationcreateinput), [RelationCreateValues](./inputs.md#relationcreatevalues).

## RelationDeleteInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationDeleteInput } from '@nocobase/db'`.

```ts
export interface RelationDeleteInput {
  readonly filter?: RepositoryFilter<RepositoryRecord>;
}
```

Related declarations: [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationDeleteInputList

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationDeleteInputList } from '@nocobase/db'`.

```ts
export type RelationDeleteInputList =
  RelationDeleteInput | readonly RelationDeleteInput[];
```

Related declarations: [RelationDeleteInput](./inputs.md#relationdeleteinput).

## RelationDeleteTarget

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationDeleteTarget } from '@nocobase/db'`.

```ts
export interface RelationDeleteTarget {
  readonly filter?: FilterAst;
}
```

Related declarations: [FilterAst](./inputs.md#filterast).

## RelationFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationFilterOperators } from '@nocobase/db'`.

```ts
export interface RelationFilterOperators<TTarget extends object> {
  some(
    callback: (filter: FilterBuilder<TTarget>) => FilterNode,
  ): FilterRelationNode;
  none(
    callback: (filter: FilterBuilder<TTarget>) => FilterNode,
  ): FilterRelationNode;
  exists(): FilterRelationNode;
  notExists(): FilterRelationNode;
  empty(): FilterRelationNode;
  notEmpty(): FilterRelationNode;
}
```

Related declarations: [FilterBuilder](./inputs.md#filterbuilder), [FilterNode](./inputs.md#filternode), [FilterRelationNode](./inputs.md#filterrelationnode).

## RelationModifyNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationModifyNode } from '@nocobase/db'`.

```ts
export interface RelationModifyNode {
  readonly kind: 'relation';
  readonly field: string;
  readonly action: 'modify';
  readonly update?: RelationUpdateTarget;
  readonly upsert?: RelationUpsertTarget;
  readonly delete?: RelationDeleteTarget;
}
```

Related declarations: [RelationDeleteTarget](./inputs.md#relationdeletetarget), [RelationUpdateTarget](./inputs.md#relationupdatetarget), [RelationUpsertTarget](./inputs.md#relationupserttarget).

## RelationMutationAst

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationMutationAst } from '@nocobase/db'`.

```ts
export interface RelationMutationAst {
  readonly kind: 'relationMutation';
  readonly version: 1;
  readonly collection?: string;
  readonly items: readonly RelationMutationNode[];
}
```

Related declarations: [RelationMutationNode](./inputs.md#relationmutationnode).

## RelationMutationNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationMutationNode } from '@nocobase/db'`.

```ts
export type RelationMutationNode =
  | RelationSetNode
  | RelationClearNode
  | RelationPatchNode
  | RelationReplaceNode
  | RelationModifyNode;
```

Related declarations: [RelationClearNode](./inputs.md#relationclearnode), [RelationModifyNode](./inputs.md#relationmodifynode), [RelationPatchNode](./inputs.md#relationpatchnode), [RelationReplaceNode](./inputs.md#relationreplacenode), [RelationSetNode](./inputs.md#relationsetnode).

## RelationPatchNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationPatchNode } from '@nocobase/db'`.

```ts
export interface RelationPatchNode {
  readonly kind: 'relation';
  readonly field: string;
  readonly action: 'patch';
  readonly connect?: readonly ConnectTarget[];
  readonly create?: readonly CreateTarget[];
  readonly disconnect?: readonly UniqueSelector[];
  readonly update?: readonly RelationUpdateTarget[];
  readonly upsert?: readonly RelationUpsertTarget[];
  readonly delete?: readonly RelationDeleteTarget[];
}
```

Related declarations: [ConnectTarget](./inputs.md#connecttarget), [CreateTarget](./inputs.md#createtarget), [RelationDeleteTarget](./inputs.md#relationdeletetarget), [RelationUpdateTarget](./inputs.md#relationupdatetarget), [RelationUpsertTarget](./inputs.md#relationupserttarget), [UniqueSelector](./inputs.md#uniqueselector).

## RelationReplaceNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationReplaceNode } from '@nocobase/db'`.

```ts
export interface RelationReplaceNode {
  readonly kind: 'relation';
  readonly field: string;
  readonly action: 'replace';
  readonly targets: readonly (ConnectTarget | CreateTarget)[];
}
```

Related declarations: [ConnectTarget](./inputs.md#connecttarget), [CreateTarget](./inputs.md#createtarget).

## RelationSelectBranchNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationSelectBranchNode } from '@nocobase/db'`.

```ts
export interface RelationSelectBranchNode {
  readonly select: SelectNode;
  readonly filter?: FilterAst;
  readonly sort?: SortAst;
  readonly limit?: number;
  readonly cursor?: RepositoryCursor;
  readonly direction?: RepositoryCursorDirection;
  readonly distinct?: readonly string[];
  readonly result?: RelationSelectResultNode;
}
```

Related declarations: [FilterAst](./inputs.md#filterast), [RelationSelectResultNode](./inputs.md#relationselectresultnode), [RepositoryCursor](./inputs.md#repositorycursor), [RepositoryCursorDirection](./inputs.md#repositorycursordirection), [SelectNode](./inputs.md#selectnode), [SortAst](./inputs.md#sortast).

## RelationSelectBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationSelectBuilder } from '@nocobase/db'`.

```ts
export interface RelationSelectBuilder<
  TRecord extends object = RepositoryRecord,
  TSelectedKeys extends keyof TRecord = never,
  THasFields extends boolean = false,
  THasIncludes extends boolean = false,
  TRelationResults extends object = Record<never, never>,
> extends SelectBuilder<
  TRecord,
  TSelectedKeys,
  THasFields,
  THasIncludes,
  TRelationResults
> {
  fields<const TFields extends readonly (keyof TRecord & string)[]>(
    ...fields: TFields
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys | TFields[number],
    true,
    THasIncludes,
    TRelationResults
  >;
  include<const TName extends string, TResult>(
    relation: TName,
    callback: (
      select: RelationSelectBuilder,
    ) => RelationSelectionExpression<TResult>,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults & Record<TName, TResult>
  >;
  include<TTarget extends object = RepositoryRecord>(
    relation: string,
    callback?: (
      select: RelationSelectBuilder<TTarget>,
    ) =>
      AnyRelationSelectBuilder<TTarget> | RelationSelectionExpression<unknown>,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    true,
    TRelationResults
  >;
  filter(
    filter: RepositoryFilter<TRecord>,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults
  >;
  sort(
    sort: RepositorySort<TRecord>,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults
  >;
  limit(
    limit: number,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults
  >;
  cursor(
    cursor: RepositoryCursor<TRecord>,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults
  >;
  direction(
    direction: RepositoryCursorDirection,
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults
  >;
  distinct(
    fields: readonly (keyof TRecord & string)[],
  ): RelationSelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults
  >;
  count(field?: keyof TRecord & string): RelationSelectionExpression<number>;
  sum(
    field: keyof TRecord & string,
  ): RelationSelectionExpression<RepositoryAggregateNumeric | null>;
  avg(
    field: keyof TRecord & string,
  ): RelationSelectionExpression<RepositoryAggregateNumeric | null>;
  min<TKey extends keyof TRecord & string>(
    field: TKey,
  ): RelationSelectionExpression<TRecord[TKey] | null>;
  max<TKey extends keyof TRecord & string>(
    field: TKey,
  ): RelationSelectionExpression<TRecord[TKey] | null>;
  combine<
    const TBranches extends Readonly<
      Record<
        string,
        AnyRelationSelectBuilder<TRecord> | RelationSelectionExpression<unknown>
      >
    >,
  >(
    branches: TBranches,
  ): RelationSelectionExpression<RelationCombineResult<TRecord, TBranches>>;
}
```

Related declarations: [AnyRelationSelectBuilder](./inputs.md#anyrelationselectbuilder), [RelationCombineResult](./inputs.md#relationcombineresult), [RelationSelectionExpression](./inputs.md#relationselectionexpression), [RepositoryAggregateNumeric](./inputs.md#repositoryaggregatenumeric), [RepositoryCursor](./inputs.md#repositorycursor), [RepositoryCursorDirection](./inputs.md#repositorycursordirection), [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySort](./inputs.md#repositorysort), [SelectBuilder](./inputs.md#selectbuilder).

## RelationSelectResultNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationSelectResultNode } from '@nocobase/db'`.

```ts
export type RelationSelectResultNode =
  | {
      readonly kind: 'count';
      readonly field?: string;
    }
  | {
      readonly kind: 'sum' | 'avg' | 'min' | 'max';
      readonly field: string;
    }
  | {
      readonly kind: 'combine';
      readonly branches: Readonly<Record<string, RelationSelectBranchNode>>;
    };
```

Related declarations: [RelationSelectBranchNode](./inputs.md#relationselectbranchnode).

## RelationSelectionExpression

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationSelectionExpression } from '@nocobase/db'`.

```ts
export interface RelationSelectionExpression<T> {
  readonly kind: 'relationSelectionExpression';
  readonly [relationSelectionType]?: T;
}
```

Related declarations: [relationSelectionType](./inputs.md#relationselectiontype).

## RelationSetNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationSetNode } from '@nocobase/db'`.

```ts
export interface RelationSetNode {
  readonly kind: 'relation';
  readonly field: string;
  readonly action: 'set';
  readonly target: ConnectTarget | CreateTarget;
}
```

Related declarations: [ConnectTarget](./inputs.md#connecttarget), [CreateTarget](./inputs.md#createtarget).

## RelationTargetSelector

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationTargetSelector } from '@nocobase/db'`.

```ts
export type RelationTargetSelector = Readonly<Record<string, unknown>>;
```

## RelationTargetSelectorInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationTargetSelectorInput } from '@nocobase/db'`.

```ts
export type RelationTargetSelectorInput =
  | RelationTargetSelector
  | RelationConnectInput
  | readonly (RelationTargetSelector | RelationConnectInput)[];
```

Related declarations: [RelationConnectInput](./inputs.md#relationconnectinput), [RelationTargetSelector](./inputs.md#relationtargetselector).

## RelationUpdateInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpdateInput } from '@nocobase/db'`.

```ts
export interface RelationUpdateInput {
  readonly filter?: RepositoryFilter<RepositoryRecord>;
  readonly values: RelationUpdateValues;
}
```

Related declarations: [RelationUpdateValues](./inputs.md#relationupdatevalues), [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationUpdateInputList

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpdateInputList } from '@nocobase/db'`.

```ts
export type RelationUpdateInputList =
  RelationUpdateInput | readonly RelationUpdateInput[];
```

Related declarations: [RelationUpdateInput](./inputs.md#relationupdateinput).

## RelationUpdateTarget

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpdateTarget } from '@nocobase/db'`.

```ts
export interface RelationUpdateTarget {
  readonly filter?: FilterAst;
  readonly values: Readonly<Record<string, unknown>>;
  readonly relations?: RelationMutationAst;
}
```

Related declarations: [FilterAst](./inputs.md#filterast), [RelationMutationAst](./inputs.md#relationmutationast).

## RelationUpdateValues

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpdateValues } from '@nocobase/db'`.

```ts
export type RelationUpdateValues = Readonly<
  Record<string, DynamicUpdateMutationInput>
>;
```

Related declarations: [DynamicUpdateMutationInput](./inputs.md#dynamicupdatemutationinput).

## RelationUpsertInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpsertInput } from '@nocobase/db'`.

```ts
export interface RelationUpsertInput {
  readonly filter?: RepositoryFilter<RepositoryRecord>;
  readonly create: RelationCreateValues;
  readonly update: RelationUpdateValues;
}
```

Related declarations: [RelationCreateValues](./inputs.md#relationcreatevalues), [RelationUpdateValues](./inputs.md#relationupdatevalues), [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationUpsertInputList

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpsertInputList } from '@nocobase/db'`.

```ts
export type RelationUpsertInputList =
  RelationUpsertInput | readonly RelationUpsertInput[];
```

Related declarations: [RelationUpsertInput](./inputs.md#relationupsertinput).

## RelationUpsertTarget

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RelationUpsertTarget } from '@nocobase/db'`.

```ts
export interface RelationUpsertTarget {
  readonly filter?: FilterAst;
  readonly by?: UniqueSelector;
  readonly create: CreateTarget;
  readonly update: RelationUpdateTarget;
}
```

Related declarations: [CreateTarget](./inputs.md#createtarget), [FilterAst](./inputs.md#filterast), [RelationUpdateTarget](./inputs.md#relationupdatetarget), [UniqueSelector](./inputs.md#uniqueselector).

## RepositoryAggregateNumeric

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryAggregateNumeric } from '@nocobase/db'`.

```ts
export type RepositoryAggregateNumeric = string | number;
```

## RepositoryContext

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryContext } from '@nocobase/db'`.

```ts
export type RepositoryContext = Readonly<Record<string, unknown>>;
```

## RepositoryCursor

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryCursor } from '@nocobase/db'`.

```ts
export type RepositoryCursor<TRecord extends object = RepositoryRecord> =
  Readonly<Partial<TRecord>>;
```

Related declarations: [RepositoryRecord](./inputs.md#repositoryrecord).

## RepositoryCursorDirection

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryCursorDirection } from '@nocobase/db'`.

```ts
export type RepositoryCursorDirection = 'forward' | 'backward';
```

## RepositoryFilter

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryFilter } from '@nocobase/db'`.

```ts
export type RepositoryFilter<TRecord extends object> =
  | FilterShorthand<TRecord>
  | FilterAst
  | ((filter: FilterBuilder<TRecord>) => FilterNode);
```

Related declarations: [FilterAst](./inputs.md#filterast), [FilterBuilder](./inputs.md#filterbuilder), [FilterNode](./inputs.md#filternode), [FilterShorthand](./inputs.md#filtershorthand).

## RepositoryMutationScalarValue

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryMutationScalarValue } from '@nocobase/db'`.

```ts
export type RepositoryMutationScalarValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | Date
  | Uint8Array
  | Readonly<Record<string, unknown>>
  | readonly unknown[];
```

## RepositoryPath

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryPath } from '@nocobase/db'`.

```ts
export type RepositoryPath = readonly string[];
```

## RepositoryRecord

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositoryRecord } from '@nocobase/db'`.

```ts
export type RepositoryRecord = Record<string, RepositoryMutationScalarValue>;
```

Related declarations: [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## RepositorySelect

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositorySelect } from '@nocobase/db'`.

```ts
export type RepositorySelect<TRecord extends object> =
  SelectAst | ((select: SelectBuilder<TRecord>) => AnySelectBuilder<TRecord>);
```

Related declarations: [AnySelectBuilder](./inputs.md#anyselectbuilder), [SelectAst](./inputs.md#selectast), [SelectBuilder](./inputs.md#selectbuilder).

## RepositorySort

[Source](../../../../repository-input/src/types.ts)

Import: `import type { RepositorySort } from '@nocobase/db'`.

```ts
export type RepositorySort<TRecord extends object> =
  | SortAst
  | ((
      sort: SortBuilder<TRecord>,
    ) => SortExpression | readonly SortExpression[]);
```

Related declarations: [SortAst](./inputs.md#sortast), [SortBuilder](./inputs.md#sortbuilder), [SortExpression](./inputs.md#sortexpression).

## ScalarCreateValues

[Source](../../../../repository-input/src/types.ts)

Import: `import type { ScalarCreateValues } from '@nocobase/db'`.

```ts
export type ScalarCreateValues<T extends object> = {
  readonly [K in keyof T]: MutationValueInput<T[K]>;
};
```

Related declarations: [MutationValueInput](./inputs.md#mutationvalueinput).

## ScalarUpdateValues

[Source](../../../../repository-input/src/types.ts)

Import: `import type { ScalarUpdateValues } from '@nocobase/db'`.

```ts
export type ScalarUpdateValues<TUpdate extends object> = {
  readonly [TKey in keyof TUpdate]:
    | MutationValueInput<TUpdate[TKey]>
    | (unknown extends TUpdate[TKey]
        ? NumericMutationInput
        : NonNullable<TUpdate[TKey]> extends number | bigint | string
          ? NumericMutationInput
          : never);
};
```

Related declarations: [MutationValueInput](./inputs.md#mutationvalueinput), [NumericMutationInput](./inputs.md#numericmutationinput).

## SelectAst

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SelectAst } from '@nocobase/db'`.

```ts
export interface SelectAst {
  readonly kind: 'select';
  readonly version: 1;
  readonly collection?: string;
  readonly root: SelectNode;
}
```

Related declarations: [SelectNode](./inputs.md#selectnode).

## SelectBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SelectBuilder } from '@nocobase/db'`.

```ts
export interface SelectBuilder<
  TRecord extends object = RepositoryRecord,
  TSelectedKeys extends keyof TRecord = never,
  THasFields extends boolean = false,
  THasIncludes extends boolean = false,
  TRelationResults extends object = Record<never, never>,
> {
  readonly [selectBuilderState]?: {
    readonly selectedKeys: TSelectedKeys;
    readonly hasFields: THasFields;
    readonly hasIncludes: THasIncludes;
    readonly relationResults: TRelationResults;
  };
  fields<const TFields extends readonly (keyof TRecord & string)[]>(
    ...fields: TFields
  ): SelectBuilder<
    TRecord,
    TSelectedKeys | TFields[number],
    true,
    THasIncludes,
    TRelationResults
  >;
  include<const TName extends string, TResult>(
    relation: TName,
    callback: (
      select: RelationSelectBuilder,
    ) => RelationSelectionExpression<TResult>,
  ): SelectBuilder<
    TRecord,
    TSelectedKeys,
    THasFields,
    THasIncludes,
    TRelationResults & Record<TName, TResult>
  >;
  include<TTarget extends object = RepositoryRecord>(
    relation: string,
    callback?: (
      select: RelationSelectBuilder<TTarget>,
    ) =>
      AnyRelationSelectBuilder<TTarget> | RelationSelectionExpression<unknown>,
  ): SelectBuilder<TRecord, TSelectedKeys, THasFields, true, TRelationResults>;
}
```

Related declarations: [AnyRelationSelectBuilder](./inputs.md#anyrelationselectbuilder), [RelationSelectBuilder](./inputs.md#relationselectbuilder), [RelationSelectionExpression](./inputs.md#relationselectionexpression), [RepositoryRecord](./inputs.md#repositoryrecord), [selectBuilderState](./inputs.md#selectbuilderstate).

## SelectIncludeNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SelectIncludeNode } from '@nocobase/db'`.

```ts
export interface SelectIncludeNode extends RelationSelectBranchNode {
  readonly kind: 'include';
  readonly relation: string;
}
```

Related declarations: [RelationSelectBranchNode](./inputs.md#relationselectbranchnode).

## SelectNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SelectNode } from '@nocobase/db'`.

```ts
export interface SelectNode {
  readonly kind: 'selection';
  readonly fields?: readonly string[];
  readonly includes?: readonly SelectIncludeNode[];
}
```

Related declarations: [SelectIncludeNode](./inputs.md#selectincludenode).

## SelectedBuilderRecord

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type SelectedBuilderRecord<
  TRecord extends object,
  TSelection extends AnySelectBuilder<TRecord>,
> =
  TSelection extends SelectBuilder<
    TRecord,
    infer TSelectedKeys,
    infer THasFields,
    infer THasIncludes,
    infer TRelationResults
  >
    ? THasIncludes extends true
      ? MergeRelationResults<TRecord, TRelationResults>
      : THasFields extends true
        ? MergeRelationResults<Pick<TRecord, TSelectedKeys>, TRelationResults>
        : MergeRelationResults<TRecord, TRelationResults>
    : TRecord;
```

Related declarations: [AnySelectBuilder](./inputs.md#anyselectbuilder), [MergeRelationResults](./inputs.md#mergerelationresults), [SelectBuilder](./inputs.md#selectbuilder).

## SortAggregateBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortAggregateBuilder } from '@nocobase/db'`.

```ts
export interface SortAggregateBuilder {
  asc(): SortNullsBuilder;
  desc(): SortNullsBuilder;
}
```

Related declarations: [SortNullsBuilder](./inputs.md#sortnullsbuilder).

## SortAggregateNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortAggregateNode } from '@nocobase/db'`.

```ts
export type SortAggregateNode =
  | {
      readonly kind: 'aggregate';
      readonly relation: RepositoryPath;
      readonly aggregate: 'count';
      readonly field?: never;
      readonly direction: SortDirection;
      readonly nulls?: SortNullsPosition;
    }
  | {
      readonly kind: 'aggregate';
      readonly relation: RepositoryPath;
      readonly aggregate: 'sum' | 'avg' | 'min' | 'max';
      readonly field: string;
      readonly direction: SortDirection;
      readonly nulls?: SortNullsPosition;
    };
```

Related declarations: [RepositoryPath](./inputs.md#repositorypath), [SortDirection](./inputs.md#sortdirection), [SortNullsPosition](./inputs.md#sortnullsposition).

## SortAst

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortAst } from '@nocobase/db'`.

```ts
export interface SortAst {
  readonly kind: 'sort';
  readonly version: 1;
  readonly collection?: string;
  readonly items: readonly SortNode[];
}
```

Related declarations: [SortNode](./inputs.md#sortnode).

## SortBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortBuilder } from '@nocobase/db'`.

```ts
export interface SortBuilder<_TRecord extends object = RepositoryRecord> {
  field(path: string | RepositoryPath): SortFieldBuilder;
  relation(path: string | RepositoryPath): SortRelationBuilder;
}
```

Related declarations: [RepositoryPath](./inputs.md#repositorypath), [RepositoryRecord](./inputs.md#repositoryrecord), [SortFieldBuilder](./inputs.md#sortfieldbuilder), [SortRelationBuilder](./inputs.md#sortrelationbuilder).

## SortDirection

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortDirection } from '@nocobase/db'`.

```ts
export type SortDirection = 'asc' | 'desc';
```

## SortExpression

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortExpression } from '@nocobase/db'`.

```ts
export interface SortExpression {
  readonly kind: 'sortExpression';
}
```

## SortFieldBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortFieldBuilder } from '@nocobase/db'`.

```ts
export interface SortFieldBuilder {
  asc(): SortNullsBuilder;
  desc(): SortNullsBuilder;
}
```

Related declarations: [SortNullsBuilder](./inputs.md#sortnullsbuilder).

## SortFieldNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortFieldNode } from '@nocobase/db'`.

```ts
export interface SortFieldNode {
  readonly kind: 'field';
  readonly path: RepositoryPath;
  readonly direction: SortDirection;
  readonly nulls?: SortNullsPosition;
}
```

Related declarations: [RepositoryPath](./inputs.md#repositorypath), [SortDirection](./inputs.md#sortdirection), [SortNullsPosition](./inputs.md#sortnullsposition).

## SortNode

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortNode } from '@nocobase/db'`.

```ts
export type SortNode = SortFieldNode | SortAggregateNode;
```

Related declarations: [SortAggregateNode](./inputs.md#sortaggregatenode), [SortFieldNode](./inputs.md#sortfieldnode).

## SortNullsBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortNullsBuilder } from '@nocobase/db'`.

```ts
export interface SortNullsBuilder extends SortExpression {
  nullsFirst(): SortExpression;
  nullsLast(): SortExpression;
}
```

Related declarations: [SortExpression](./inputs.md#sortexpression).

## SortNullsPosition

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortNullsPosition } from '@nocobase/db'`.

```ts
export type SortNullsPosition = 'first' | 'last';
```

## SortRelationBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { SortRelationBuilder } from '@nocobase/db'`.

```ts
export interface SortRelationBuilder {
  count(): SortAggregateBuilder;
  sum(field: string): SortAggregateBuilder;
  avg(field: string): SortAggregateBuilder;
  min(field: string): SortAggregateBuilder;
  max(field: string): SortAggregateBuilder;
}
```

Related declarations: [SortAggregateBuilder](./inputs.md#sortaggregatebuilder).

## StringFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { StringFilterOperators } from '@nocobase/db'`.

```ts
export interface StringFilterOperators extends EmptyFilterOperators {
  includes(
    value: FilterOperand<string>,
    options?: StringFilterOptions,
  ): FilterConditionNode;
  notIncludes(
    value: FilterOperand<string>,
    options?: StringFilterOptions,
  ): FilterConditionNode;
  startsWith(
    value: FilterOperand<string>,
    options?: StringFilterOptions,
  ): FilterConditionNode;
  endsWith(
    value: FilterOperand<string>,
    options?: StringFilterOptions,
  ): FilterConditionNode;
  eq(
    value: FilterOperand<string | null>,
    options?: StringFilterOptions,
  ): FilterConditionNode;
  ne(
    value: FilterOperand<string | null>,
    options?: StringFilterOptions,
  ): FilterConditionNode;
}
```

Related declarations: [EmptyFilterOperators](./inputs.md#emptyfilteroperators), [FilterConditionNode](./inputs.md#filterconditionnode), [FilterOperand](./inputs.md#filteroperand), [StringFilterOptions](./inputs.md#stringfilteroptions).

## StringFilterOptions

[Source](../../../../repository-input/src/types.ts)

Import: `import type { StringFilterOptions } from '@nocobase/db'`.

```ts
export interface StringFilterOptions {
  readonly mode?: 'default' | 'insensitive';
}
```

## TextFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { TextFilterOperators } from '@nocobase/db'`.

```ts
export type TextFilterOperators = StringFilterOperators;
```

Related declarations: [StringFilterOperators](./inputs.md#stringfilteroperators).

## TimeFilterOperators

[Source](../../../../repository-input/src/types.ts)

Import: `import type { TimeFilterOperators } from '@nocobase/db'`.

```ts
export interface TimeFilterOperators extends EmptyFilterOperators {
  eq(value: FilterOperand<string | null>): FilterConditionNode;
  ne(value: FilterOperand<string | null>): FilterConditionNode;
}
```

Related declarations: [EmptyFilterOperators](./inputs.md#emptyfilteroperators), [FilterConditionNode](./inputs.md#filterconditionnode), [FilterOperand](./inputs.md#filteroperand).

## UniqueSelector

[Source](../../../../repository-input/src/types.ts)

Import: `import type { UniqueSelector } from '@nocobase/db'`.

```ts
export interface UniqueSelector {
  readonly kind: 'unique';
  readonly fields: readonly string[];
  readonly values: Readonly<Record<string, unknown>>;
}
```

## UpdateMutationProperty

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
type UpdateMutationProperty<T> = RepositoryMutationScalarValue extends T
  ? DynamicUpdateMutationInput
  : [NonNullable<T>] extends [object]
    ? T | UpdateRelationFieldMutationInput
    : NonNullable<T> extends number | bigint | string
      ? T | NumericMutationInput
      : T;
```

Related declarations: [DynamicUpdateMutationInput](./inputs.md#dynamicupdatemutationinput), [NumericMutationInput](./inputs.md#numericmutationinput), [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue), [UpdateRelationFieldMutationInput](./inputs.md#updaterelationfieldmutationinput).

## UpdateMutationValues

[Source](../../../../repository-input/src/types.ts)

Import: `import type { UpdateMutationValues } from '@nocobase/db'`.

```ts
export type UpdateMutationValues<TUpdate extends object> = {
  readonly [TKey in keyof TUpdate]:
    | UpdateMutationProperty<TUpdate[TKey]>
    | MutationVariable
    | MutationLiteral<TUpdate[TKey]>;
};
```

Related declarations: [MutationLiteral](./inputs.md#mutationliteral), [MutationVariable](./inputs.md#mutationvariable), [UpdateMutationProperty](./inputs.md#updatemutationproperty).

## UpdateRelationFieldMutationBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { UpdateRelationFieldMutationBuilder } from '@nocobase/db'`.

```ts
export interface UpdateRelationFieldMutationBuilder extends CreateRelationFieldMutationBuilder {
  disconnect(values?: RelationTargetSelector): this;
  set(values: readonly RelationTargetSelector[]): this;
  update(input: RelationUpdateInput): this;
  upsert(input: RelationUpsertInput): this;
  delete(input?: RelationDeleteInput): this;
}
```

Related declarations: [CreateRelationFieldMutationBuilder](./inputs.md#createrelationfieldmutationbuilder), [RelationDeleteInput](./inputs.md#relationdeleteinput), [RelationTargetSelector](./inputs.md#relationtargetselector), [RelationUpdateInput](./inputs.md#relationupdateinput), [RelationUpsertInput](./inputs.md#relationupsertinput).

## UpdateRelationFieldMutationInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { UpdateRelationFieldMutationInput } from '@nocobase/db'`.

```ts
export type UpdateRelationFieldMutationInput =
  | UpdateRelationFieldMutationJsonInput
  | ((
      relation: UpdateRelationFieldMutationBuilder,
    ) => UpdateRelationFieldMutationBuilder);
```

Related declarations: [UpdateRelationFieldMutationBuilder](./inputs.md#updaterelationfieldmutationbuilder), [UpdateRelationFieldMutationJsonInput](./inputs.md#updaterelationfieldmutationjsoninput).

## UpdateRelationFieldMutationJsonInput

[Source](../../../../repository-input/src/types.ts)

Import: `import type { UpdateRelationFieldMutationJsonInput } from '@nocobase/db'`.

```ts
export type UpdateRelationFieldMutationJsonInput =
  | {
      readonly set: readonly RelationTargetSelector[];
      readonly create?: never;
      readonly connect?: never;
      readonly disconnect?: never;
      readonly update?: never;
      readonly upsert?: never;
      readonly delete?: never;
    }
  | {
      readonly set?: never;
      readonly create?: RelationCreateValuesInput;
      readonly connect?: RelationTargetSelectorInput;
      readonly disconnect?: true | RelationTargetSelectorInput;
      readonly update?: RelationUpdateInputList;
      readonly upsert?: RelationUpsertInputList;
      readonly delete?: true | RelationDeleteInputList;
    };
```

Related declarations: [RelationCreateValuesInput](./inputs.md#relationcreatevaluesinput), [RelationDeleteInputList](./inputs.md#relationdeleteinputlist), [RelationTargetSelector](./inputs.md#relationtargetselector), [RelationTargetSelectorInput](./inputs.md#relationtargetselectorinput), [RelationUpdateInputList](./inputs.md#relationupdateinputlist), [RelationUpsertInputList](./inputs.md#relationupsertinputlist).

## ValuesBuilder

[Source](../../../../repository-input/src/types.ts)

Import: `import type { ValuesBuilder } from '@nocobase/db'`.

```ts
export interface ValuesBuilder {
  variable(path: string): MutationVariable;
  literal<T extends RepositoryMutationScalarValue>(
    value: T,
  ): MutationLiteral<T>;
}
```

Related declarations: [MutationLiteral](./inputs.md#mutationliteral), [MutationVariable](./inputs.md#mutationvariable), [RepositoryMutationScalarValue](./inputs.md#repositorymutationscalarvalue).

## aggregateExpressionType

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
declare const aggregateExpressionType: unique symbol;
```

## relationSelectionType

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
declare const relationSelectionType: unique symbol;
```

## selectBuilderState

[Source](../../../../repository-input/src/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
declare const selectBuilderState: unique symbol;
```
