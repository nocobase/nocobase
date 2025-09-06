# Flow Context 附录

本页梳理了 FlowEngine 各层级上下文对象的结构与属性。

---

## 1. FlowEngineContext

**层级**：FlowEngineContext

**上下文属性**：

- `app`：当前应用实例
- `api`：APIClient
- `engine`：FlowEngine
- `user`：当前用户
- `role`：当前角色
- `t`：翻译函数
- `i18n`：国际化对象
- `dataSourceManager`：数据源管理器
- `router`：路由对象
- `viewOpener`：视图容器打开器
- `message`：消息提示
- `notification`：通知提示
- `themeToken`：antd 主题变量
- `antdConfig`：antd 配置
- `pageTitle`：主页面标题
- `documentTitle`：浏览器标题

---

## 2. FlowModelContext

**层级**：FlowEngineContext > FlowModelContext

---

### 2.1 PageModelContext

**层级**：FlowEngineContext > FlowModelContext > PageModelContext

**上下文属性**：

- `route`：当前路由的上下文
- `viewContainer`：当前视图容器
- `layoutContentElement`：主内容元素

---

#### 2.1.1 DataBlockModelContext

**层级**：... > PageModelContext > DataBlockModelContext

**上下文属性**：

- `blockModel`：当前区块
- `collection`：当前数据表
- `resource`：当前资源
- `dataSource`：当前数据源

---

##### 2.1.1.1 DetailsModelContext

**层级**：... > DataBlockModelContext > DetailsModelContext

**上下文属性**：

- `recordIndex`
- `record`：当前记录

---

##### 2.1.1.2 FormModelContext

**层级**：... > DataBlockModelContext > FormModelContext

**上下文属性**：

- `recordIndex`
- `record`：当前记录

---

##### 2.1.1.3 FieldModelContext

**层级**：... > DataBlockModelContext > FieldModelContext

**上下文属性**：

- `record`：当前记录
- `recordIndex`
- `fieldValue`

---

##### 2.1.1.4 RecordActionModelContext

**层级**：... > DataBlockModelContext > RecordActionModelContext

**上下文属性**：

- `recordIndex`
- `record`

---

## 3. FlowRuntimeContext

**层级**：FlowEngineContext > FlowModelContext > FlowRuntimeContext

**上下文属性**：

- `runId`
- `flowKey`
- `model`
- `logger`
- `steps`
- `inputArgs`
- `exit()`

---

### 3.1 RouteModelRuntimeContext

**层级**：... > FlowRuntimeContext > RouteModelRuntimeContext

**上下文属性**：

- `inputArgs.mode`
- `inputArgs.target`
- `inputArgs.activeTab`

> 同时继承 FlowRuntimeContext 的上下文

---

### 3.2 ActionModelRuntimeContext

**层级**：FlowEngineContext > ActionModelContext > FlowRuntimeContext > ActionModelRuntimeContext

**上下文属性**：

- `inputArgs.event`

---

### 3.3 RecordActionModelRuntimeContext

**层级**：FlowEngineContext > RecordActionModelContext > FlowRuntimeContext > ActionModelRuntimeContext

**上下文属性**：

- `inputArgs.event`
- `inputArgs.filterByTk`
- `inputArgs.sourceId`

---

### 3.4 TagReadPrettyAssociationFieldModelRuntimeContext

**层级**：FlowEngineContext > FieldModelContext(TagReadPrettyAssociationFieldModel) > FlowRuntimeContext > TagReadPrettyAssociationFieldModelRuntimeContext

**上下文属性**：

- `inputArgs.event`
- `inputArgs.filterByTk`
- `inputArgs.sourceId`

---