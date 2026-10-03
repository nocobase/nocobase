---
title: Repository API 参考
description: 按方法查阅 Repository 的公开输入、返回包装、Builder 与 AST 类型，定位查询、写入、聚合和校验契约，并区分单条操作和批量操作的限制。
---

# Repository API 参考

本页是当前公开接口的速查，不复制完整类型声明。精确泛型和重载以 `@nocobase/db` 根入口为准；语义和示例见 [Repository 概览](../repository/overview.md)。

## 入口与输入类型

```ts
import type { Repository } from '@nocobase/db';
interface Project {
  id: string;
  name: string;
  status: string;
}
const projects: Repository<Project> = db.repository<Project>('projects');
```

Repository 泛型依次为记录 TRecord、创建 TCreate、更新 TUpdate；后两者默认 Partial<TRecord>，并不代表实际 Schema 没有必填字段。动态 Repository 依赖运行时 Collection 校验。

| 公开类型                                                | 用途                                                      |
| ------------------------------------------------------- | --------------------------------------------------------- |
| RepositoryFilter / FilterBuilder / FilterAst            | 等值简写、条件 Builder 或序列化 AST                       |
| RepositorySelect / SelectBuilder / SelectAst            | 标量、关系及关系聚合选择                                  |
| RepositorySort / SortBuilder / SortAst                  | 字段与关系聚合排序                                        |
| RepositoryCursor / RepositoryCursorDirection            | 排序轴取值，forward/backward                              |
| CreateMutationValues / UpdateMutationValues             | 模型形状写入，关系 Builder/JSON                           |
| MutationValuesInput / ValuesBuilder                     | 根级 values callback，variable/literal 构造工具           |
| MutationVariable / MutationLiteral / MutationValueInput | 可序列化变量引用、显式字面量与字段输入                    |
| NumericMutationInput / NumericMutationBuilder           | 单个数值原子操作                                          |
| AggregateBuilder / AggregateAst                         | count/sum/avg/min/max 选择                                |
| RepositoryContext                                       | Filter 与 Values 变量上下文，不是事务对象或自动权限上下文 |

## 查询

`RepositoryQuery<T>` extends `PromiseLike<T[]>` and `AsyncIterable<T>` and offers catch/finally. findMany is lazy; its then/catch/finally methods return native promises. There is no public stream method or StreamOptions type. Repeated promise consumption shares an execution, while mixed modes or repeated iteration raise QUERY_ALREADY_CONSUMED. Transaction-bound consumption after completion raises QUERY_TRANSACTION_COMPLETED.

| 方法                                           | options                                                                    | 返回                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [findMany](../repository/methods/find-many.md) | Optional filter/select/sort/distinct/cursor/direction/limit/offset/context | `RepositoryQuery<TRecord>`; await yields `TRecord[]`, for-await yields `TRecord` |
| [findOne](../repository/methods/find-one.md)   | 至少 filter 或非空 sort；可选 select、context                              | `TRecord \| undefined`                                                           |
| [count](../repository/methods/count.md)        | 可选 filter、context                                                       | number                                                                           |
| [exists](../repository/methods/exists.md)      | 可选 filter、context                                                       | boolean                                                                          |

Select Builder 的精确重载可能收窄 TRecord；JSON AST 和普通关系记录 include 有推导边界。不要为 findOne 加未公开的 limit/offset/cursor 参数。详见[查询](../repository/methods/find-many.md)和 [Streaming](../repository/methods/stream.md)。

Values 对象与 callback、variable/literal 的当前支持范围见 [Values](../repository/values.md)；嵌套关系输入见[关系写入](../repository/relation-mutations.md)。

## 根级写入

| 方法                                               | 必填                        | 可选                       | 返回                       |
| -------------------------------------------------- | --------------------------- | -------------------------- | -------------------------- |
| [createOne](../repository/methods/create-one.md)   | values                      | select、context            | SingleMutationResult       |
| [createMany](../repository/methods/create-many.md) | 非空 values 数组            | select、context            | createdCount，可选 records |
| [updateOne](../repository/methods/update-one.md)   | filter、values              | ifVersion、select、context | SingleMutationResult       |
| [updateMany](../repository/methods/update-many.md) | values；filter 或 all:true  | select、context            | updatedCount，可选 records |
| [upsertOne](../repository/methods/upsert-one.md)   | 唯一 filter、create、update | ifVersion、select、context | SingleMutationResult       |
| [deleteOne](../repository/methods/delete-one.md)   | filter                      | ifVersion、select、context | deleted:true，可选 record  |
| [deleteMany](../repository/methods/delete-many.md) | filter 或 all:true          | select、context            | deletedCount，可选 records |

