---
title: "REST API 数据源"
description: "NocoBase REST API 数据源：接入第三方 HTTP API，把接口资源映射为数据表，配置 List、Get、Create、Update、Destroy 接口、请求参数、响应转换和字段映射。"
keywords: "REST API 数据源,外部 API,接口映射,Collection 映射,CRUD,字段映射,NocoBase"
---

# REST API 数据源

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## 介绍

REST API 数据源用于把第三方 HTTP API 接入 NocoBase，把 RESTful 资源映射成 NocoBase 的数据表，再在页面区块、权限、工作流和 API 中使用它。

它适合把 CRM、ERP、WMS、OA 等业务系统中的客户、订单、库存、审批等数据接入 NocoBase，在不迁移数据的情况下完成查询、处理和运营管理。

常见业务场景：

- 客服在 NocoBase 中查询订单、物流、售后状态，数据仍由原业务系统维护
- 销售或运营查看 CRM 中的客户、联系人、跟进记录，不需要重复录入客户资料
- 仓储人员查看 WMS 库存，并通过接口发起库存锁定、出库、调拨等操作
- 财务或采购在 NocoBase 中发起付款、采购、报销等流程，再调用 ERP 或 OA 接口同步状态
- 门店人员查询会员等级、积分余额、优惠券状态，并调用接口完成积分扣减或券核销

## 插件安装

REST API 数据源由 `@nocobase/plugin-data-source-rest-api` 插件提供。该插件是商业插件，安装并启用插件后，可以在「数据源管理」的「Add new」菜单中选择「REST API」。

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

## 添加 REST API 数据源

在「数据源管理」中点击「Add new」，选择「REST API」，然后填写第三方 API 的基础连接信息。

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

| 配置 | 说明 |
| --- | --- |
| Data source name | 数据源标识名称，用于页面区块、权限、工作流和 API 中使用。创建后不能修改。 |
| Data source display name | 数据源在界面中显示的名称，建议使用业务人员能理解的名称，比如「CRM API」「库存 API」。 |
| BaseURL | 第三方 API 的基础地址，比如 `https://api.example.com`。每个 Collection 动作里的 URL 会基于这个地址继续拼接。 |
| Headers | 数据源级请求头。适合放认证信息、`Content-Type` 等所有接口都会用到的请求头。 |
| Variables | 数据源级自定义变量。适合保存 token、环境地址等需要在接口配置中复用的值。 |
| Timeout | 请求超时时间，单位为毫秒。默认值为 `5000`。 |
| Response type | 响应类型。当前表单只支持 `JSON`。 |
| Enabled the data source | 是否启用这个数据源。关闭后，数据源配置会保留，但页面区块、权限、工作流和 API 无法继续通过它读取数据。 |

### 数据源变量

如果多个接口都要使用同一段信息，可以放到「Variables」中统一维护。比如第三方接口需要 `tenantId`、`appKey` 或固定的业务参数，就可以在数据源变量里定义，然后在 Collection 的请求参数、请求头、请求体或响应转换里引用。

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

:::tip 提示

认证信息通常放在数据源级「Headers」或「Variables」里。这样变更 token 或租户标识时，只需要改数据源配置，不需要逐个修改 Collection 动作。

:::

## 编辑 REST API 数据源

在数据源列表中，点击某个 REST API 数据源右侧的「Edit」，可以修改这个数据源的配置。`Data source name` 不能修改，其他配置可以修改。

变更数据源配置前，建议先确认这些影响：

- 修改 `BaseURL` 后，已配置的 Collection 动作是否还能访问正确接口
- 修改 `Headers` 或 `Variables` 后，第三方接口认证是否仍然有效
- 修改 `Timeout` 后，慢接口是否会出现更多超时错误
- 关闭数据源后，页面区块、权限、工作流和 API 是否仍然依赖它

:::warning 注意

