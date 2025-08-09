# FlowEngine 核心概念总览

`FlowEngine` 是 NocoBase 前端流式逻辑引擎的核心模块，提供页面组件（模型）的流化配置与行为编排能力。以下是构建该能力体系的核心组成部分：

---

## 1. 引擎与上下文（Engine & Context）

### ✅ FlowEngine

> 全局调度核心，引擎的入口类，协调所有模型与流行为。

* 管理模型实例、操作执行、持久化与同步
* 提供统一运行环境和 API 接口

### ✅ FlowContext

> 流上下文的基类，支持动态方法与属性注册。

* 所有上下文（如 `FlowEngineContext`、`FlowModelContext`、`FlowRuntimeContext` 等）均继承自它
* 支持访问代理和作用域隔离
* 提供了丰富的 API，用于在各层次里使用

---

## 2. 模型体系（Model System）

### ✅ FlowModel

> 组件的抽象建模单位，封装 UI 元素的属性、状态、生命周期及流行为。

* 支持属性流（PropsFlow）与事件流（EventFlow）
* 可序列化，便于保存与还原
* 支持子模型嵌套与结构组合

### ✅ FlowSubModel

> 子模型机制，支持嵌套、分组、组合组件模型。

* 多层级结构
* 构建复杂 UI 结构树

### ✅ FlowModelRepository

> 模型持久化接口，负责远程加载、保存、删除模型数据。

* 支持对接数据库、API、文件等存储介质
* 实现模型的远程同步能力

---

## 3. 渲染与交互（Rendering & Interaction）

### ✅ FlowModelRenderer

> 将 FlowModel 渲染为实际 UI 的基础组件。

* 渲染模型对应的视图
* 支持流设置、交互行为的可视化集成

---

## 4. 流与行为编排（Flow & Behavior）

### ✅ FlowDefinition

> 流定义对象，描述流步骤、触发条件与参数配置。

* 可配置多步骤流
* 支持条件判断、参数配置

### ✅ FlowAction

> 流步骤中可复用的基础操作。

* 封装业务逻辑单元
* 支持参数化配置与 UI 控制集成

### ✅ FlowSettings

> 模型上的流步骤参数管理器。

* 管理各流步骤的参数值
* 支持动态设置、读取、更新

---

## 5. 数据资源层（Data Layer）

### ✅ FlowResource（及其子类）

> 数据访问封装层，支持数据的增删改查操作。

* `APIResource`: 通用 API 操作
* `SingleRecordResource`: 单条记录操作
* `MultiRecordResource`: 多条记录操作
* 提供统一接口供流与模型调用