不提供 upsertMany、createMany 的 skipDuplicates、批量 ifVersion 或批量嵌套关系写入。context 用于显式 Values 变量、根级与嵌套 Filter、返回 select 中的关系 Filter，不自动填充未引用的字段，也不执行隐式权限过滤。根级 upsert 用 create/update，不用 values。select 是返回选择，不是输入字段授权。

根级 values 和 upsert 的 create/update 接受对象或同步 `(v: ValuesBuilder) => 对象`；createMany.values 接受非空数组或返回非空数组的 callback。`v.variable('$input.name')` 等价于 `{ kind: 'variable', path: '$input.name' }`；`v.literal(value)` 等价于 `{ kind: 'literal', value }`。JSON 字段内部不递归解释，解析结果不再次作为表达式执行。详情见[Values 变量与字面量](../repository/values.md#变量与-literal)。

SingleMutationResult 结构：

```ts
import type { SingleMutationResult } from '@nocobase/db';
type CreatedProject = SingleMutationResult<{ id: string; name: string }>;
// { record, createdTargets: readonly CreatedTargetReference[], version?: string | number }
```

createdTargets 记录提供了 clientKey 的嵌套创建引用，不是所有关联记录数组。upsert 返回同一结构，不包含 created 布尔标记。delete returning 返回删除前记录，批量 returning 的 records 为只读数组类型。详见[写入](../repository/values.md)。

## 关系输入

createOne 的关系输入支持 create/connect；updateOne 的关系输入支持 create/connect/disconnect/set/update/upsert/delete，但需符合关系类型、可空性和当前作用域。set 是 to-many 替换，不能与其他关系操作混用。

公开类型包括 CreateRelationFieldMutationBuilder、UpdateRelationFieldMutationBuilder、RelationUpdateInput、RelationUpsertInput、NestedCreateOptions、RelationConnectInput、RelationCreateInput。RelationMutationAst 等类型用于表达规范化关系计划，不是根级 CRUD 的 `relations` 入参；业务调用使用模型形状 values。详见[关系写入](../repository/relation-mutations.md)。

## 聚合和分组

| 方法                                            | 必填                     | 可选                          | 返回                         |
| ----------------------------------------------- | ------------------------ | ----------------------------- | ---------------------------- |
| [aggregate](../repository/methods/aggregate.md) | aggregate Builder 或 AST | filter、context               | 别名到聚合值的对象           |
| [groupBy](../repository/methods/group-by.md)    | 非空 by、aggregate       | filter、having、sort、context | 分组字段与聚合别名组成的数组 |

关系选择通过 RelationSelectBuilder.count/sum/avg/min/max/combine，输出由 RelationSelectionExpression 和 RelationCombineResult 表达；没有根 SelectBuilder.aggregate。详见[聚合](../repository/select.md#关系聚合与独立分支)。

## 能力描述与预校验

| 方法                                                             | 输入                                                                                                     | 返回                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [describeMutation](../repository/methods/mutation-validation.md) | `{ operation: 'createOne' \| 'updateOne' }`                                                              | collection、operation、relations、limits |
| [validateMutation](../repository/methods/mutation-validation.md) | createOne：operation、values，可选 context；updateOne：operation、filter、values，可选 ifVersion/context | `{ valid, errors }`                      |

relations 包含 cardinality、targetCollection、allowedActions、modifyOperations/patchOperations、uniqueFieldSets；多对多还可包含 through 的 collection/writableFields/requiredOnCreate。allowedActions 的 set/clear/patch/replace/modify 是规范化计划动作，不要机械当成 values 的方法名。

## 常见错误

| 错误码                                                              | 处理方向                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| RECORD_NOT_FOUND / MULTIPLE_RECORDS_MATCHED                         | 核对单条写入条件和数据；findOne 无结果不是该错误                                                            |
| VERSION_CONFLICT                                                    | 重新读取并处理业务冲突，不盲目去掉 ifVersion                                                                |
| INVALID_FILTER / INVALID_SELECT / INVALID_SORT / INVALID_PAGINATION | 修正输入结构和选项组合                                                                                      |
| FIELD_CAPABILITY_NOT_SUPPORTED / FIELD_NOT_WRITABLE                 | 核对字段类型、方言和受管理字段                                                                              |
| RELATION_ACTION_NOT_ALLOWED / RELATION_REASSIGNMENT_REQUIRED        | 核对关系约束和已有归属，不隐式重分配                                                                        |
| READ_ONLY_COLLECTION                                                | 不对 View 写入                                                                                              |
| INVALID_STREAM                                                      | 核对 Streaming 限制                                                                                         |
| REPOSITORY_EVENT_RECURSION                                          | [变更事件](../repository/events.md)监听器的嵌套写入超过 `repositoryEventMaxDepth`，修正监听器，不靠调大上限 |

错误还可携带 collection、field、relation、path、details、retryable，具体值以实际错误为准。预校验和错误码不替代业务授权，也无法消除校验到执行之间的数据竞争。