编辑 REST API 数据源不会修改第三方系统中的数据。不过如果新的连接信息、请求头或变量不正确，依赖该数据源的页面区块、权限、工作流和 API 可能无法正常读取或写入数据。

:::

## 删除 REST API 数据源

在数据源列表中，点击某个 REST API 数据源右侧的「Delete」，可以删除这个数据源在 NocoBase 中的配置。

删除 REST API 数据源不会删除第三方系统中的数据，也不会调用第三方接口删除记录。它只会移除 NocoBase 中保存的数据源配置、Collection 配置和字段元数据。

删除前建议检查这些内容：

- 页面区块是否还在使用这个数据源
- 权限规则是否引用了这个数据源或其中的 Collection
- 工作流、图表、API 调用是否依赖这些 Collection
- 其他数据表字段是否关联了这个数据源中的 Collection

:::warning 注意

删除数据源后，依赖该数据源的页面区块、权限、工作流和 API 可能无法正常工作。如果只是第三方接口临时不可用，优先编辑连接配置或处理接口异常，不要直接删除数据源。

:::

## REST API 数据源管理

在数据源列表中，点击某个 REST API 数据源右侧的「Configure」，可以进入 REST API 数据源管理页面。

REST API 数据源管理主要用于维护 Collection。每个 Collection 通常对应第三方 API 的一个资源，比如用户、客户、订单、库存、合同等。

REST API 数据源提供这些管理能力：

- **新增 Collection**：把第三方 API 的一个资源映射为 NocoBase 数据表
- **编辑 Collection**：调整资源名称、接口动作、字段和记录唯一标识
- **删除 Collection**：删除 NocoBase 中保存的资源映射配置
- **调试 API**：检查请求参数、第三方响应、转换结果和错误信息
- **配置字段**：从接口响应中提取字段，并调整 Field type 和 Field interface

### 新增 Collection

REST API 数据源中的 Collection 对应第三方 API 的一个资源。比如第三方系统的用户资源通常会有这些接口：

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

在 NocoBase 中，需要把这些接口分别映射为数据表的 List、Get、Create、Update、Destroy 动作。

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Collection 的基础配置如下：

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称。建议使用业务人员能理解的名称，比如「客户」「订单」「库存记录」。 |
| Collection name | 数据表在 NocoBase 中的标识名称。创建时可以修改；只支持字母、数字和下划线，并且必须以字母开头。创建后不能修改。 |
| Description | 数据表说明。适合写接口来源、数据含义、维护系统或注意事项。 |
| Request actions | 第三方接口动作配置。用于把第三方 API 映射成 List、Get、Create、Update、Destroy。 |
| Fields | 字段元数据。可以从接口响应中提取，也可以在提取后调整字段显示名称、Field type 和 Field interface。 |
| Record unique key | 记录唯一标识。用于定位一条记录，通常选择第三方接口里的 `id`、`code`、`uuid` 等唯一字段。未配置时，无法为该 Collection 创建数据区块。 |

#### Request actions

Request actions 用于定义 NocoBase 调用第三方 API 的方式。每个动作都可以配置 HTTP method、URL、Parameters、Body、Headers、响应转换和错误信息转换。

| 动作 | 是否必需 | 说明 |
| --- | --- | --- |
| List | 必需 | 获取资源列表，用于表格、列表、选择器等区块。 |
| Get | 必需 | 获取单条记录详情，用于详情、编辑、关联数据等场景。 |
| Create | 可选 | 创建记录。只有需要通过 NocoBase 新增第三方数据时配置。 |
| Update | 可选 | 更新记录。只有需要通过 NocoBase 编辑第三方数据时配置。 |
| Destroy | 可选 | 删除记录。只有需要通过 NocoBase 删除第三方数据时配置。 |

默认先配置 List 和 Get。确认读取、响应转换和字段映射正确后，再继续配置 Create、Update、Destroy。

##### List

