# Repository policies: signatures

Bind read/create/update/delete permissions, normalize policies, narrow them and expand explicit read references. Row scopes, field allowlists, relation rules and create defaults have distinct roles. Method-level writePolicy is an additional write restriction.

[Chapter](../permissions.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                           | Access               |
| --------------------------------------------------------------------- | -------------------- |
| [CreateNode](#createnode)                                             | `@nocobase/db` type  |
| [CreatePolicyNodeBuilder](#createpolicynodebuilder)                   | `@nocobase/db` type  |
| [DatabaseScope](#databasescope)                                       | `@nocobase/db` type  |
| [DatabaseScopePolicies](#databasescopepolicies)                       | `@nocobase/db` type  |
| [DeleteNode](#deletenode)                                             | `@nocobase/db` type  |
| [DeletePolicyNodeBuilder](#deletepolicynodebuilder)                   | `@nocobase/db` type  |
| [FieldWritePolicy](#fieldwritepolicy)                                 | `@nocobase/db` type  |
| [FieldWritePolicyBuilder](#fieldwritepolicybuilder)                   | `@nocobase/db` type  |
| [FieldWritePolicyInput](#fieldwritepolicyinput)                       | `@nocobase/db` type  |
| [NormalizedCreateNode](#normalizedcreatenode)                         | `@nocobase/db` type  |
| [NormalizedDeleteNode](#normalizeddeletenode)                         | `@nocobase/db` type  |
| [NormalizedReadNode](#normalizedreadnode)                             | `@nocobase/db` type  |
| [NormalizedRelationShapeNode](#normalizedrelationshapenode)           | `@nocobase/db` type  |
| [NormalizedRelationWriteNode](#normalizedrelationwritenode)           | `@nocobase/db` type  |
| [NormalizedRepositoryPolicy](#normalizedrepositorypolicy)             | `@nocobase/db` type  |
| [NormalizedThroughNode](#normalizedthroughnode)                       | `@nocobase/db` type  |
| [NormalizedWriteNode](#normalizedwritenode)                           | `@nocobase/db` type  |
| [PartialReadNode](#partialreadnode)                                   | `@nocobase/db` type  |
| [PartialRepositoryPolicy](#partialrepositorypolicy)                   | `@nocobase/db` type  |
| [PolicyRecord](#policyrecord)                                         | `@nocobase/db` type  |
| [PolicyRef](#policyref)                                               | `@nocobase/db` type  |
| [PolicyScalarValue](#policyscalarvalue)                               | `@nocobase/db` type  |
| [PolicyScope](#policyscope)                                           | `@nocobase/db` type  |
| [ReadNode](#readnode)                                                 | `@nocobase/db` type  |
| [ReadPolicyNodeBuilder](#readpolicynodebuilder)                       | `@nocobase/db` type  |
| [RelationCreateNode](#relationcreatenode)                             | `@nocobase/db` type  |
| [RelationCreateShapePolicyBuilder](#relationcreateshapepolicybuilder) | `@nocobase/db` type  |
| [RelationCreateWritePolicy](#relationcreatewritepolicy)               | `@nocobase/db` type  |
| [RelationCreateWritePolicyBuilder](#relationcreatewritepolicybuilder) | `@nocobase/db` type  |
| [RelationPolicyNodeBuilder](#relationpolicynodebuilder)               | `@nocobase/db` type  |
| [RelationShapeNode](#relationshapenode)                               | `@nocobase/db` type  |
| [RelationShapePolicyBuilder](#relationshapepolicybuilder)             | `@nocobase/db` type  |
| [RelationUpsertPolicyBuilder](#relationupsertpolicybuilder)           | `@nocobase/db` type  |
| [RelationWriteNode](#relationwritenode)                               | `@nocobase/db` type  |
| [RelationWriteOperation](#relationwriteoperation)                     | `@nocobase/db` type  |
| [RelationWritePolicy](#relationwritepolicy)                           | `@nocobase/db` type  |
| [RelationWritePolicyBuilder](#relationwritepolicybuilder)             | `@nocobase/db` type  |
| [RepositoryOperations](#repositoryoperations)                         | `@nocobase/db` type  |
| [RepositoryPolicy](#repositorypolicy)                                 | `@nocobase/db` type  |
| [RepositoryPolicyBuilder](#repositorypolicybuilder)                   | `@nocobase/db` type  |
| [ScopedDatabaseConnection](#scopeddatabaseconnection)                 | `@nocobase/db` type  |
| [ScopedRepository](#scopedrepository)                                 | `@nocobase/db` type  |
| [ThroughFieldsPolicyBuilder](#throughfieldspolicybuilder)             | `@nocobase/db` type  |
| [ThroughNode](#throughnode)                                           | Supporting contract  |
| [ThroughPolicyBuilder](#throughpolicybuilder)                         | `@nocobase/db` type  |
| [ThroughWritePolicy](#throughwritepolicy)                             | `@nocobase/db` type  |
| [ThroughWritePolicyBuilder](#throughwritepolicybuilder)               | `@nocobase/db` type  |
| [UpsertWritePolicy](#upsertwritepolicy)                               | `@nocobase/db` type  |
| [UpsertWritePolicyBuilder](#upsertwritepolicybuilder)                 | `@nocobase/db` type  |
| [UpsertWritePolicyInput](#upsertwritepolicyinput)                     | `@nocobase/db` type  |
| [WriteNode](#writenode)                                               | `@nocobase/db` type  |
| [WritePolicy](#writepolicy)                                           | `@nocobase/db` type  |
| [WritePolicyBuilder](#writepolicybuilder)                             | `@nocobase/db` type  |
| [WritePolicyInput](#writepolicyinput)                                 | `@nocobase/db` type  |
| [WritePolicyNodeBuilder](#writepolicynodebuilder)                     | `@nocobase/db` type  |
| [buildRepositoryPolicy](#buildrepositorypolicy)                       | `@nocobase/db` value |
| [buildUpsertWritePolicy](#buildupsertwritepolicy)                     | `@nocobase/db` value |
| [buildWritePolicy](#buildwritepolicy)                                 | `@nocobase/db` value |
| [expandPolicyRefs](#expandpolicyrefs)                                 | `@nocobase/db` value |
| [narrowRepositoryPolicy](#narrowrepositorypolicy)                     | `@nocobase/db` value |
| [normalizeRepositoryPolicy](#normalizerepositorypolicy)               | `@nocobase/db` value |
| [ref](#ref)                                                           | `@nocobase/db` value |

## CreateNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { CreateNode } from '@nocobase/db'`.

```ts
export interface CreateNode<
  TRecord extends object = RepositoryRecord,
> extends WriteNode<TRecord> {
  readonly defaults?: Readonly<Record<string, PolicyScalarValue>>;
}
```

Related declarations: [PolicyScalarValue](./policies.md#policyscalarvalue), [RepositoryRecord](./inputs.md#repositoryrecord), [WriteNode](./policies.md#writenode).

## CreatePolicyNodeBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { CreatePolicyNodeBuilder } from '@nocobase/db'`.

```ts
export interface CreatePolicyNodeBuilder<
  TRecord extends object = RepositoryRecord,
> extends WritePolicyNodeBuilder<TRecord> {
  /** Values the server assigns. A caller-supplied field of the same name wins. */
  defaults(values: Readonly<Record<string, PolicyScalarValue>>): this;
}
```

Related declarations: [PolicyScalarValue](./policies.md#policyscalarvalue), [RepositoryRecord](./inputs.md#repositoryrecord), [WritePolicyNodeBuilder](./policies.md#writepolicynodebuilder).

## DatabaseScope

[Source](../../../src/database/scope.ts)

Import: `import type { DatabaseScope } from '@nocobase/db'`.

Repository access limited to an explicit policy map, created by connection.restrict(). This is not a DatabaseConnection: it exposes no raw client, query builder, schema management, connection lifecycle, or mutation subscriptions. Relations follow the originating repository's policy; a target collection's entry is reused only through an explicit read policy ref().

```ts
/**
 * Repository access limited to an explicit policy map, created by connection.restrict().
 *
 * This is not a DatabaseConnection: it exposes no raw client, query builder,
 * schema management, connection lifecycle, or mutation subscriptions.
 * Relations follow the originating repository's policy; a target collection's
 * entry is reused only through an explicit read policy ref().
 */
export interface DatabaseScope<TCollection extends string = string> {
  /**
   * Access a collection covered by this scope, or throw POLICY_REQUIRED.
   * Records are partial because policy field allowlists can omit properties.
   */
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: TCollection,
  ): ScopedRepository<Partial<TRecord>, TCreate, TUpdate>;
  /** Run a transaction or savepoint with the same policy bindings. */
  transaction<T>(
    fn: (scope: DatabaseScope<TCollection>) => Promise<T>,
  ): Promise<T>;
  /** Uses the underlying connection's outermost-commit callback semantics. */
  afterCommit(callback: () => void | Promise<void>): void;
  /** Uses the underlying connection's transaction/savepoint rollback semantics. */
  afterRollback(callback: (error: unknown) => void | Promise<void>): void;
  /** A detached snapshot of the policies in force, by collection name. */
  explainPolicies(): Readonly<Record<TCollection, NormalizedRepositoryPolicy>>;
}
```

Related declarations: [NormalizedRepositoryPolicy](./policies.md#normalizedrepositorypolicy), [RepositoryRecord](./inputs.md#repositoryrecord), [ScopedRepository](./policies.md#scopedrepository).

## DatabaseScopePolicies

[Source](../../../src/database/scope.ts)

Import: `import type { DatabaseScopePolicies } from '@nocobase/db'`.

Policies evaluated once for one principal when a database scope is created.

```ts
/** Policies evaluated once for one principal when a database scope is created. */
export type DatabaseScopePolicies<
  P,
  TCollection extends string = string,
> = Readonly<
  Record<TCollection, RepositoryPolicy | ((principal: P) => RepositoryPolicy)>
>;
```

Related declarations: [RepositoryPolicy](./policies.md#repositorypolicy).

## DeleteNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { DeleteNode } from '@nocobase/db'`.

```ts
export interface DeleteNode<TRecord extends object = RepositoryRecord> {
  readonly scope: true | PolicyScope<TRecord>;
}
```

Related declarations: [PolicyScope](./policies.md#policyscope), [RepositoryRecord](./inputs.md#repositoryrecord).

## DeletePolicyNodeBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { DeletePolicyNodeBuilder } from '@nocobase/db'`.

```ts
export interface DeletePolicyNodeBuilder<
  TRecord extends object = RepositoryRecord,
> {
  scope(scope: true | PolicyScope<TRecord>): this;
}
```

Related declarations: [PolicyScope](./policies.md#policyscope), [RepositoryRecord](./inputs.md#repositoryrecord).

## FieldWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import type { FieldWritePolicy } from '@nocobase/db'`.

```ts
export interface FieldWritePolicy {
  readonly fields?: false | readonly string[];
}
```

## FieldWritePolicyBuilder

[Source](../../../src/repository/write-policy.ts)

Import: `import type { FieldWritePolicyBuilder } from '@nocobase/db'`.

```ts
export interface FieldWritePolicyBuilder {
  fields(...fields: string[]): this;
}
```

## FieldWritePolicyInput

[Source](../../../src/repository/write-policy.ts)

Import: `import type { FieldWritePolicyInput } from '@nocobase/db'`.

```ts
export type FieldWritePolicyInput =
  | FieldWritePolicy
  | ((write: FieldWritePolicyBuilder) => FieldWritePolicyBuilder);
```

Related declarations: [FieldWritePolicy](./policies.md#fieldwritepolicy), [FieldWritePolicyBuilder](./policies.md#fieldwritepolicybuilder).

## NormalizedCreateNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedCreateNode } from '@nocobase/db'`.

```ts
export interface NormalizedCreateNode extends NormalizedWriteNode {
  readonly defaults: Readonly<Record<string, PolicyScalarValue>>;
}
```

Related declarations: [NormalizedWriteNode](./policies.md#normalizedwritenode), [PolicyScalarValue](./policies.md#policyscalarvalue).

## NormalizedDeleteNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedDeleteNode } from '@nocobase/db'`.

```ts
export interface NormalizedDeleteNode {
  readonly scope: true | FilterAst;
}
```

Related declarations: [FilterAst](./inputs.md#filterast).

## NormalizedReadNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedReadNode } from '@nocobase/db'`.

```ts
export interface NormalizedReadNode {
  readonly scope: true | FilterAst;
  readonly fields: readonly string[];
  readonly relations: Readonly<Record<string, NormalizedReadNode | PolicyRef>>;
}
```

Related declarations: [FilterAst](./inputs.md#filterast), [PolicyRef](./policies.md#policyref).

## NormalizedRelationShapeNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedRelationShapeNode } from '@nocobase/db'`.

```ts
export interface NormalizedRelationShapeNode {
  readonly fields: readonly string[];
  readonly relations: Readonly<Record<string, NormalizedRelationWriteNode>>;
  readonly through?:
    | false
    | {
        readonly fields: readonly string[];
      };
}
```

Related declarations: [NormalizedRelationWriteNode](./policies.md#normalizedrelationwritenode).

## NormalizedRelationWriteNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedRelationWriteNode } from '@nocobase/db'`.

```ts
export interface NormalizedRelationWriteNode {
  readonly scope?: true | FilterAst;
  readonly create?: NormalizedRelationShapeNode;
  readonly update?: NormalizedRelationShapeNode;
  readonly upsert?: {
    readonly create: NormalizedRelationShapeNode;
    readonly update: NormalizedRelationShapeNode;
  };
  readonly connect?: NormalizedThroughNode;
  readonly disconnect?: Readonly<Record<string, never>>;
  readonly set?: NormalizedThroughNode;
  readonly delete?: Readonly<Record<string, never>>;
}
```

Related declarations: [FilterAst](./inputs.md#filterast), [NormalizedRelationShapeNode](./policies.md#normalizedrelationshapenode), [NormalizedThroughNode](./policies.md#normalizedthroughnode).

## NormalizedRepositoryPolicy

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedRepositoryPolicy } from '@nocobase/db'`.

```ts
export interface NormalizedRepositoryPolicy {
  readonly read: true | false | NormalizedReadNode;
  readonly create: true | false | NormalizedCreateNode;
  readonly update: true | false | NormalizedWriteNode;
  readonly delete: true | false | NormalizedDeleteNode;
}
```

Related declarations: [NormalizedCreateNode](./policies.md#normalizedcreatenode), [NormalizedDeleteNode](./policies.md#normalizeddeletenode), [NormalizedReadNode](./policies.md#normalizedreadnode), [NormalizedWriteNode](./policies.md#normalizedwritenode).

## NormalizedThroughNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedThroughNode } from '@nocobase/db'`.

```ts
export interface NormalizedThroughNode {
  readonly through:
    | false
    | {
        readonly fields: readonly string[];
      };
}
```

## NormalizedWriteNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { NormalizedWriteNode } from '@nocobase/db'`.

```ts
export interface NormalizedWriteNode {
  readonly scope: true | FilterAst;
  readonly fields: readonly string[];
  readonly relations: Readonly<Record<string, NormalizedRelationWriteNode>>;
}
```

Related declarations: [FilterAst](./inputs.md#filterast), [NormalizedRelationWriteNode](./policies.md#normalizedrelationwritenode).

## PartialReadNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { PartialReadNode } from '@nocobase/db'`.

A read node as `narrow` accepts it: every member optional, all the way down. `scope` is optional here although it is required when a Policy is first bound. The two are not in tension: binding must say everything out loud because a half-written Policy reads as configured while leaving the rest wide open, whereas a patch that omits a member is asking for it to stay as it was — which can only keep or tighten what is already in force.

```ts
/**
 * A read node as `narrow` accepts it: every member optional, all the way down.
 *
 * `scope` is optional here although it is required when a Policy is first
 * bound. The two are not in tension: binding must say everything out loud
 * because a half-written Policy reads as configured while leaving the rest
 * wide open, whereas a patch that omits a member is asking for it to stay as
 * it was — which can only keep or tighten what is already in force.
 */
export interface PartialReadNode<TRecord extends object = RepositoryRecord> {
  readonly scope?: true | PolicyScope<TRecord>;
  readonly fields?: false | readonly string[];
  readonly relations?:
    false | Readonly<Record<string, PartialReadNode | PolicyRef>>;
}
```

Related declarations: [PolicyRef](./policies.md#policyref), [PolicyScope](./policies.md#policyscope), [RepositoryRecord](./inputs.md#repositoryrecord).

## PartialRepositoryPolicy

[Source](../../../src/repository/policy/types.ts)

Import: `import type { PartialRepositoryPolicy } from '@nocobase/db'`.

```ts
export type PartialRepositoryPolicy<TRecord extends object = RepositoryRecord> =
  {
    readonly read?: true | false | PartialReadNode<TRecord>;
    readonly create?: true | false | Partial<CreateNode<TRecord>>;
    readonly update?: true | false | Partial<WriteNode<TRecord>>;
    readonly delete?: true | false | Partial<DeleteNode<TRecord>>;
  };
```

Related declarations: [CreateNode](./policies.md#createnode), [DeleteNode](./policies.md#deletenode), [PartialReadNode](./policies.md#partialreadnode), [RepositoryRecord](./inputs.md#repositoryrecord), [WriteNode](./policies.md#writenode).

## PolicyRecord

[Source](../../../src/repository/types.ts)

Import: `import type { PolicyRecord } from '@nocobase/db'`.

What a read returns once a Policy is bound. A `read` node means the returned record is shaped by an allowlist, so the type degrades to `Partial<TRecord>`: a query with no select comes back carrying `read.fields` alone, and an omitted `fields` is an empty allowlist rather than a free pass. `read: true` adds no limits and keeps the full record type. The degradation is deliberately coarse. Narrowing to exactly the listed fields would need the literal list to survive inference at every call site, and a `Partial` that is honest beats a precise type that silently widens when someone stores the policy in a variable. The test asks whether the `read` union _contains_ a rule object rather than whether the whole union is one. A policy held in a variable of type `RepositoryPolicy<T>` has `read: true | false | ReadNode`, which is not itself an object — testing the union directly returned the complete record for exactly the policies most likely to restrict it.

```ts
/**
 * What a read returns once a Policy is bound.
 *
 * A `read` node means the returned record is shaped by an allowlist, so the
 * type degrades to `Partial<TRecord>`: a query with no select comes back
 * carrying `read.fields` alone, and an omitted `fields` is an empty allowlist
 * rather than a free pass. `read: true` adds no limits and keeps the full
 * record type.
 *
 * The degradation is deliberately coarse. Narrowing to exactly the listed
 * fields would need the literal list to survive inference at every call site,
 * and a `Partial` that is honest beats a precise type that silently widens
 * when someone stores the policy in a variable.
 *
 * The test asks whether the `read` union *contains* a rule object rather than
 * whether the whole union is one. A policy held in a variable of type
 * `RepositoryPolicy<T>` has `read: true | false | ReadNode`, which is not
 * itself an object — testing the union directly returned the complete record
 * for exactly the policies most likely to restrict it.
 */
export type PolicyRecord<
  TRecord extends object,
  TPolicy extends {
    readonly read: unknown;
  },
> = [Extract<TPolicy['read'], object>] extends [never]
  ? TRecord
  : Partial<TRecord>;
```

## PolicyRef

[Source](../../../src/repository/policy/types.ts)

Import: `import type { PolicyRef } from '@nocobase/db'`.

```ts
export interface PolicyRef {
  readonly kind: 'policyRef';
  readonly target: string;
}
```

## PolicyScalarValue

[Source](../../../src/repository/policy/types.ts)

Import: `import type { PolicyScalarValue } from '@nocobase/db'`.

```ts
export type PolicyScalarValue = string | number | boolean | null | Date;
```

## PolicyScope

[Source](../../../src/repository/policy/types.ts)

Import: `import type { PolicyScope } from '@nocobase/db'`.

```ts
export type PolicyScope<TRecord extends object = RepositoryRecord> =
  | FilterShorthand<TRecord>
  | FilterAst
  | ((filter: FilterBuilder<TRecord>) => FilterNode);
```

Related declarations: [FilterAst](./inputs.md#filterast), [FilterBuilder](./inputs.md#filterbuilder), [FilterNode](./inputs.md#filternode), [FilterShorthand](./inputs.md#filtershorthand), [RepositoryRecord](./inputs.md#repositoryrecord).

## ReadNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { ReadNode } from '@nocobase/db'`.

```ts
export interface ReadNode<TRecord extends object = RepositoryRecord> {
  readonly scope: true | PolicyScope<TRecord>;
  readonly fields?: false | readonly string[];
  readonly relations?: false | Readonly<Record<string, ReadNode | PolicyRef>>;
}
```

Related declarations: [PolicyRef](./policies.md#policyref), [PolicyScope](./policies.md#policyscope), [RepositoryRecord](./inputs.md#repositoryrecord).

## ReadPolicyNodeBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { ReadPolicyNodeBuilder } from '@nocobase/db'`.

```ts
export interface ReadPolicyNodeBuilder<
  TRecord extends object = RepositoryRecord,
> {
  /** Rows this node may read. Required, as it is when the node is written out. */
  scope(scope: true | PolicyScope<TRecord>): this;
  /** Scalar allowlist. Fields never named stay unreadable. */
  fields(...fields: readonly string[]): this;
  /** Expand a relation, either with its own rules or by referring to another. */
  relation(
    relation: string,
    configure:
      PolicyRef | ((read: ReadPolicyNodeBuilder) => ReadPolicyNodeBuilder),
  ): this;
}
```

Related declarations: [PolicyRef](./policies.md#policyref), [PolicyScope](./policies.md#policyscope), [RepositoryRecord](./inputs.md#repositoryrecord).

## RelationCreateNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { RelationCreateNode } from '@nocobase/db'`.

```ts
export interface RelationCreateNode extends RelationShapeNode, ThroughNode {}
```

Related declarations: [RelationShapeNode](./policies.md#relationshapenode), [ThroughNode](./policies.md#throughnode).

## RelationCreateShapePolicyBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { RelationCreateShapePolicyBuilder } from '@nocobase/db'`.

```ts
export interface RelationCreateShapePolicyBuilder extends RelationShapePolicyBuilder {
  /** Many-to-many payload carried on the join row. */
  through(
    configure: (
      through: ThroughFieldsPolicyBuilder,
    ) => ThroughFieldsPolicyBuilder,
  ): this;
}
```

Related declarations: [RelationShapePolicyBuilder](./policies.md#relationshapepolicybuilder), [ThroughFieldsPolicyBuilder](./policies.md#throughfieldspolicybuilder).

## RelationCreateWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import type { RelationCreateWritePolicy } from '@nocobase/db'`.

```ts
export interface RelationCreateWritePolicy
  extends WritePolicy, ThroughWritePolicy {}
```

Related declarations: [ThroughWritePolicy](./policies.md#throughwritepolicy), [WritePolicy](./policies.md#writepolicy).

## RelationCreateWritePolicyBuilder

[Source](../../../src/repository/write-policy.ts)

Import: `import type { RelationCreateWritePolicyBuilder } from '@nocobase/db'`.

```ts
export interface RelationCreateWritePolicyBuilder extends WritePolicyBuilder {
  through(
    configure: (through: FieldWritePolicyBuilder) => FieldWritePolicyBuilder,
  ): this;
}
```

Related declarations: [FieldWritePolicyBuilder](./policies.md#fieldwritepolicybuilder), [WritePolicyBuilder](./policies.md#writepolicybuilder).

## RelationPolicyNodeBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { RelationPolicyNodeBuilder } from '@nocobase/db'`.

```ts
export interface RelationPolicyNodeBuilder {
  /** Targets this relation may reach. Omitted leaves the target unscoped. */
  scope(scope: true | PolicyScope): this;
  create(
    configure: (
      shape: RelationCreateShapePolicyBuilder,
    ) => RelationCreateShapePolicyBuilder,
  ): this;
  update(
    configure: (
      shape: RelationShapePolicyBuilder,
    ) => RelationShapePolicyBuilder,
  ): this;
  upsert(
    configure: (
      branches: RelationUpsertPolicyBuilder,
    ) => RelationUpsertPolicyBuilder,
  ): this;
  connect(
    configure?: (edge: ThroughPolicyBuilder) => ThroughPolicyBuilder,
  ): this;
  set(configure?: (edge: ThroughPolicyBuilder) => ThroughPolicyBuilder): this;
  disconnect(): this;
  delete(): this;
}
```

Related declarations: [PolicyScope](./policies.md#policyscope), [RelationCreateShapePolicyBuilder](./policies.md#relationcreateshapepolicybuilder), [RelationShapePolicyBuilder](./policies.md#relationshapepolicybuilder), [RelationUpsertPolicyBuilder](./policies.md#relationupsertpolicybuilder), [ThroughPolicyBuilder](./policies.md#throughpolicybuilder).

## RelationShapeNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { RelationShapeNode } from '@nocobase/db'`.

```ts
export interface RelationShapeNode {
  readonly fields?: false | readonly string[];
  readonly relations?: false | Readonly<Record<string, RelationWriteNode>>;
}
```

Related declarations: [RelationWriteNode](./policies.md#relationwritenode).

## RelationShapePolicyBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { RelationShapePolicyBuilder } from '@nocobase/db'`.

```ts
export interface RelationShapePolicyBuilder {
  fields(...fields: readonly string[]): this;
  relation(
    relation: string,
    configure: (write: RelationPolicyNodeBuilder) => RelationPolicyNodeBuilder,
  ): this;
}
```

Related declarations: [RelationPolicyNodeBuilder](./policies.md#relationpolicynodebuilder).

## RelationUpsertPolicyBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { RelationUpsertPolicyBuilder } from '@nocobase/db'`.

```ts
export interface RelationUpsertPolicyBuilder {
  create(
    configure: (
      shape: RelationShapePolicyBuilder,
    ) => RelationShapePolicyBuilder,
  ): this;
  update(
    configure: (
      shape: RelationShapePolicyBuilder,
    ) => RelationShapePolicyBuilder,
  ): this;
}
```

Related declarations: [RelationShapePolicyBuilder](./policies.md#relationshapepolicybuilder).

## RelationWriteNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { RelationWriteNode } from '@nocobase/db'`.

```ts
export interface RelationWriteNode<TRecord extends object = RepositoryRecord> {
  readonly scope?: true | PolicyScope<TRecord>;
  readonly create?: RelationCreateNode;
  readonly update?: RelationShapeNode;
  readonly upsert?: {
    readonly create: RelationShapeNode;
    readonly update: RelationShapeNode;
  };
  readonly connect?: ThroughNode;
  readonly disconnect?: Readonly<Record<string, never>>;
  readonly set?: ThroughNode;
  readonly delete?: Readonly<Record<string, never>>;
}
```

Related declarations: [PolicyScope](./policies.md#policyscope), [RelationCreateNode](./policies.md#relationcreatenode), [RelationShapeNode](./policies.md#relationshapenode), [RepositoryRecord](./inputs.md#repositoryrecord), [ThroughNode](./policies.md#throughnode).

## RelationWriteOperation

[Source](../../../src/repository/write-policy.ts)

Import: `import type { RelationWriteOperation } from '@nocobase/db'`.

```ts
export type RelationWriteOperation = keyof RelationWritePolicy;
```

Related declarations: [RelationWritePolicy](./policies.md#relationwritepolicy).

## RelationWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import type { RelationWritePolicy } from '@nocobase/db'`.

```ts
export interface RelationWritePolicy {
  readonly create?: RelationCreateWritePolicy;
  readonly update?: WritePolicy;
  readonly upsert?: UpsertWritePolicy;
  readonly connect?: ThroughWritePolicy;
  readonly set?: ThroughWritePolicy;
  readonly disconnect?: Readonly<Record<string, never>>;
  readonly delete?: Readonly<Record<string, never>>;
}
```

Related declarations: [RelationCreateWritePolicy](./policies.md#relationcreatewritepolicy), [ThroughWritePolicy](./policies.md#throughwritepolicy), [UpsertWritePolicy](./policies.md#upsertwritepolicy), [WritePolicy](./policies.md#writepolicy).

## RelationWritePolicyBuilder

[Source](../../../src/repository/write-policy.ts)

Import: `import type { RelationWritePolicyBuilder } from '@nocobase/db'`.

```ts
export interface RelationWritePolicyBuilder {
  create(
    configure: (
      write: RelationCreateWritePolicyBuilder,
    ) => RelationCreateWritePolicyBuilder,
  ): this;
  update(configure: (write: WritePolicyBuilder) => WritePolicyBuilder): this;
  upsert(
    configure: (branches: UpsertWritePolicyBuilder) => UpsertWritePolicyBuilder,
  ): this;
  connect(
    configure?: (edge: ThroughWritePolicyBuilder) => ThroughWritePolicyBuilder,
  ): this;
  set(
    configure?: (edge: ThroughWritePolicyBuilder) => ThroughWritePolicyBuilder,
  ): this;
  disconnect(): this;
  delete(): this;
}
```

Related declarations: [RelationCreateWritePolicyBuilder](./policies.md#relationcreatewritepolicybuilder), [ThroughWritePolicyBuilder](./policies.md#throughwritepolicybuilder), [UpsertWritePolicyBuilder](./policies.md#upsertwritepolicybuilder), [WritePolicyBuilder](./policies.md#writepolicybuilder).

## RepositoryOperations

[Source](../../../src/repository/types.ts)

Import: `import type { RepositoryOperations } from '@nocobase/db'`.

The operations a Repository performs, without the derivation methods. Both a plain and a policy-bound Repository satisfy this, which is what lets code that only runs queries accept either. Neither is a subtype of the other on purpose: `withPolicy` must not be reachable on a bound instance, and `narrow` means nothing on an unbound one.

```ts
/**
 * The operations a Repository performs, without the derivation methods.
 *
 * Both a plain and a policy-bound Repository satisfy this, which is what lets
 * code that only runs queries accept either. Neither is a subtype of the
 * other on purpose: `withPolicy` must not be reachable on a bound instance,
 * and `narrow` means nothing on an unbound one.
 */
export type RepositoryOperations<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> = Omit<Repository<TRecord, TCreate, TUpdate>, 'withPolicy'>;
```

Related declarations: [Repository](./repository.md#repository), [RepositoryRecord](./inputs.md#repositoryrecord).

## RepositoryPolicy

[Source](../../../src/repository/policy/types.ts)

Import: `import type { RepositoryPolicy } from '@nocobase/db'`.

```ts
export interface RepositoryPolicy<TRecord extends object = RepositoryRecord> {
  readonly read: true | false | ReadNode<TRecord>;
  readonly create: true | false | CreateNode<TRecord>;
  readonly update: true | false | WriteNode<TRecord>;
  readonly delete: true | false | DeleteNode<TRecord>;
}
```

Related declarations: [CreateNode](./policies.md#createnode), [DeleteNode](./policies.md#deletenode), [ReadNode](./policies.md#readnode), [RepositoryRecord](./inputs.md#repositoryrecord), [WriteNode](./policies.md#writenode).

## RepositoryPolicyBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { RepositoryPolicyBuilder } from '@nocobase/db'`.

```ts
export interface RepositoryPolicyBuilder<
  TRecord extends object = RepositoryRecord,
> {
  read(
    node:
      | boolean
      | ((
          read: ReadPolicyNodeBuilder<TRecord>,
        ) => ReadPolicyNodeBuilder<TRecord>),
  ): this;
  create(
    node:
      | boolean
      | ((
          create: CreatePolicyNodeBuilder<TRecord>,
        ) => CreatePolicyNodeBuilder<TRecord>),
  ): this;
  update(
    node:
      | boolean
      | ((
          update: WritePolicyNodeBuilder<TRecord>,
        ) => WritePolicyNodeBuilder<TRecord>),
  ): this;
  delete(
    node:
      | boolean
      | ((
          remove: DeletePolicyNodeBuilder<TRecord>,
        ) => DeletePolicyNodeBuilder<TRecord>),
  ): this;
}
```

Related declarations: [CreatePolicyNodeBuilder](./policies.md#createpolicynodebuilder), [DeletePolicyNodeBuilder](./policies.md#deletepolicynodebuilder), [ReadPolicyNodeBuilder](./policies.md#readpolicynodebuilder), [RepositoryRecord](./inputs.md#repositoryrecord), [WritePolicyNodeBuilder](./policies.md#writepolicynodebuilder).

## ScopedDatabaseConnection

[Source](../../../src/database/connection.ts)

Import: `import type { ScopedDatabaseConnection } from '@nocobase/db'`.

A connection carrying policy bindings while retaining raw access. Use DatabaseConnection.restrict() to create a restricted DatabaseScope.

```ts
/**
 * A connection carrying policy bindings while retaining raw access.
 * Use DatabaseConnection.restrict() to create a restricted DatabaseScope.
 */
export interface ScopedDatabaseConnection extends Omit<
  DatabaseConnection,
  'restrict' | 'withPolicies' | 'transaction' | 'connect' | 'reconnect'
> {
  /** The Policies in force, by Collection name. */
  explainPolicies(): Readonly<Record<string, NormalizedRepositoryPolicy>>;
  connect(): Promise<ScopedDatabaseConnection>;
  reconnect(): Promise<ScopedDatabaseConnection>;
  transaction<T>(
    fn: (connection: ScopedDatabaseConnection) => Promise<T>,
  ): Promise<T>;
}
```

Related declarations: [DatabaseConnection](./connection.md#databaseconnection), [NormalizedRepositoryPolicy](./policies.md#normalizedrepositorypolicy).

## ScopedRepository

[Source](../../../src/repository/types.ts)

Import: `import type { ScopedRepository } from '@nocobase/db'`.

```ts
export interface ScopedRepository<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> extends RepositoryOperations<TRecord, TCreate, TUpdate> {
  /**
   * Narrow the bound Policy further. Scopes intersect, field and relation
   * allowlists intersect, and `false` on either side wins — there is no
   * spelling that widens, so a narrowed Repository cannot climb back out.
   *
   * Absent from an unbound Repository on purpose: narrowing nothing is not a
   * meaningful request, and `withPolicy` is absent here for the mirror reason.
   */
  narrow(
    patch: PartialRepositoryPolicy<TRecord>,
  ): ScopedRepository<TRecord, TCreate, TUpdate>;
  /** The Policy actually in force, after `withPolicy` and every `narrow`. */
  explainPolicy(): NormalizedRepositoryPolicy;
}
```

Related declarations: [NormalizedRepositoryPolicy](./policies.md#normalizedrepositorypolicy), [PartialRepositoryPolicy](./policies.md#partialrepositorypolicy), [RepositoryOperations](./policies.md#repositoryoperations), [RepositoryRecord](./inputs.md#repositoryrecord).

## ThroughFieldsPolicyBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { ThroughFieldsPolicyBuilder } from '@nocobase/db'`.

```ts
export interface ThroughFieldsPolicyBuilder {
  fields(...fields: readonly string[]): this;
}
```

## ThroughNode

[Source](../../../src/repository/policy/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ThroughNode {
  readonly through?:
    | false
    | {
        readonly fields?: false | readonly string[];
      };
}
```

## ThroughPolicyBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { ThroughPolicyBuilder } from '@nocobase/db'`.

```ts
export interface ThroughPolicyBuilder {
  through(
    configure: (
      through: ThroughFieldsPolicyBuilder,
    ) => ThroughFieldsPolicyBuilder,
  ): this;
}
```

Related declarations: [ThroughFieldsPolicyBuilder](./policies.md#throughfieldspolicybuilder).

## ThroughWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import type { ThroughWritePolicy } from '@nocobase/db'`.

```ts
export interface ThroughWritePolicy {
  readonly through?: false | FieldWritePolicy;
}
```

Related declarations: [FieldWritePolicy](./policies.md#fieldwritepolicy).

## ThroughWritePolicyBuilder

[Source](../../../src/repository/write-policy.ts)

Import: `import type { ThroughWritePolicyBuilder } from '@nocobase/db'`.

```ts
export interface ThroughWritePolicyBuilder {
  through(
    configure: (through: FieldWritePolicyBuilder) => FieldWritePolicyBuilder,
  ): this;
}
```

Related declarations: [FieldWritePolicyBuilder](./policies.md#fieldwritepolicybuilder).

## UpsertWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import type { UpsertWritePolicy } from '@nocobase/db'`.

```ts
export interface UpsertWritePolicy {
  readonly create: WritePolicy;
  readonly update: WritePolicy;
}
```

Related declarations: [WritePolicy](./policies.md#writepolicy).

## UpsertWritePolicyBuilder

[Source](../../../src/repository/write-policy.ts)

Import: `import type { UpsertWritePolicyBuilder } from '@nocobase/db'`.

```ts
export interface UpsertWritePolicyBuilder {
  create(configure: (write: WritePolicyBuilder) => WritePolicyBuilder): this;
  update(configure: (write: WritePolicyBuilder) => WritePolicyBuilder): this;
}
```

Related declarations: [WritePolicyBuilder](./policies.md#writepolicybuilder).

## UpsertWritePolicyInput

[Source](../../../src/repository/write-policy.ts)

Import: `import type { UpsertWritePolicyInput } from '@nocobase/db'`.

```ts
export type UpsertWritePolicyInput =
  | UpsertWritePolicy
  | ((branches: UpsertWritePolicyBuilder) => UpsertWritePolicyBuilder);
```

Related declarations: [UpsertWritePolicy](./policies.md#upsertwritepolicy), [UpsertWritePolicyBuilder](./policies.md#upsertwritepolicybuilder).

## WriteNode

[Source](../../../src/repository/policy/types.ts)

Import: `import type { WriteNode } from '@nocobase/db'`.

```ts
export interface WriteNode<TRecord extends object = RepositoryRecord> {
  readonly scope: true | PolicyScope<TRecord>;
  readonly fields?: false | readonly string[];
  readonly relations?:
    false | Readonly<Record<string, RelationWriteNode<TRecord>>>;
}
```

Related declarations: [PolicyScope](./policies.md#policyscope), [RelationWriteNode](./policies.md#relationwritenode), [RepositoryRecord](./inputs.md#repositoryrecord).

## WritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import type { WritePolicy } from '@nocobase/db'`.

```ts
export interface WritePolicy extends FieldWritePolicy {
  readonly relations?: false | Readonly<Record<string, RelationWritePolicy>>;
}
```

Related declarations: [FieldWritePolicy](./policies.md#fieldwritepolicy), [RelationWritePolicy](./policies.md#relationwritepolicy).

## WritePolicyBuilder

[Source](../../../src/repository/write-policy.ts)

Import: `import type { WritePolicyBuilder } from '@nocobase/db'`.

```ts
export interface WritePolicyBuilder extends FieldWritePolicyBuilder {
  relation(
    name: string,
    configure: (
      relation: RelationWritePolicyBuilder,
    ) => RelationWritePolicyBuilder,
  ): this;
}
```

Related declarations: [FieldWritePolicyBuilder](./policies.md#fieldwritepolicybuilder), [RelationWritePolicyBuilder](./policies.md#relationwritepolicybuilder).

## WritePolicyInput

[Source](../../../src/repository/write-policy.ts)

Import: `import type { WritePolicyInput } from '@nocobase/db'`.

```ts
export type WritePolicyInput =
  WritePolicy | ((write: WritePolicyBuilder) => WritePolicyBuilder);
```

Related declarations: [WritePolicy](./policies.md#writepolicy), [WritePolicyBuilder](./policies.md#writepolicybuilder).

## WritePolicyNodeBuilder

[Source](../../../src/repository/policy/build.ts)

Import: `import type { WritePolicyNodeBuilder } from '@nocobase/db'`.

```ts
export interface WritePolicyNodeBuilder<
  TRecord extends object = RepositoryRecord,
> {
  scope(scope: true | PolicyScope<TRecord>): this;
  fields(...fields: readonly string[]): this;
  relation(
    relation: string,
    configure: (write: RelationPolicyNodeBuilder) => RelationPolicyNodeBuilder,
  ): this;
}
```

Related declarations: [PolicyScope](./policies.md#policyscope), [RelationPolicyNodeBuilder](./policies.md#relationpolicynodebuilder), [RepositoryRecord](./inputs.md#repositoryrecord).

## buildRepositoryPolicy

[Source](../../../src/repository/policy/build.ts)

Import: `import { buildRepositoryPolicy } from '@nocobase/db'`.

Build a Repository Policy from a callback. A node the callback never mentions is `false`, so the four-node requirement costs nothing to satisfy while the default stays refusal. `scope` is not defaulted the same way: a node that is declared without one is refused, exactly as a hand-written Policy is, because a missing scope reads as configured while leaving every row reachable. The result is normalized and frozen here, so a malformed Policy fails where it is written rather than where it is bound. Normalization is idempotent, so binding it later normalizes a second time without changing it. Note that a Policy built this way loses its literal type, so `withPolicy` degrades the record type to `Partial<TRecord>` even when `read` is `true`. Write the object out when that precision matters.

```ts
/**
 * Build a Repository Policy from a callback.
 *
 * A node the callback never mentions is `false`, so the four-node requirement
 * costs nothing to satisfy while the default stays refusal. `scope` is not
 * defaulted the same way: a node that is declared without one is refused,
 * exactly as a hand-written Policy is, because a missing scope reads as
 * configured while leaving every row reachable.
 *
 * The result is normalized and frozen here, so a malformed Policy fails where
 * it is written rather than where it is bound. Normalization is idempotent, so
 * binding it later normalizes a second time without changing it.
 *
 * Note that a Policy built this way loses its literal type, so `withPolicy`
 * degrades the record type to `Partial<TRecord>` even when `read` is `true`.
 * Write the object out when that precision matters.
 */
export declare function buildRepositoryPolicy<
  TRecord extends object = RepositoryRecord,
>(
  configure: (
    policy: RepositoryPolicyBuilder<TRecord>,
  ) => RepositoryPolicyBuilder<TRecord>,
): RepositoryPolicy<TRecord>;
```

Related declarations: [RepositoryPolicy](./policies.md#repositorypolicy), [RepositoryPolicyBuilder](./policies.md#repositorypolicybuilder), [RepositoryRecord](./inputs.md#repositoryrecord).

## buildUpsertWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import { buildUpsertWritePolicy } from '@nocobase/db'`.

Build independent create/update rules for a root upsert. Both branches are required.

```ts
/** Build independent create/update rules for a root upsert. Both branches are required. */
export declare function buildUpsertWritePolicy(
  input: UpsertWritePolicyInput,
): UpsertWritePolicy;
```

Related declarations: [UpsertWritePolicy](./policies.md#upsertwritepolicy), [UpsertWritePolicyInput](./policies.md#upsertwritepolicyinput).

## buildWritePolicy

[Source](../../../src/repository/write-policy.ts)

Import: `import { buildWritePolicy } from '@nocobase/db'`.

Build a detached, frozen policy. No fields or relations are allowed by default.

```ts
/** Build a detached, frozen policy. No fields or relations are allowed by default. */
export declare function buildWritePolicy(input?: WritePolicyInput): WritePolicy;
```

Related declarations: [WritePolicy](./policies.md#writepolicy), [WritePolicyInput](./policies.md#writepolicyinput).

## expandPolicyRefs

[Source](../../../src/repository/policy/refs.ts)

Import: `import { expandPolicyRefs } from '@nocobase/db'`.

Replace every `ref()` in a bound map with the node it names. Only `read.relations` carries references. Relation writes are authorized by the originating side alone — the target's own Policy deliberately does not take part — so there is nothing there to refer to.

```ts
/**
 * Replace every `ref()` in a bound map with the node it names.
 *
 * Only `read.relations` carries references. Relation writes are authorized by
 * the originating side alone — the target's own Policy deliberately does not
 * take part — so there is nothing there to refer to.
 */
export declare function expandPolicyRefs(
  policies: Readonly<Record<string, NormalizedRepositoryPolicy>>,
): Readonly<Record<string, NormalizedRepositoryPolicy>>;
```

Related declarations: [NormalizedRepositoryPolicy](./policies.md#normalizedrepositorypolicy).

## narrowRepositoryPolicy

[Source](../../../src/repository/policy/narrow.ts)

Import: `import { narrowRepositoryPolicy } from '@nocobase/db'`.

Narrow a bound Policy. Every rule here only ever takes away: scopes are ANDed, field lists intersected, relations intersected, and `false` on either side wins. There is deliberately no spelling that widens — a caller holding a narrowed Repository cannot climb back out of it. A patch is a patch: a member it does not mention is left as it was. A member it does mention is intersected with what was there, so `relations: {}` is a way to say "none of them" rather than "no change".

```ts
/**
 * Narrow a bound Policy.
 *
 * Every rule here only ever takes away: scopes are ANDed, field lists
 * intersected, relations intersected, and `false` on either side wins. There
 * is deliberately no spelling that widens — a caller holding a narrowed
 * Repository cannot climb back out of it.
 *
 * A patch is a patch: a member it does not mention is left as it was. A member
 * it does mention is intersected with what was there, so `relations: {}` is a
 * way to say "none of them" rather than "no change".
 */
export declare function narrowRepositoryPolicy<TRecord extends object>(
  current: NormalizedRepositoryPolicy,
  patch: PartialRepositoryPolicy<TRecord>,
): NormalizedRepositoryPolicy;
```

Related declarations: [NormalizedRepositoryPolicy](./policies.md#normalizedrepositorypolicy), [PartialRepositoryPolicy](./policies.md#partialrepositorypolicy).

## normalizeRepositoryPolicy

[Source](../../../src/repository/policy/normalize.ts)

Import: `import { normalizeRepositoryPolicy } from '@nocobase/db'`.

```ts
export declare function normalizeRepositoryPolicy<
  TRecord extends object = Record<string, unknown>,
>(input: RepositoryPolicy<TRecord>): NormalizedRepositoryPolicy;
```

Related declarations: [NormalizedRepositoryPolicy](./policies.md#normalizedrepositorypolicy), [RepositoryPolicy](./policies.md#repositorypolicy).

## ref

[Source](../../../src/repository/policy/refs.ts)

Import: `import { ref } from '@nocobase/db'`.

Refer to another Collection's read node from inside `read.relations`. The target names a key of the same `restrict` or `withPolicies` map, not a Policy the target Collection owns globally. That is where Collections' Policies share a scope, and it keeps "reached through a relation" and "queried directly" from silently influencing each other: the reuse is written out rather than inherited. It is expanded when the map is bound, not dereferenced per query, so a cycle is a configuration error rather than a stack overflow at request time.

```ts
/**
 * Refer to another Collection's read node from inside `read.relations`.
 *
 * The target names a key of the same `restrict` or `withPolicies` map,
 * not a Policy the target Collection owns globally. That is where Collections'
 * Policies share a scope, and it keeps "reached through a relation" and
 * "queried directly" from silently influencing each other: the reuse is
 * written out rather than inherited.
 *
 * It is expanded when the map is bound, not dereferenced per query, so a cycle
 * is a configuration error rather than a stack overflow at request time.
 */
export declare function ref(target: string): PolicyRef;
```

Related declarations: [PolicyRef](./policies.md#policyref).