List 用于配置查看资源列表的接口映射。表格区块、列表区块、选择器、关系字段按需加载等场景都会用到 List。

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

List 的响应转换结果必须让 `data` 成为数组，并且数组里的每一项都是对象。分页、过滤、排序可以交给第三方 API 处理；如果第三方 API 不支持分页，NocoBase 会基于转换后的完整列表做分页处理。

##### Get

Get 用于配置查看单条记录详情的接口映射。详情区块、编辑表单、关系字段展示等场景会用到 Get。

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

Get 通常会使用 `request.params.filterByTk` 拼接第三方接口的记录标识，比如 `/users/{{request.params.filterByTk}}`。Get 的响应转换结果必须让 `data` 成为对象。

##### Create

Create 用于配置创建资源的接口映射。只有需要通过 NocoBase 向第三方系统新增数据时才需要配置。

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

Create 通常会把 `request.body` 作为请求体传给第三方 API。如果第三方接口只接受部分字段，可以结合 `request.params.whiteList` 或请求体模板控制提交内容。

##### Update

Update 用于配置更新资源的接口映射。只有需要通过 NocoBase 修改第三方数据时才需要配置。

![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

Update 通常会同时使用 `request.params.filterByTk` 和 `request.body`。前者用于定位记录，后者用于提交更新内容。

##### Destroy

Destroy 用于配置删除资源的接口映射。只有需要通过 NocoBase 删除第三方数据时才需要配置。

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Destroy 通常会使用 `request.params.filterByTk` 定位要删除的记录。配置前需要确认第三方接口的删除语义，比如物理删除、软删除或状态变更。

### 调试 API

配置每个 Request action 时，都可以点击「Try it out」调试接口。调试面板会同时展示 NocoBase 请求变量、第三方 API 请求与响应、转换后的 NocoBase 响应。

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

#### 请求参数映射

第三方 API 的分页、过滤、排序参数不一定和 NocoBase 一致。你需要把 NocoBase 请求变量映射到第三方 API 的 Parameters、Body 或 Headers 中。

比如第三方 API 使用 `page` 和 `limit` 作为分页参数，就可以这样配置：

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

| 第三方 API 参数 | NocoBase 变量 |
| --- | --- |
| `page` | `{{request.params.page}}` |
| `limit` | `{{request.params.pageSize}}` |

:::warning 注意

只有在接口配置中已经引用的变量，才会交给第三方 API 处理。如果没有引用 `request.params.page`，NocoBase 会在转换后的完整列表上做分页处理。

:::

#### 变量

REST API 数据源提供三类变量：

| 变量类型 | 说明 |
| --- | --- |
| 数据源自定义变量 | 来自数据源「Variables」配置，适合复用 token、租户 ID、固定业务参数等值。 |
| NocoBase request | 当前 NocoBase 请求中的参数、请求头、请求体和 token。 |
| Third party response | 第三方 API 的原始响应，当前主要用于响应转换和错误信息转换。 |

NocoBase request 中常用变量如下：

| 变量 | 说明 |
| --- | --- |
| `request.params.page` | 当前页码。 |
| `request.params.pageSize` | 每页数量。 |
| `request.params.filter` | 过滤条件，需要符合 NocoBase Filter 格式。 |
| `request.params.sort` | 排序规则，需要符合 NocoBase Sort 格式。 |
| `request.params.appends` | 按需加载字段，通常用于关系字段。 |
| `request.params.fields` | 只返回哪些字段，类似白名单。 |
| `request.params.except` | 排除哪些字段，类似黑名单。 |
| `request.params.filterByTk` | 单条记录的唯一标识，Get、Update、Destroy 通常会用到。 |
| `request.params.whiteList` | 写入字段白名单，Create、Update 可能会用到。 |
| `request.params.blacklist` | 写入字段黑名单，Create、Update 可能会用到。 |
| `request.body` | Create 或 Update 提交的数据。 |
| `request.headers.x-app` | 当前请求的 `X-App` 请求头。 |
| `request.headers.x-locale` | 当前请求的 `X-Locale` 请求头。 |
| `request.headers.x-hostname` | 当前请求的 `X-Hostname` 请求头。 |
| `request.headers.x-timezone` | 当前请求的 `X-Timezone` 请求头。 |
| `request.headers.x-role` | 当前请求的 `X-Role` 请求头。 |
| `request.headers.x-authenticator` | 当前请求的 `X-Authenticator` 请求头。 |
| `request.token` | 当前 NocoBase 请求的 API token。 |

不同动作可用的请求参数略有不同：

| 动作 | 可用参数 |
| --- | --- |
| List | `page`、`pageSize`、`filter`、`sort`、`appends`、`fields`、`except`。 |
| Get | `filterByTk`、`filter`、`sort`、`appends`、`fields`、`except`。 |
| Create | `whiteList`、`blacklist`、`body`。 |
| Update | `filterByTk`、`filter`、`whiteList`、`blacklist`、`body`。 |
| Destroy | `filterByTk`、`filter`。 |

第三方响应变量主要用于转换响应结果：

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

| 变量 | 说明 |
| --- | --- |
| `rawResponse.body` | 第三方 API 返回的响应体。 |

#### 响应转换

第三方 API 的响应格式可能不是 NocoBase 标准格式。你需要配置响应转换，把第三方 API 返回的数据转换成 NocoBase 可以识别的结构。

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

默认转换规则类似这样：

```json
{
  "data": "{{rawResponse.body}}",
  "meta": {}
}
```

如果第三方接口返回的是嵌套结构，需要根据真实响应调整。比如列表数据在 `rawResponse.body.items` 中，总数在 `rawResponse.body.total` 中，就可以把它们转换到 `data` 和 `meta`。

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

转换时需要关注这些规则：

- List 动作转换后的 `data` 必须是数组
- List 动作的 `data` 数组项必须是对象
- Get 动作转换后的 `data` 必须是对象
- `meta` 可用于保存分页信息，比如总记录数、当前页和每页数量

调试流程可以参考下面的示意图：

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

#### 异常信息转换

第三方 API 出现异常时，响应的错误格式可能不是 NocoBase 标准格式。可以通过「Error message」提取第三方响应中的错误信息，让前端展示更清楚的提示。

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

未配置异常信息转换时，NocoBase 默认会转换为包含 HTTP 状态码的异常信息。

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

配置异常信息转换后，可以把第三方响应中的错误内容提取出来，比如 `{{rawResponse.body.message}}`。

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)

![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

### 编辑 Collection

在 REST API 数据源管理页面，点击某个 Collection 右侧的「Edit」，可以编辑这个资源映射配置。

编辑 Collection 适合处理这些情况：

- 第三方接口地址或 HTTP method 变化
- 第三方接口新增、删除或重命名字段
- 第三方接口响应结构变化，需要调整响应转换
- 需要补充 Create、Update、Destroy 等写入动作
- 需要调整 `Record unique key`

:::warning 注意

编辑 Collection 只会修改 NocoBase 中保存的接口映射和字段元数据，不会修改第三方系统中的接口或数据结构。

:::

### 删除 Collection

在 REST API 数据源管理页面，点击某个 Collection 右侧的「Delete」，可以删除这个 Collection 在 NocoBase 中的映射配置。

删除 Collection 不会调用第三方 API，也不会删除第三方系统中的数据。它只会删除 NocoBase 中保存的 Collection 配置、Request actions 和字段元数据。

:::warning 注意

删除 Collection 后，依赖它的页面区块、权限、工作流和 API 可能无法正常工作。删除前先确认这些配置是否还在使用该 Collection。

:::

### 配置字段

REST API 数据源需要从接口响应中提取字段元数据。字段配置完成后，NocoBase 才能在页面里正确展示、筛选和编辑这些数据。

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

字段提取通常基于 List 或 Get 的调试结果。先让接口成功返回数据，再点击字段提取操作，NocoBase 会根据响应中的对象结构生成字段列表。

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

字段列表会展示字段显示名称、字段名、Field type 和 Field interface。

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

字段配置中需要重点确认：

| 配置 | 说明 |
| --- | --- |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能理解的名称，比如「客户名称」「订单金额」。 |
| Field name | 字段在接口响应中的名称或映射后的内部名称。 |
| Field type | 字段在数据层的类型，比如 `string`、`integer`、`boolean`、`datetime`、`json` 等。 |
| Field interface | 字段在界面中的展示和输入方式，比如单行文本、数字、日期时间、JSON 等。 |
| Record unique key | 用来定位单条记录的唯一字段，通常对应第三方 API 中的 ID。 |

:::tip 提示

- Field Interface（界面类型 / UI 类型）：决定字段在前端如何展示和交互，比如「单行文本」「数字」「日期时间」等
- Field Type（数据类型）：决定 NocoBase 如何识别字段的数据类型，比如 `string`、`integer`、`boolean`、`datetime` 等

:::

#### 字段映射

REST API 数据源的字段来自接口响应，不来自数据库字段。NocoBase 会根据响应值推断 Field type，并匹配一个默认 Field interface。

如果默认推断不符合业务含义，可以在字段配置中手动调整。比如某个字段返回的是字符串，但业务上代表日期，就可以把 Field interface 调整为日期时间相关组件；如果某个字段返回的是对象或数组，可以使用 JSON 相关组件展示。

:::warning 注意

切换 Field type 或 Field interface 不会改变第三方 API 的真实响应格式。它主要影响 NocoBase 页面中的展示、输入、校验和数据提交方式。

:::

#### 标题字段

标题字段用于关系字段选择、关联数据在页面区块展示时默认显示的数据。比如客户资源通常可以把「客户名称」设为标题字段，订单资源可以把「订单编号」设为标题字段。

如果没有设置合适的标题字段，关系字段和关联数据可能只显示内部 ID，不方便业务人员识别。

#### 编辑字段

点击字段右侧的「Edit」可以编辑字段配置。编辑字段适合调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、描述、Field type、Field interface 或字段专属配置。

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

:::warning 注意

编辑字段配置不会修改第三方 API 的字段名称、字段类型或响应结构。如果第三方接口返回结构变化，需要先调整 Request actions 的响应转换，再重新检查字段配置。

:::

#### 删除字段

REST API 数据源中的字段是 NocoBase 保存的字段元数据。删除字段只会移除 NocoBase 中的字段配置，不会影响第三方系统中的真实数据。

如果第三方接口已经不再返回某个字段，可以删除对应字段配置。删除前需要确认页面区块、表单、权限、工作流和 API 是否仍然引用这个字段。

:::warning 注意

删除字段后，依赖该字段的页面区块、权限规则、工作流变量和 API 调用参数可能需要同步调整。

:::

## 添加 REST API 数据源区块

Collection 配置完成后，就可以在页面中添加这个 REST API 数据源的区块。添加区块时选择对应数据源和 Collection，NocoBase 会根据字段配置生成表格、详情、表单等界面。

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)

如果区块无法创建或无法正确查看记录，优先检查：

- `Record unique key` 是否已经设置
- List 和 Get 是否都已经配置并调试通过
- 响应转换后的 `data` 结构是否符合要求
- 字段配置是否和接口响应一致
- 第三方 API 的认证信息是否仍然有效

## 相关链接

- [外部数据库](./database.md) — 通过数据库连接接入已有业务库
- [外部 NocoBase](./nocobase.md) — 连接另一个 NocoBase 应用的数据
- [字段](../field/field.md) — 了解字段元数据和 Field interface
- [数据表](../collection/collection.md) — 了解数据表在 NocoBase 中的作用
