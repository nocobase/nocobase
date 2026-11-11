# 功能与扩展：详情页设计记录

本文记录 PM-1133 / PR #11383 的页面设计约定，供产品、设计和实现人员继续迭代，不是面向最终用户的使用教程，也不代表所有模块均已完成。

- Studio 任务：[PM-1133](https://studio.v2.test.nocobase.com/main/issues/PM-1133)
- PR：[#11383](https://github.com/nocobase/nocobase/pull/11383)
- 工作分支：`agent/PM-1133`
- 源码核对记录（2026-11-08）：`agent/PM-1133`，`88fb71b7ba45bc589c7d4c4da92a0be24442418b`。本文中的文件路径、路由名、接口和条目数都按这一提交的代码核对；代码里找不到的项写作「待获取」，不凭推测补。本记录不表示已包含 `v3-develop` 后续变化或已发布版本。
- 当前阶段：本轮只改文档，待负责人确认后再改页面与测试。本轮没有修改页面代码、没有新增服务端读取接口，也没有修改或运行测试。
- 标注约定：「推荐，待确认」表示按本文已有原则写出的推荐版本，负责人确认前不作为定稿；「代码现状」描述 `88fb71b7` 已实现的行为，「目标」描述按本文调整后的行为。

## 1. 页面面向谁，解决什么问题

面向使用 NocoBase 搭建业务应用的人。读者应能快速了解某项功能的用途、当前应用具体配置了什么，以及如何让 Agent 添加或调整它。

页面不按前端、后端、CLI 等开发分层组织，也不作为包 API 手册、完整教程、业务使用统计或健康检查面板。包标识保留用于识别，技术实现细节放在展开的配置步骤或文档中。

## 2. 入口与目录

### 2.1 入口与路由

| 项目               | 代码现状                                                                                                                                                                  | 来源                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目录页             | `/settings/capabilities`，路由名 `capabilityGuide`，`auth: 'required'`、`page:capability-guide/access`：登录且拥有访问权限才能打开                                        | [client/routes.ts](../../client/routes.ts)、[catalog.ts](../../shared/capability-guide/catalog.ts) 的 `CAPABILITY_GUIDE_PATH`                                                                          |
| 详情页             | `/settings/capabilities/:entryId`，路由名 `capabilityGuideEntry`，权限同上                                                                                                | [client/routes.ts](../../client/routes.ts)                                                                                                                                                             |
| 菜单位置           | 两个模板都把目录页放入「系统设置 → 系统 → 功能与扩展」，并在系统设置首页高亮                                                                                              | [Default 导航整理](../../../../templates/app-template-default/client/lib/navigation-transform.ts)、[Examples 导航整理](../../../../templates/app-template-examples/client/lib/navigation-transform.ts) |
| 模板接入参数       | Default：`settingsGroup: true`、`manifest`、`guideSettingsPath: '/settings'`、`navigation: false`；Examples 同样传入 `manifest`、`guideSettingsPath`、`navigation: false` | [Default client/plugins.ts](../../../../templates/app-template-default/client/plugins.ts)、[Examples client/plugins.ts](../../../../templates/app-template-examples/client/plugins.ts)                 |
| 原「应用使用情况」 | `/foundation`，路由名 `foundation`，`authz: 'unrestricted'`；`navigation: false` 时没有菜单入口，root 等无限制身份直接打开地址进入                                        | [client/routes.ts](../../client/routes.ts) 的 `foundationDefinition`                                                                                                                                   |

- 入口放在「系统设置 → 系统 → 功能与扩展」，不放在独立的侧栏底部入口。
- 内核和插件列在同一目录，提供「全部 / 内核 / 插件」筛选及搜索框；筛选写在地址参数 `source`、`q` 中（`readGuideFilter`），从详情返回时保留。
- 展示完整包名，保留序号，按条目 id 排序（内核为模块名，插件为去掉 `@nocobase/` 的包名）。
- 桌面端延续左侧目录、右侧详情的布局。窄屏保留可用的目录与详情切换，不让长包名和代码撑破页面。
- 顶部面包屑负责层级导航，不在正文重复放「返回目录」。

给实现者的约束：模板测试 `foundation-integration.test.ts` 仍断言目录页在侧栏底部（`splitSidebarNavigation(...).footer`），与上面的菜单位置不一致，属于确认后修 CI 时要按新行为改的测试，本轮不改。

### 2.2 目录生成与合并规则（以代码为准）

目录由 [catalog.ts](../../shared/capability-guide/catalog.ts) 的 `createCapabilityCatalog(manifest)` 生成，规则如下：

1. 读取应用 `package.json` 的 `dependencies`、`devDependencies`、`optionalDependencies`、`peerDependencies` 中声明的全部包名。
2. 名称匹配 `app-plugin-*` 的包全部列为插件条目，包括示例插件和仅发布 Skill 的插件；[entries.ts](../../shared/capability-guide/entries.ts) 没有文案的插件也列出（`known: false`）。
3. 内核只列 `entries.ts` 中 `source: 'kernel'` 的模块：`db`、`jobs`、`lifecycle`、`queue`、`realtime`，以及仅在应用没有声明 `@nocobase/app-plugin-i18n` 时才单独列出的 `i18n`。
4. 不单独列出：`app-client`、`app-server`、`service-provider`（应用框架）；`authorization` 并入 `app-plugin-authorization`，`concurrency` 并入 `app-plugin-concurrency`，`drive` 并入 `app-plugin-file`（`KERNEL_NOT_LISTED`）。并入的内核记在条目的 `covers` 中。
5. 多语言：应用声明了 `app-plugin-i18n` 时，`@nocobase/i18n` 不再单独列出，只保留一个可见条目；访问 `/settings/capabilities/i18n` 时 `find('i18n')` 回退到 `app-plugin-i18n`，两者共用 [i18n 详情](../../client/capability-guide/details/i18n-overview.tsx)。
6. 授权：`app-plugin-authz-default-access`、`app-plugin-authz-sharing-rules`、`app-plugin-authz-restriction-rules` 仍是三个独立目录条目，与 `app-plugin-authorization` 共用同一篇[授权详情](../../client/capability-guide/details/authorization-overview.tsx)（`builtInDetailLoaders`）。共用内容不减少目录条目数。

### 2.3 Default / Examples 目录条目数

按 `88fb71b7` 的模板 `package.json` 运行 `createCapabilityCatalog` 得到：

| 应用                                | 条目总数 | 插件 | 其中示例插件 | 内核                                              |
| ----------------------------------- | -------- | ---- | ------------ | ------------------------------------------------- |
| Default（`app-template-default`）   | 25       | 20   | 0            | 5：`db`、`jobs`、`lifecycle`、`queue`、`realtime` |
| Examples（`app-template-examples`） | 41       | 36   | 16           | 5：同上                                           |

与 issue 验收里的 26 / 42 不一致：两个模板各少 1 项。原因是 `88fb71b7` 之前，`@nocobase/i18n` 内核与 `app-plugin-i18n` 插件分别列为两个条目；现在两个模板都声明了 `app-plugin-i18n`，按规则 5 合并为一个条目。授权与 `authz-*` 共用内容不影响条目数（规则 6）。26 / 42 应在 issue 和方案中更正为 25 / 41；数量仍随应用依赖变化，不写死。

两个模板测试的标题仍写 “six core modules”，断言已是五个内核（`['db', 'jobs', 'lifecycle', 'queue', 'realtime']`），标题待修 CI 时同步，本轮不改。

## 3. 详情页的三块结构

### 3.1 是什么

顶部保留功能名称、内核或插件标记、完整包名、一句用途说明及「阅读文档」链接。

用途应说明读者能获得什么，例如「查看应用的数据库连接、数据表和字段，了解数据结构」。不在文档链接下再次重复介绍，不放「AI 与知识」等分类标签，不把安装步骤或技术名词堆在首屏。

`Agent` 保持英文，不翻译为「智能体」。

### 3.2 当前应用

展示对象取决于模块性质，不能把所有模块都套成「是否有界面」，也不能全都套成「插件是否安装」。

| 模块性质 | 展示什么                                             | 典型模块                             |
| -------- | ---------------------------------------------------- | ------------------------------------ |
| 配置型   | 实际生效的默认项、配置列表、数量和必要属性           | 并发、数据库连接、jobs、queue        |
| 界面型   | 应用实际提供的具体界面及入口，分别标明已配置或未配置 | API 密钥、数据库浏览器               |
| 组合型   | 配置与资源分别展示，避免一个总状态覆盖不同事实       | 文件存储与文件表、认证方式与登录界面 |

#### 状态表

每一行只显示下表中的一种状态。页面文案统一使用这 7 个词，不再使用「待确认」「配置待完善」「配置情况暂不可确认」「已接入 / 未接入」。

| 状态     | 页面显示的文案 | 判定条件                                                                                           | 是否显示入口                                                   |
| -------- | -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 已配置   | 已配置         | 读取来源完整返回，且确认对象存在：界面型为路由表中找到满足条件的真实页面；配置型为读到实际生效配置 | 界面型显示「打开界面」；配置型显示配置摘要，必要时链接管理界面 |
| 未配置   | 未配置         | 读取来源完整返回，且确认对象不存在：路由表中没有该页面，或配置中没有该项                           | 不显示入口，第三块给出添加操作                                 |
| 已停用   | 已停用         | 配置存在，但读取结果明确标记为停用（如 `enabled: false` 的渠道）                                   | 列出配置摘要，不当作未配置                                     |
| 无权限   | 无权访问       | 对象存在，但当前用户的页面权限检查不通过，或读取接口返回 403                                       | 不显示入口，提示「请联系管理员」；不写成未配置                 |
| 加载中   | 正在读取       | 读取请求或权限检查尚未完成                                                                         | 不显示入口，也不先显示「未配置」                               |
| 读取失败 | 读取失败       | 读取接口返回 401 以外的错误或网络失败；401 显示「登录已过期」                                      | 提供「重试」；不写成未配置或 0                                 |
| 待获取   | 待获取         | 当前没有可用的读取来源（本文表格中标「待补摘要」或没有接口的行）                                   | 不显示入口；页面可附一句「当前版本暂未读取此项」               |

其他规则：

- 已确认提供的界面显示入口；当前用户没有访问权限时显示「无权访问」，不写成未配置。
- 配置型模块优先展示实际值，不用一个「已配置」徽标替代配置内容。
- 只有完整读取确认没有条目时，才显示「无」或 0；部分数据不能冒充总数。读取范围受当前用户权限限制时标明「我可见的」。
- 模板默认值、`config.yml` 内容和实际生效配置不是同一个概念。需考虑配置工厂、环境变量覆盖以及运行时是否要求重启。
- 注册插件、存在配置项、存在管理界面、存在业务记录、服务连接正常，是不同事实，不互相替代。
- 不为了判断配置而创建表、写记录、初始化外部服务或执行昂贵扫描。
- 配置摘要采用允许展示的字段清单，不直接返回完整配置，不展示密码、访问密钥等凭据。

给实现者的约束（代码现状与状态表的差异，修页面时一并处理）：

- [detail-layout.tsx](../../client/capability-guide/details/detail-layout.tsx) 的 `ConfigurationItem` 在 `state === undefined` 时显示 `featureOverview.layout.unknown`，中文为「待确认」（[feature-overview-zh-CN.ts](../../client/capability-guide/details/feature-overview-zh-CN.ts)）；应改为「待获取」，并区分「读取失败」。
- 同文件的 `featureOverview.status` 仍有 `unknown: '配置情况暂不可确认'`、`partial: '配置待完善'`，不在状态表中，应删除或改为对应状态。
- `InterfaceItem` 只要路由表中找不到页面就显示「未配置」；路由表来自客户端运行时，同步可得，这一判定成立。权限检查进行中只在找到页面时显示「正在检查访问权限」，状态徽标同时已是「已配置」，应改为「加载中」直到权限检查完成。
- 并发、文件管理中已有的「待获取」用法与状态表一致，保留。
- [plugin-integration-status.tsx](../../client/capability-guide/details/plugin-integration-status.tsx) 当前没有被任何详情引用，它读取的 `GET /api/foundation/registrations` 只允许无限制身份（root）。指南登录即可访问，不能用它作为普通用户的状态来源；修页面时建议删除这个未使用组件，或只在运行时视图中使用。

#### 「当前应用」表格列

第 5、6 节每个模块的「当前应用」都使用下表的列，6.16 节保留为逐项确认模板：

| 列       | 含义                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| 行       | 页面上这一行的标题（页面显示的文案）                                                                             |
| 展示对象 | 界面、配置项、资源目录或 Skill                                                                                   |
| 读取来源 | 具体文件、路由名或接口；代码里没有的写「待获取」                                                                 |
| 范围     | 应用级、当前用户可见范围、单个配置等                                                                             |
| 状态     | 按状态表判定，写明本行可能出现的状态                                                                             |
| 入口     | 已配置时打开的真实路径；没有则写「—」                                                                            |
| 接口     | 「已有接口」：代码中已存在、可直接读取的来源（含客户端路由表和公开配置）；「待补摘要」：需要新增受保护的读取摘要 |

### 3.3 通过 Agent 添加或完善

第三块同时容纳「没有怎么添加」和「还可以配置什么」，不再单独增加第四块。

- 未配置：说明通过 Agent 如何添加对应功能或界面。
- 已配置：说明还可以配置、完善或扩展什么；已配置的功能仍有后续指引。
- 每个操作表达一个明确目标，折叠时显示短标题和一句说明，展开后提供可编辑、可复制的 Agent 提示词及配置步骤。复制的是编辑框内当前内容，不追加隐藏文字。
- 示例明确标注为示例，不能放进当前配置区充当真实数据。

配置型模块围绕可选配置方式组织，例如「跨实例协调」「增加独立服务」「切换默认服务」。界面型模块围绕添加或完善页面、调整访问权限组织。不要用无差别的「完善此功能」配同一段提示词。

不在正文恢复完整的「可以做什么、操作教程、权限原理、故障排查、使用场景」长文；必要信息合并到对应操作或外部文档。

给实现者的约束：通用详情 [feature-overview.tsx](../../client/capability-guide/details/feature-overview.tsx) 目前给每个模块固定两个操作「添加或完善{{feature}}」和 `extendTitle`，第二个操作的提示词是 `improvePrompt` 加上第一个操作的完整提示词；第 6 节各模块应改为本文列出的专属操作，不再拼接通用提示词。

## 4. Agent 提示词怎么写

提示词应像用户直接交给 Agent 的需求，描述目标、业务用途和少量关键选择。默认提供可替换的具体例子，用 `【】` 标出需要修改的内容，不要求用户先知道接口、字段类型和内部服务名称。

不在提示词中堆积「先阅读某个 Skill、检查某个 Token、不要修改迁移、不要暴露凭据……」等实现清单。Agent 如何实现由对应 Skill、源码和展开的配置步骤约束。只有会影响需求结果的业务限制才进入提示词，例如谁可以查看附件、是否切换默认存储。

文件存储示例：

> 帮我为应用添加【阿里云 OSS】文件存储，用于保存【合同附件】。请结合现有配置完成设置，并告诉我还需要提供哪些信息。

文件表示例：

> 帮我为【合同附件】配置文件表，使用【当前默认数据库】保存文件记录，文件存放在【local 存储】。允许【合同相关人员】上传、查看和下载。已有合适的文件表时优先复用。

代码现状：文件管理页面已按这一写法改写。API 密钥、身份认证、授权、AI Agent、多语言及第 6 节通用详情中的提示词仍是较长的实现清单（例如 [feature-overview-zh-CN.ts](../../client/capability-guide/details/feature-overview-zh-CN.ts) 的 API 密钥提示词），第 5、6 节给出的提示词示例是改写目标，均为「推荐，待确认」。

## 5. 已重点讨论的模块

每个模块按同一格式：是什么 / 当前应用 / 通过 Agent 添加或完善 / 配置步骤与边界 / 读取来源与缺口。其中「是什么」「当前应用」的行标题、「通过 Agent 添加或完善」的操作和提示词、配置步骤属于**页面显示的文案**；**给实现者的约束**单独列出，不进页面正文。

### 5.1 数据库（`db`）

**是什么**（页面文案）：查看应用的数据库连接、数据表和字段，了解数据结构。

**当前应用**

| 行                         | 展示对象                                                                 | 读取来源                                                                                                        | 范围                 | 状态                                                            | 入口                                                                          | 接口     |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| 数据库连接（每个连接一行） | 连接名称、是否默认、方言、驱动、结构管理方式、数据库名、schema、命名方式 | `GET /api/databaseExplorer/connections`（`databaseExplorerListConnections`），返回 `ConnectionSummary` 允许字段 | 应用全部连接，不分页 | 已配置 / 未配置（返回空列表）/ 无权限（403）/ 加载中 / 读取失败 | 数据库浏览器路由 `databaseExplorer` 存在时链接 `?connection=<name>`           | 已有接口 |
| 数据表与字段               | 进入数据库浏览器查看                                                     | 路由名 `databaseExplorer`                                                                                       | 同上                 | 随数据库浏览器界面                                              | Default `/settings/database-explorer`、Examples `/settings/database-explorer` | 已有接口 |

**通过 Agent 添加或完善**（页面文案）

- 「新增数据库连接」：接入一个新的业务数据库，保留已有连接。保留结构化的类型、名称和用途输入（[database-connection-prompt.tsx](../../client/capability-guide/details/database-connection-prompt.tsx)）。
- 「调整数据库连接配置」：调整默认连接、结构管理方式和连接参数。

> 帮我为应用接入一个【PostgreSQL】数据库，命名为【erp】，用于读取【ERP 中的订单和客户数据】。这个库由【外部系统】维护，应用只读取，不修改它的表结构。保留现有连接，并告诉我需要提供哪些连接信息。

**配置步骤与边界**（展开内容）：先确认连接用途和结构归属（应用管理或外部维护），再在配置中增加连接，凭据通过环境变量提供，完成后在数据库浏览器中核对数据表。

**给实现者的约束**

- 连接配置不展示凭据和主机地址；`ConnectionSummary` 是允许字段清单，不做脱敏后返回完整配置。
- 读取到配置或表结构不等于完整健康检查；列表读取不打开数据库连接。
- 接口需要 `page:database-explorer/access` 授权；无此授权的用户应看到「无权访问」，不是「未配置」。

**读取来源与缺口**：[database-overview.tsx](../../client/capability-guide/details/database-overview.tsx)、[数据库浏览器路由](../../../app-plugin-database-explorer/server/routes/index.ts)、[ConnectionSummary](../../../app-plugin-database-explorer/server/types.ts)。无「待获取」项。

### 5.2 数据库浏览器（`app-plugin-database-explorer`）

**是什么**（页面文案）：按连接浏览数据表和字段，需要时查看实际数据库结构。

**当前应用**

| 行               | 展示对象           | 读取来源                                                   | 范围   | 状态                              | 入口                                                                                                           | 接口     |
| ---------------- | ------------------ | ---------------------------------------------------------- | ------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| 数据库浏览器界面 | 浏览页面           | 客户端路由表中路由名 `databaseExplorer`（`InterfaceItem`） | 应用级 | 已配置 / 未配置 / 无权限 / 加载中 | Default 写作 `settings` 下的 `/database-explorer`，Examples 直接写 `/settings/database-explorer`，最终地址相同 | 已有接口 |
| 数据库连接配置   | 链接到数据库详情页 | —                                                          | —      | 不单独判定                        | `/settings/capabilities/db`                                                                                    | —        |

两个模板都由模板自己注册这个页面（[Default](../../../../templates/app-template-default/client/pages/settings/database-explorer/routes.ts)、[Examples](../../../../templates/app-template-examples/client/pages/settings/database-explorer/routes.ts)），插件客户端不注册路由。

**通过 Agent 添加或完善**（页面文案）

- 「添加或完善浏览界面」：在系统设置中提供数据库浏览器。
- 「调整访问权限」：决定哪些角色可以查看数据结构。

> 帮我在系统设置中添加数据库浏览器，让【应用管理员】查看各数据库连接下的数据表和字段。普通成员不能进入。

**配置步骤与边界**（展开内容）：注册浏览页面并放入系统设置，再为需要的角色授予数据库浏览权限。

**给实现者的约束**

- 插件以 `page:database-explorer/access` 控制整个浏览器，页面与接口使用同一授权；不提供按连接、数据表或字段分别授权。业务记录权限与结构浏览权限不是同一件事；不把前端过滤当作权限隔离。
- 不在本篇承诺在线建表或编辑业务记录。添加界面的提示词不能写成让 Agent 临时检查某张业务表。

**读取来源与缺口**：[database-explorer-overview.tsx](../../client/capability-guide/details/database-explorer-overview.tsx)、[数据库浏览器 Skill](../../../app-plugin-database-explorer/skills/nocobase-app-plugin-database-explorer/SKILL.md)。无「待获取」项。

### 5.3 并发（`app-plugin-concurrency`，含 `@nocobase/concurrency`）

**是什么**（页面文案）：让同一业务资源上的关键操作按顺序执行，避免同时处理导致数据冲突。

**当前应用**

| 行             | 展示对象                                | 读取来源                                                                                                                                                        | 范围   | 状态   | 入口 | 接口     |
| -------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---- | -------- |
| 默认服务       | `concurrency` 配置的默认服务名          | 待获取：服务端读取 `app.config.get('concurrency')`（[providers/concurrency.ts](../../../app-plugin-concurrency/server/providers/concurrency.ts)），没有对外接口 | 应用级 | 待获取 | —    | 待补摘要 |
| 实现方式       | 默认服务的实现（如 `memory` → `mutex`） | 同上                                                                                                                                                            | 应用级 | 待获取 | —    | 待补摘要 |
| 协调范围       | 单进程或跨实例                          | 同上                                                                                                                                                            | 应用级 | 待获取 | —    | 待补摘要 |
| 命名空间       | 实际命名空间                            | 同上                                                                                                                                                            | 应用级 | 待获取 | —    | 待补摘要 |
| 其他已配置服务 | 其余命名服务名称与实现                  | 同上                                                                                                                                                            | 应用级 | 待获取 | —    | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「改为跨实例协调」「增加独立的并发服务」「切换默认服务」。

> 应用将部署为【多个实例】，帮我把并发服务改为跨实例协调，保留现有服务名称，并告诉我需要安装哪些扩展和提供哪些连接信息。

**配置步骤与边界**（展开内容）：确认部署实例数和共享实现，按实现指南配置服务和命名空间，凭据走环境变量，修改后各实例统一重启。

**给实现者的约束**

- 标准配置工厂默认选择 `memory`，实现为 `mutex`，只在单个进程内协调；命名空间默认使用应用名；配置更改需要重启。这些是默认值，不能填作当前值。
- 共享实现的安装条件和配置以对应插件为准，不把 Redis 当成已安装能力。互斥不等于请求幂等。
- 只展示配置，不检查哪些业务使用了服务，不展示「暂不提供业务使用清单」等说明；移除给业务操作加锁的代码教程。

**读取来源与缺口**：[concurrency-overview.tsx](../../client/capability-guide/details/concurrency-overview.tsx) 目前所有行显示「待获取」。需要的读取接口：受保护的并发配置摘要，返回默认服务名，以及每个命名服务的名称、实现、协调范围、命名空间，不返回连接参数。

### 5.4 文件管理（`app-plugin-file`，含 `@nocobase/drive`）

**是什么**（页面文案）：配置文件存放位置，并为业务数据提供附件上传、查看和下载。

**当前应用**

| 行                         | 展示对象                               | 读取来源                                                                                                            | 范围                       | 状态   | 入口 | 接口     |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------ | ---- | -------- |
| 默认存储                   | `drive` 默认存储名称                   | 待获取：drive 配置解析在 [app-server drive/config.ts](../../../../app/app-server/src/drive/config.ts)，没有对外接口 | 应用级                     | 待获取 | —    | 待补摘要 |
| 已配置存储（每个存储一行） | 名称、类型、可见性                     | 同上                                                                                                                | 应用级                     | 待获取 | —    | 待补摘要 |
| 文件表（每张表一行）       | 所属连接、逻辑表名、上传存储、接口资源 | 待获取：插件没有文件表清单接口（[file/server](../../../app-plugin-file/server/routes.ts) 只提供文件资源接口）       | 应用级，按连接和逻辑表去重 | 待获取 | —    | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「配置文件存储（drive）」「新增或配置文件表」，提示词见第 4 节两个示例。

**配置步骤与边界**（展开内容）：存储写入 `drive` 配置；文件表通过新的应用迁移创建，并在应用代码中声明 File Repository 资源；仅增加存储不会创建文件表；切换默认存储不会移动已有文件。

**给实现者的约束**

- `drive` 决定文件存储位置，不负责自动创建文件表。切换默认存储不会迁移已有对象，也不会重写历史文件记录。
- 文件表计数按连接和逻辑表去重，同一张表可能被多个资源使用。不能只根据表名含 file、字段名、默认连接或看到一个接口就声称得到全部文件表。上传资源选择的 disk 也不代表历史记录只来自这一个存储。
- `private` 不等于下载接口已经受保护；File Repository 资源接口和内容路径都需要应用的访问控制。元数据删除与实际对象删除不是同一个操作。
- 现有 foundation 运行时视图的历史扫描不能作为完整、实时、跨连接的文件表清单。

**读取来源与缺口**：[file-overview.tsx](../../client/capability-guide/details/file-overview.tsx)、[文件插件 Skill](../../../app-plugin-file/skills/nocobase-app-plugin-file/SKILL.md)、[Drive Skill](../../../../libs/drive/skills/nocobase-drive/SKILL.md)。需要的读取接口：存储摘要（默认存储名，每个存储的名称、类型、可见性，不含凭据）；文件表目录（已登记的 File Repository 资源及其连接、逻辑表名、上传存储）。

### 5.5 API 密钥（`app-plugin-api-keys`）

**是什么**（页面文案）：为脚本、定时任务和外部系统创建独立的访问密钥，按所属账号的权限调用应用接口。

**当前应用**

| 行                | 展示对象                   | 读取来源                                                                                                                                                                                      | 范围   | 状态                              | 入口     | 接口     |
| ----------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------- | -------- | -------- |
| 我的 API 密钥界面 | 当前账号管理自己密钥的页面 | 客户端路由表中路由名 `apiKeysManagement`，且 `auth: 'required'`、有 `componentLoader`、固定路径（[capability-management.ts](../../client/capability-guide/details/capability-management.ts)） | 应用级 | 已配置 / 未配置 / 无权限 / 加载中 | 页面路径 | 已有接口 |
| 应用 API 密钥界面 | 管理员管理应用级密钥的页面 | 路由名 `applicationApiKeysManagement`，条件同上                                                                                                                                               | 应用级 | 已配置 / 未配置 / 无权限 / 加载中 | 页面路径 | 已有接口 |

代码核对：两个模板和 api-keys 插件都没有注册 `apiKeysManagement` 或 `applicationApiKeysManagement` 路由（插件客户端不提供页面，见 [API 密钥 Skill](../../../app-plugin-api-keys/skills/nocobase-app-plugin-api-keys/SKILL.md)），因此 Default 和 Examples 两行都是「未配置」。

**通过 Agent 添加或完善**（页面文案）

- 「添加我的 API 密钥界面」（建议入口：账号菜单）。

> 帮我在账号菜单中添加「我的 API 密钥」页面，让用户为【报表同步脚本】这类外部调用创建、轮换和撤销自己的密钥。密钥只在创建时完整显示一次，权限不超过用户本人。

- 「添加应用 API 密钥界面」（建议入口：系统设置）。

> 帮我在系统设置中添加「应用 API 密钥」管理页面，让【应用管理员】查看和撤销【全部成员】创建的密钥。先告诉我现有能力是否支持这种管理范围，缺少的部分需要我确认后再做。

- 已配置时：「调整密钥的创建规则」「限定密钥的权限范围」（推荐，待确认）。

**配置步骤与边界**（展开内容）：在应用中注册真实页面并放入对应菜单，使用稳定路由名 `apiKeysManagement` / `applicationApiKeysManagement`，「功能与扩展」据此识别；不手工标记已配置。

**给实现者的约束**

- 不能根据插件已注册、接口存在或已有密钥记录，就显示界面已配置。
- 现有 `/api/apiKeys` 系列接口（`apiKeysListKeys`、`apiKeysCreateKey`、`apiKeysRotateKey`、`apiKeysRevokeKey`、`apiKeysListScopeOptions`）和 Better Auth 的 `/api/auth/api-key/*` 只操作当前账号的密钥；应用级管理没有现成接口。「应用 API 密钥」的持有者和管理范围在实现前需确认，不从界面名称推断后端能力。
- 正文不恢复调用教程、权限原理和故障排查长文。

**读取来源与缺口**：[api-keys-readiness.tsx](../../client/capability-guide/details/api-keys-readiness.tsx)、[api-keys 路由](../../../app-plugin-api-keys/server/routes/index.ts)。两行都已有读取来源，无「待获取」项；应用级管理接口属于后续业务实现，不是本页的读取接口。

### 5.6 身份认证（`app-plugin-authentication`）

**是什么**（页面文案）：管理用户如何登录应用，包括密码登录、自助注册、找回密码和命令行设备登录。

**当前应用**

| 行                         | 展示对象                 | 读取来源                                                                                                                                         | 范围   | 状态                                                                    | 入口               | 接口     |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------- | ------------------ | -------- |
| 密码登录                   | 登录页及密码登录开关     | 完整路由表（`app.runtime.routes`，含访客页）中路由名 `login`；公开配置 `auth.emailAndPassword.enabled`                                           | 应用级 | 已配置 / 未配置（无登录页或开关为 false）/ 待获取（公开配置未提供开关） | `/login`           | 已有接口 |
| 自助注册                   | 注册页及注册开关         | 路由名 `register`、`login`；`useSignUpAvailable()`（读 `auth.emailAndPassword.disableSignUp`）                                                   | 应用级 | 已配置 / 未配置 / 待获取                                                | `/register`        | 已有接口 |
| 找回密码                   | 找回与重置页面、发信能力 | 路由名 `forgot-password`、`reset-password`；`GET /api/authentication/capabilities`（`authenticationGetCapabilities`）的 `passwordResetAvailable` | 应用级 | 已配置 / 未配置 / 加载中 / 读取失败                                     | `/forgot-password` | 已有接口 |
| CLI / 设备登录             | 设备授权页               | 路由名 `device`                                                                                                                                  | 应用级 | 已配置 / 未配置                                                         | `/device`          | 已有接口 |
| 企业或第三方登录、双重验证 | 已启用的额外登录方式     | 待获取：公开配置和路由中没有可枚举已启用登录方式的来源                                                                                           | 应用级 | 待获取                                                                  | —                  | 待补摘要 |

两个模板都注册了 `login`、`register`、`forgot-password`、`reset-password`、`device`（[Default routes.ts](../../../../templates/app-template-default/client/routes.ts)、[Examples routes.ts](../../../../templates/app-template-examples/client/routes.ts)）。

**通过 Agent 添加或完善**（页面文案）：「添加或调整登录页面」「开放或关闭自助注册」「配置找回密码」「增加企业或第三方登录」「增加双重验证或通行密钥」「配置 CLI / 设备登录」（沿用 [authentication-overview-zh-CN.ts](../../client/capability-guide/details/authentication-overview-zh-CN.ts) 的操作）。

> 帮我开放自助注册，只允许【@example.com】邮箱的员工注册，注册后默认没有任何业务权限，由管理员再分配角色。

> 帮我配置找回密码，使用应用已有的【system】发信服务发送重置邮件，并告诉我还缺哪些配置。

> 帮我为【内部员工】增加【企业微信】登录，外部协作者继续使用账号密码。登录后的业务权限保持不变。

**配置步骤与边界**（展开内容）：确定登录人群和方式，核对 `auth` 配置、公开访问地址和发信服务，让登录、注册、找回密码页面与实际启用的方式一致，验证登录、退出和过期会话。

**给实现者的约束**

- 访客页面不在登录后的业务路由树里，必须读完整路由表。
- 不能因为插件存在就认定所有方式已配置；提供了「增加企业登录或双重验证」的操作不代表已启用。
- 登录成功不代表可以访问全部业务，认证与授权分开描述。

**读取来源与缺口**：[authentication-overview.tsx](../../client/capability-guide/details/authentication-overview.tsx)、[认证路由](../../../app-plugin-authentication/server/routes/index.ts)、[认证 Skill](../../../app-plugin-authentication/skills/nocobase-app-plugin-authentication/SKILL.md)。待获取：已启用的额外登录方式（企业登录、第三方登录、双重验证、通行密钥），需要公开或受保护的「已启用登录方式」摘要，只返回方式类型和显示名，不返回客户端密钥。

### 5.7 授权（`app-plugin-authorization` 及 `app-plugin-authz-*`）

**是什么**（页面文案）：控制谁能进入哪些页面、执行哪些操作、看到哪些数据。

**当前应用**

| 行                   | 展示对象             | 读取来源                          | 范围   | 状态                              | 入口                                                              | 接口     |
| -------------------- | -------------------- | --------------------------------- | ------ | --------------------------------- | ----------------------------------------------------------------- | -------- |
| 角色与权限配置界面   | 权限集管理页         | 路由名 `settingsRoles`            | 应用级 | 已配置 / 未配置 / 无权限 / 加载中 | `/settings/roles`（模板 `permissionManagement` 下，按路由表解析） | 已有接口 |
| 用户角色分配界面     | 给用户分配角色的页面 | 路由名 `settingsUsers`            | 应用级 | 同上                              | `/settings/users`                                                 | 已有接口 |
| 默认数据范围管理界面 | 默认数据范围规则页   | 路由名 `settingsDefaultAccess`    | 应用级 | 同上                              | `/settings/default-access`                                        | 已有接口 |
| 共享规则管理界面     | 共享规则页           | 路由名 `settingsSharingRules`     | 应用级 | 同上                              | —                                                                 | 已有接口 |
| 限制规则管理界面     | 限制规则页           | 路由名 `settingsRestrictionRules` | 应用级 | 同上                              | —                                                                 | 已有接口 |

代码核对：两个模板都在 `client/pages/settings/routes.ts` 中准备了 `settingsRoles`、`settingsUsers`、`settingsDefaultAccess`（[Default](../../../../templates/app-template-default/client/pages/settings/routes.ts)、[Examples](../../../../templates/app-template-examples/client/pages/settings/routes.ts)）。Examples 在 `client/routes.ts` 中注册了这组路由，三行为「已配置」；Default 的 `client/routes.ts` 没有注册它（模板 AGENTS.md：开发业务时才注册），三行为「未配置」。`settingsSharingRules`、`settingsRestrictionRules` 在两个模板和对应插件中都不存在，两个应用都是「未配置」。

**通过 Agent 添加或完善**（页面文案）：「为业务功能补齐权限控制」「配置角色的页面、操作和数据范围」「给指定用户分配或调整角色」「配置共同可访问的默认数据范围」「添加共享管理界面与共享规则」「添加限制管理界面与限制规则」。

> 帮我为【采购订单】配置权限：【采购员】可以创建和编辑自己提交的订单，【采购经理】可以查看和审批本部门的全部订单，其他人看不到。用普通账号验证一遍。

> 帮我添加共享规则管理，让【项目负责人】可以把【项目文档】的查看权限共享给【指定同事】，共享不扩大对方的操作权限。

> 帮我添加限制规则管理，让【外包人员】在【客户资料】中只能看到【自己负责的客户】。

**配置步骤与边界**（展开内容）：先确定角色和业务操作，再配置页面、操作和数据范围，给明确的用户分配角色，最后用普通账号验证按钮和接口都按预期拒绝。

**给实现者的约束**

- 管理界面存在不等于已经有授权记录；角色配置与人员分配分开。默认数据范围不能凭空授予操作权限；共享规则只在已有操作权限下扩大数据范围，限制规则只缩小，不能统一写成「扩大或缩小任意数据权限」。不编造字段级授权编辑器。
- 「用户角色分配界面」目前借用用户管理路由 `settingsUsers` 判定，与 6.7 用户管理是同一页面；推荐保留，因为分配角色就在用户管理页完成（推荐，待确认）。
- 本轮按管理界面判断状态，不以授权记录数量作为判定依据。不为了让预览变成已配置而修改真实权限。

**读取来源与缺口**：[authorization-overview.tsx](../../client/capability-guide/details/authorization-overview.tsx)、[authorization-overview-zh-CN.ts](../../client/capability-guide/details/authorization-overview-zh-CN.ts)、授权 Skills（[主插件](../../../app-plugin-authorization/skills/nocobase-app-plugin-authorization/SKILL.md)、[默认数据范围](../../../app-plugin-authz-default-access/skills/nocobase-app-plugin-authz-default-access/SKILL.md)、[共享规则](../../../app-plugin-authz-sharing-rules/skills/nocobase-app-plugin-authz-sharing-rules/SKILL.md)、[限制规则](../../../app-plugin-authz-restriction-rules/skills/nocobase-app-plugin-authz-restriction-rules/SKILL.md)）。五行都已有读取来源，无「待获取」项。

### 5.8 AI Agent（`app-plugin-agents`）

**是什么**（页面文案）：在应用中接入模型服务、AI 对话、业务 Skills 和机器上的 Agent，让 AI 参与业务工作。

**当前应用**

| 行               | 展示对象             | 读取来源                                                                                     | 范围       | 状态                              | 入口     | 接口               |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------------- | ---------- | --------------------------------- | -------- | ------------------ |
| Agent 管理界面   | Agent 列表页         | 路由名 `agents`（[agents client/routes.ts](../../../app-plugin-agents/client/routes.ts)）    | 应用级     | 已配置 / 未配置 / 无权限 / 加载中 | 页面路径 | 已有接口           |
| 模型管理界面     | 模型服务页           | 路由名 `models`                                                                              | 应用级     | 同上                              | 页面路径 | 已有接口           |
| Skills 管理界面  | Skills 页            | 路由名 `skills`                                                                              | 应用级     | 同上                              | 页面路径 | 已有接口           |
| 机器连接界面     | Runner 页            | 路由名 `runtimes`                                                                            | 应用级     | 同上                              | 页面路径 | 已有接口           |
| 用量查看界面     | 用量与价格页         | 路由名 `usage`                                                                               | 应用级     | 同上                              | 页面路径 | 已有接口           |
| 已配置的模型服务 | 模型服务名称和提供方 | 待获取：已有 `agentsListModelServices`，但 foundation 尚未接入，需核对其权限是否允许指南调用 | 按接口权限 | 待获取                            | —        | 已有接口（未接入） |

代码核对：Examples 在 `client/plugins.ts` 注册了 `agents()`，五个界面由插件提供；Default 依赖了 `app-plugin-agents`，但客户端没有注册 `agents()`，五个界面均为「未配置」。

**通过 Agent 添加或完善**（页面文案）：「给业务页面增加 AI 对话」「让 AI 按团队规范完成工作」「让机器上的 Agent 处理项目任务」，未配置时增加「启用 AI Agent 管理界面」（推荐，待确认）。

> 帮我在【客户详情页】增加 AI 对话，让【销售】可以就当前客户提问和整理跟进记录。AI 只能读取该销售有权查看的数据，使用应用已有的模型服务。

> 帮我把【报价单审核规范】整理成一个业务 Skill，让 AI 在【审核报价】时按这个规范给出意见。

> 帮我在应用中启用 AI Agent 的管理界面，让【应用管理员】配置模型服务、Skills 和机器连接，并查看用量。

**配置步骤与边界**（展开内容）：先配置模型服务，再按业务需要添加对话入口和 Skills；连接机器上的 Agent 时由管理员生成注册凭据并在机器上完成连接。

**给实现者的约束**

- 按模型服务、对话、Skills、业务工具、机器 Agent、用量组织，不按前端和后端注册分组。安装依赖不代表模型、Runner 或业务工具已可用。
- 路由名 `agents`、`models`、`skills`、`runtimes`、`usage` 较通用，`findCapabilityPage` 只按名称匹配，其他插件或应用使用同名路由时会误判；修页面时应同时比对 `route.packageName === '@nocobase/app-plugin-agents'`（推荐，待确认）。

**读取来源与缺口**：[agents-overview.tsx](../../client/capability-guide/details/agents-overview.tsx)、[Agents Skill](../../../app-plugin-agents/skills/nocobase-app-plugin-agents/SKILL.md)。待获取：已配置的模型服务和已连接的机器，需要确认 `agentsListModelServices`、`agentsListRunners` 对普通管理员的权限后接入，或补充只返回数量与名称的受保护摘要。

### 5.9 多语言（`app-plugin-i18n`，含 `@nocobase/i18n`）

**是什么**（页面文案）：为应用提供多种界面语言，让用户选择自己使用的语言。

**当前应用**

| 行             | 展示对象                 | 读取来源                                                                                                                 | 范围   | 状态                                | 入口 | 接口     |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------- | ---- | -------- |
| 可用语言       | 界面语言列表             | 客户端 `useI18nRuntime().getLocaleDefinitions()`                                                                         | 应用级 | 已配置（至少一种）/ 未配置          | —    | 已有接口 |
| 默认语言       | 新用户首次访问使用的语言 | `getDefaultLocale()`；服务端配置 `i18n.defaultLocale`（[app-server i18n](../../../../app/app-server/src/i18n/index.ts)） | 应用级 | 已配置 / 未配置                     | —    | 已有接口 |
| 语言切换入口   | 账号菜单中的切换器       | 代码现状：以「可用语言多于一种」代替；目标：读取应用是否实际提供切换器，待获取                                           | 应用级 | 待获取                              | —    | 待补摘要 |
| 消息与通知语言 | 服务端可用语言           | `GET /api/i18n/locales`（`i18nListLocales`，公开）                                                                       | 应用级 | 已配置 / 未配置 / 加载中 / 读取失败 | —    | 已有接口 |

**通过 Agent 添加或完善**（页面文案）：「增加一种语言」「修改默认语言」，已配置时增加「补充业务内容翻译」（推荐，待确认）。

> 帮我为应用增加【日语】，包括界面文字和系统发出的通知，保留现有中英文，并告诉我哪些业务内容还需要人工翻译。

> 帮我把新用户首次访问时的默认语言改为【简体中文】，已经选择过语言的用户保持不变。

**配置步骤与边界**（展开内容）：增加语言需要补齐界面文案和服务端消息；修改默认语言只影响没有选择过语言的用户。

**给实现者的约束**

- 只显示一个可见模块，合并内核与插件（见 2.2 规则 5）。新增语言、调整默认语言和补充翻译是不同操作；语言切换入口存在不代表业务内容都已翻译。
- 「语言切换入口」不能用语言数量判断；切换器在应用外壳（账号菜单）中，不是路由，需要应用提供可识别的声明（推荐：外壳注册的稳定标识，待确认）。

**读取来源与缺口**：[i18n-overview.tsx](../../client/capability-guide/details/i18n-overview.tsx)、[i18n 路由](../../../app-plugin-i18n/server/routes.ts)、[i18n Skill](../../../app-plugin-i18n/skills/nocobase-app-plugin-i18n/SKILL.md)。待获取：语言切换入口，需要应用外壳声明是否提供切换器。

## 6. 其余模块的详情设计

以下模块按与第 5 节相同的格式组织。代码现状：除 6.12 之外，这些模块都使用通用详情 [feature-overview.tsx](../../client/capability-guide/details/feature-overview.tsx)，「当前应用」只有一行：[capability-pages.ts](../../client/capability-guide/details/capability-pages.ts) 中登记了路由的显示界面状态，没登记的显示「待确认」（应改为「待获取」）。表中「目标」行是调整后的展示，不表示当前页面已经完成这些读取。

配置名称、默认选择和启用状态属于不同信息。例如，一个渠道可以已经配置但被停用，应显示其配置及「已停用」，不能写成「未配置」。业务记录数量不作为配置完成的门槛；读取受权限限制时要说明范围，不能把「我可见的」称为「应用全部」。

### 6.1 知识库（`app-plugin-knowledge`）

**是什么**（页面文案）：集中管理业务知识、文档和文件，让有权限的人员查找和使用。

**当前应用**

| 行               | 展示对象                    | 读取来源                                                                                                                                                              | 范围           | 状态                              | 入口                  | 接口               |
| ---------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------- | --------------------- | ------------------ |
| 知识库界面       | 知识库页面                  | 路由名 `knowledge`（`knowledgeDefinition()`，授权 `page:knowledge`）                                                                                                  | 应用级         | 已配置 / 未配置 / 无权限 / 加载中 | `/knowledge`          | 已有接口           |
| 检索设置界面     | 索引设置页                  | Examples 模板自己的路由 `knowledgeIndexing`（`/knowledge/indexing`）；不在 `capabilityPages` 中                                                                       | 应用级         | 已配置 / 未配置 / 无权限          | `/knowledge/indexing` | 已有接口（未接入） |
| 可访问的知识空间 | 空间名称                    | `knowledgeListSpaces`                                                                                                                                                 | 当前用户可访问 | 待获取（未接入）                  | —                     | 已有接口（未接入） |
| 检索配置         | 已选用的索引实例、索引进度  | `knowledgeGetIndexingSettings`、`knowledgeListIndexingInstances`、`knowledgeGetIndexingStatus`（[索引接口](../../../app-plugin-knowledge/server/routes/indexing.ts)） | 按接口权限     | 待获取（未接入）                  | —                     | 已有接口（未接入） |
| 文件存储         | `knowledge.disk` 及上传限制 | 待获取：[Knowledge 配置](../../../app-plugin-knowledge/config.ts)没有对外摘要                                                                                         | 应用级         | 待获取                            | —                     | 待补摘要           |

代码核对：Examples 注册了 `knowledgeDefinition()` 页面（插件以 `knowledge({ routes: false })` 注册，页面由模板声明），为「已配置」；Default 没有注册 knowledge 客户端插件，为「未配置」。

**通过 Agent 添加或完善**（页面文案）：「添加知识库界面」「增加业务知识空间」「配置文件存储」「配置或调整检索」。

> 帮我为【售后团队】添加知识库，用来整理【产品手册和常见问题】。提供查找、阅读和维护资料的入口，并按团队职责设置访问权限。

> 帮我为现有知识库配置语义检索，让用户能用自然语言查找【产品使用问题】。优先使用已有的模型和索引配置，并告诉我还缺哪些条件。

**配置步骤与边界**（展开内容）：核对空间归属和权限，再配置存储、索引实例及界面；更换索引设置可能触发全量重建和模型用量。

**给实现者的约束**：空间列表只列当前用户可访问的空间，数量标为「可访问空间」，不读取无权限的标题。可选实例存在不等于已选用，已选用不等于索引已完成。`knowledge.disk`、`knowledge.indexing`、`knowledge.jobs` 等部署配置与空间内容分开。插件未绑定空间访问解析器时，不能推断已有默认知识空间。普通知识管理不以 AI Agent 已配置为前提。

**读取来源与缺口**：[配置与空间解析](../../../app-plugin-knowledge/server/providers/knowledge.ts)、[公共使用契约](../../../app-plugin-knowledge/README.md)。待获取：知识库文件存储摘要（存储名和上传限制）；空间与检索已有接口，需核对权限后接入。

### 6.2 邮箱（`app-plugin-mail`）

**是什么**（页面文案）：在应用中连接和使用邮箱，处理邮件收发与同步。

**当前应用**

| 行                           | 展示对象             | 读取来源                                                                                                                                             | 范围     | 状态                                                           | 入口 | 接口                   |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- | ---- | ---------------------- |
| 邮箱服务配置（每个服务一行） | 名称、类型           | `GET /api/mail/providers`（`mailListProviders`，「List the configured mail Providers」，[mail 路由](../../../app-plugin-mail/server/routes/api.ts)） | 应用级   | 待获取（未接入）；接入后为 已配置 / 未配置 / 无权限 / 读取失败 | —    | 已有接口（未接入）     |
| 我的邮箱账号                 | 当前用户已连接的账号 | `GET /api/mail/accounts`（`mailListAccounts`，「the caller's mail accounts」）                                                                       | 当前用户 | 待获取（未接入）                                               | —    | 已有接口（未接入）     |
| 邮箱账号管理界面、邮件工作台 | 应用提供的页面       | 待获取：插件客户端不注册路由，两个模板也没有邮箱页面，没有约定的稳定路由名                                                                           | 应用级   | 待获取                                                         | —    | 待补摘要（约定路由名） |
| 同步与后台任务               | `mail.jobs` 选择     | 待获取：[Mail 配置](../../../app-plugin-mail/server/config.ts)没有对外摘要                                                                           | 应用级   | 待获取                                                         | —    | 待补摘要               |

**通过 Agent 添加或完善**（页面文案）：「添加邮箱账号管理界面」「添加邮件工作台」「配置邮箱服务」「调整同步方式」。

> 帮我在应用中添加邮箱账号管理和邮件工作台，让用户连接自己的【Microsoft 365】邮箱，查看、回复和发送邮件。

> 帮我调整现有邮箱的自动同步频率，目标是【每 10 分钟同步一次】。保留已有账号和邮件，说明调整后何时生效。

**配置步骤与边界**（展开内容）：`mail.providers` 定义命名服务实例，`mail.jobs` 选择后台任务配置；账号授权在应用提供的真实流程中由用户完成。

**给实现者的约束**：服务实例改名会影响既有账号关联。邮箱服务、个人邮箱账号与通知邮件渠道是三件事；配置通知 SMTP 不代表个人邮箱已连接。OAuth 回调、凭据和 Webhook 密钥不在概览展示。已配置不表示远端授权有效、同步健康或邮件已送达。账号列表是个人范围，不能代替服务配置目录。

**读取来源与缺口**：[配置与账号指南](../../../app-plugin-mail/skills/nocobase-app-plugin-mail/references/configuration-and-accounts.md)、[界面集成指南](../../../app-plugin-mail/skills/nocobase-app-plugin-mail/references/client-integration.md)。待获取：邮箱界面的稳定路由名约定；`mail.jobs` 摘要。服务和账号已有接口，需核对权限后接入。

### 6.3 通知（`app-plugin-notification`）

**是什么**（页面文案）：在业务发生变化时，通过指定渠道通知相关人员，并保留可追踪的投递记录。

**当前应用**

| 行                       | 展示对象                                                           | 读取来源                                                                                                                                                                                                                                                      | 范围       | 状态                     | 入口     | 接口                   |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------ | -------- | ---------------------- |
| 通知模板界面             | 模板目录页                                                         | 模板路由 `notificationTemplates`（`/settings/notifications/templates`，[notification-routes.ts](../../../../templates/app-template-default/client/pages/settings/notification-routes.ts)，只在已有通知管理模块或已配置邀请时加入）；不在 `capabilityPages` 中 | 应用级     | 已配置 / 未配置 / 无权限 | 页面路径 | 已有接口（未接入）     |
| 通知模板目录             | 已登记的业务通知模板                                               | `notificationsListTemplates`（[模板接口](../../../app-plugin-notification/server/routes/templates.ts)）                                                                                                                                                       | 按接口权限 | 待获取（未接入）         | —        | 已有接口（未接入）     |
| 投递记录界面             | 通知记录页                                                         | 待获取：插件和模板都没有记录页路由；`notificationsListLogs` 接口已有                                                                                                                                                                                          | 应用级     | 待获取                   | —        | 待补摘要（约定路由名） |
| 渠道汇总、后台任务与重试 | `notification.channels`、`notification.jobs`、`notification.retry` | 待获取：[配置契约](../../../app-plugin-notification/server/types.ts)没有对外摘要                                                                                                                                                                              | 应用级     | 待获取                   | —        | 待补摘要               |

**通过 Agent 添加或完善**（页面文案）：「添加通知记录界面」「添加业务通知」「完善通知模板目录」「调整投递重试」。

> 当【采购申请通过审批】时，通过【站内信】通知【申请人】。让消息能打开对应申请，并在通知管理中查看投递记录和这个通知的模板预览。

**配置步骤与边界**（展开内容）：确定业务触发点、收件人和现有渠道，再接入发送及管理入口；模板目录只读介绍和合成数据预览。

**给实现者的约束**：渠道类型与渠道实例名称分开。模板目录不是在线模板编辑器，不能从历史消息推导模板清单；没有发送记录不等于未配置。渠道接受请求、最终送达和用户阅读是不同结果。页面不承载发送控制台，不在加载时发测试通知。

**读取来源与缺口**：[通知 Skill](../../../app-plugin-notification/skills/nocobase-app-plugin-notification/SKILL.md)。待获取：渠道、后台任务和重试的安全摘要（与 6.5 共用，按类型筛选）；投递记录页的稳定路由名。

### 6.4 通知：站内信（`app-plugin-notification-in-app`）

**是什么**（页面文案）：把业务通知送到应用内的个人收件箱，方便集中查看和处理。

**当前应用**

| 行         | 展示对象                  | 读取来源                                                                      | 范围   | 状态                              | 入口     | 接口     |
| ---------- | ------------------------- | ----------------------------------------------------------------------------- | ------ | --------------------------------- | -------- | -------- |
| 个人收件箱 | 收件箱页面                | 路由名 `inbox` 或路径 `/inbox`（`capabilityPages`）；两个模板都注册了 `inbox` | 应用级 | 已配置 / 未配置 / 无权限 / 加载中 | `/inbox` | 已有接口 |
| 站内信渠道 | `type: in-app` 的命名渠道 | 待获取：与 6.3 渠道摘要相同                                                   | 应用级 | 待获取                            | —        | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「添加个人收件箱」「配置站内信渠道」「添加消息入口和未读提醒」。

> 帮我添加个人收件箱，在【账号菜单】提供入口和未读提醒。用户只能查看自己的站内信，并能从消息打开相关业务记录。

**配置步骤与边界**（展开内容）：复用插件的收件箱组件和接口，由应用提供路由及入口。

**给实现者的约束**：不假定渠道名一定叫 `inbox`。未读数量是用户自己的使用数据，不作为配置依据，也不为证明可用而创建消息。收件箱入口和渠道配置分别判断。实时推送只提示重新读取，内容和已读状态以接口为准。

**读取来源与缺口**：[站内信 Skill](../../../app-plugin-notification-in-app/skills/nocobase-app-plugin-notification-in-app/SKILL.md)、[集成契约](../../../app-plugin-notification-in-app/skills/nocobase-app-plugin-notification-in-app/references/inbox-integration.md)。待获取：站内信渠道摘要。

### 6.5 通知：内置渠道（`app-plugin-notification-providers`）

**是什么**（页面文案）：通过邮件、飞书或钉钉等渠道发送业务通知。

**当前应用**

| 行                         | 展示对象                               | 读取来源                                | 范围   | 状态                                      | 入口 | 接口     |
| -------------------------- | -------------------------------------- | --------------------------------------- | ------ | ----------------------------------------- | ---- | -------- |
| 已配置渠道（每个实例一行） | 名称、类型、启用状态、引用的发信服务名 | 待获取：与 6.3 共用渠道摘要，按类型筛选 | 应用级 | 待获取；接入后为 已配置 / 已停用 / 未配置 | —    | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「添加邮件渠道」「添加飞书或钉钉渠道」「调整已有渠道」。已支持但未配置的类型放在这一块供选择，不与当前应用真实清单混排。

> 帮我添加一个【飞书】通知渠道，用于发送【系统运行异常】提醒。告诉我需要提供哪些连接信息，并保留已有通知渠道。

> 帮我新增业务通知邮件渠道，复用应用已有的【system】发信服务，用于发送【订单处理结果】。

**配置步骤与边界**（展开内容）：新邮件渠道优先用 `type: email` 引用应用 `mailers`；Webhook 地址和密钥通过环境变量提供。

**给实现者的约束**：内置类型为 `email`、`smtp`、`resend`、`feishu-webhook`、`dingtalk-webhook`（[内置渠道注册](../../../app-plugin-notification-providers/server/bootstrap.ts)）。兼容的内联 SMTP/Resend 配置照实展示。站内信和 Web Push 属于各自插件。类型已注册仅代表可选；停用的配置仍应列出。Webhook URL、令牌、签名密钥不展示。数量按渠道实例计数。

**读取来源与缺口**：[邮件配置验证](../../../app-plugin-notification-providers/server/email/config.ts)、[使用契约](../../../app-plugin-notification-providers/README.md)。待获取：渠道摘要（与 6.3 共用一份，不维护另一份数据）。

### 6.6 定时任务（`app-plugin-scheduler`）

**是什么**（页面文案）：按计划执行业务任务，让管理员查看计划、控制启停并跟踪执行记录。

**当前应用**

| 行               | 展示对象                   | 读取来源                                                                                                  | 范围       | 状态                                                                                    | 入口 | 接口                   |
| ---------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- | ---- | ---------------------- |
| 已定义的定时任务 | 名称、周期、时区、启用状态 | `schedulerListSchedules`（[授权接口](../../../app-plugin-scheduler/server/routes/index.ts)）              | 按接口权限 | 待获取（未接入）；接入后为 已配置 / 未配置（显示「尚未定义定时任务」）/ 已停用 / 无权限 | —    | 已有接口（未接入）     |
| 任务管理界面     | 管理页                     | 待获取：插件客户端不注册路由，两个模板也没有调度管理页                                                    | 应用级     | 待获取                                                                                  | —    | 待补摘要（约定路由名） |
| 执行配置         | `scheduler.jobs` 选择      | 待获取：[配置契约](../../../app-plugin-scheduler/server/config.ts)没有对外摘要；省略时跟随 `jobs.default` | 应用级     | 待获取                                                                                  | —    | 待补摘要               |

**通过 Agent 添加或完善**（页面文案）：「添加定时业务任务」「添加任务管理界面」「调整任务计划」「调整执行配置」。

> 帮我添加【每天上午 9 点，按北京时间】执行的任务，汇总【昨日订单】并通知【运营负责人】。在任务管理中提供启停入口和执行记录。

**配置步骤与边界**（展开内容）：计划由源码定义并关联已注册的执行目标，修改计划需走应用代码；管理接口支持查看和启停。

**给实现者的约束**：现有管理接口不提供创建或编辑 Cron 的通用 API。只是后台清理、无需管理员界面的周期任务用 jobs，不为每个后台任务强加 Scheduler 界面。触发成功不等于业务执行完成。历史执行次数不作为是否已配置的依据；无权限时不能显示任务为 0。

**读取来源与缺口**：[Scheduler Skill](../../../app-plugin-scheduler/skills/nocobase-app-plugin-scheduler/SKILL.md)。待获取：任务管理界面的稳定路由名；`scheduler.jobs` 实际选择的摘要。

### 6.7 用户管理（`app-plugin-users`）

**是什么**（页面文案）：管理应用用户、账号状态和用户的权限分配。

**当前应用**

| 行           | 展示对象           | 读取来源                                                                                                                    | 范围   | 状态                              | 入口              | 接口                     |
| ------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------- | ----------------- | ------------------------ |
| 用户管理界面 | 用户列表页         | 路由名 `settingsUsers`（`capabilityPages`）；Examples 已注册，Default 准备了但未注册（见 5.7）                              | 应用级 | 已配置 / 未配置 / 无权限 / 加载中 | `/settings/users` | 已有接口                 |
| 邀请用户     | 邀请入口与邀请记录 | 待获取：邀请在用户管理页内完成，没有独立路由；`usersInviteUsers`、`usersListInvitations` 接口已有                           | 应用级 | 待获取                            | —                 | 待补摘要（约定识别方式） |
| 邀请邮件     | 所选发信服务名     | 待获取：`users.invitations.mailer` / `emailChannel`（[Users 配置](../../../app-plugin-users/server/config.ts)）没有对外摘要 | 应用级 | 待获取                            | —                 | 待补摘要                 |

**通过 Agent 添加或完善**（页面文案）：「添加用户管理界面」「添加邀请用户界面」「配置邀请邮件」「完善人员权限分配」。

> 帮我为【应用管理员】添加用户管理界面，可以查找用户、调整账号状态和分配现有权限。普通用户不能进入这个管理界面。

> 帮我添加邀请成员入口，并使用应用已有的发信服务发送邀请邮件。

**配置步骤与边界**（展开内容）：用户管理、注册、认证和授权分属不同职责；邀请邮件优先使用应用 `mailers`。

**给实现者的约束**：`users.initialAdmin` 仅用于用户表为空时的首次初始化。不把用户总数、登录人数或个人资料页当作界面存在的证据。初始密码与邀请令牌不进状态摘要。公开的接受邀请页 `invite`（`/invite/:token`）是带参数路由，不能作为「邀请用户界面」已提供的证据。

**读取来源与缺口**：[Users Skill](../../../app-plugin-users/skills/nocobase-app-plugin-users/SKILL.md)、[管理契约](../../../app-plugin-users/server/tokens.ts)。待获取：邀请入口的识别方式；邀请邮件配置摘要。

### 6.8 后台任务（`jobs`）

**是什么**（页面文案）：把耗时工作放到后台执行，并为周期性工作提供统一的执行能力。

**当前应用**

| 行                     | 展示对象                                   | 读取来源                                                                 | 范围   | 状态   | 入口 | 接口     |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------ | ------ | ------ | ---- | -------- |
| 默认配置               | 默认配置名、实现                           | 待获取：[jobs 配置解析](../../../../libs/jobs/src/config.ts)没有对外摘要 | 应用级 | 待获取 | —    | 待补摘要 |
| 已声明配置（每项一行） | 名称、实现、并行执行数、尝试次数、命名空间 | 同上                                                                     | 应用级 | 待获取 | —    | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「调整并行执行数和重试」「增加独立配置」「切换默认配置」「改为多实例共享执行」。

> 帮我把默认后台任务的并行执行数调整为【4】，失败时最多尝试【3】次。保留其他任务配置，并说明对已有任务的影响。

> 应用将部署为【多个实例】，帮我把后台任务调整为共享执行方式，保留现有任务的归属，并列出需要安装的扩展和连接配置。

**配置步骤与边界**（展开内容）：`jobs` 使用命名配置和 `default`；Redis 等共享实现需要对应扩展。

**给实现者的约束**：内置实现名 `memory`，与 queue 的 `inMemory` 不同。无配置回退为单进程内存实现，并行数和尝试次数默认 1，只是实现默认值。不扫描哪些业务调用了 jobs，不用任务历史作为配置依据。内存实现有状态文件也不代表支持多实例。不能只看 `config.yml` 是否写了 `default`。

**读取来源与缺口**：[公开契约](../../../../libs/jobs/README.md)。待获取：生效 jobs 配置摘要（默认选择及规范化参数）。

### 6.9 队列（`queue`）

**是什么**（页面文案）：为需要延迟、优先级、重试或限流的后台工作提供排队处理能力。

**当前应用**

| 行                   | 展示对象                   | 读取来源                                                                   | 范围   | 状态   | 入口 | 接口     |
| -------------------- | -------------------------- | -------------------------------------------------------------------------- | ------ | ------ | ---- | -------- |
| 默认队列配置         | 默认配置名、实现、命名空间 | 待获取：[queue 配置解析](../../../../libs/queue/src/config.ts)没有对外摘要 | 应用级 | 待获取 | —    | 待补摘要 |
| 命名配置（每项一行） | 并行执行数、重试、限流摘要 | 同上                                                                       | 应用级 | 待获取 | —    | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「调整并行执行与限流」「调整重试和保留策略」「增加独立队列配置」「配置多实例共享队列」。

> 帮我增加一个【外部接口同步】使用的队列配置，最多每【1 秒】启动【10】个任务，并设置合适的失败重试。保留当前默认配置。

**配置步骤与边界**（展开内容）：`queue.default` 指向一个命名配置，各项不互相继承；跨实例实现依赖相应扩展。

**给实现者的约束**：统计「配置项」，不称为「业务队列数量」。内置实现名 `inMemory`；缺少 `default` 不代表不能运行。运行中队列可能覆盖参数，卡片标明展示的是应用配置。不读取任务 payload，不为列配置而初始化队列或启动消费者。连接凭据不展示。

**读取来源与缺口**：[公开契约](../../../../libs/queue/README.md)。待获取：命名队列配置摘要。

### 6.10 业务流程（`lifecycle`）

**是什么**（页面文案）：把业务记录的状态、可执行操作和后续处理组织成清晰流程。

**当前应用**

| 行               | 展示对象           | 读取来源                                                                                                                                                                                                                                                | 范围   | 状态                                                | 入口                     | 接口                         |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------- | ------------------------ | ---------------------------- |
| 流程目录界面     | 流程定义列表页     | Examples 模板自己的路由 `workflowDefinitions`（`/workflows/definitions`）及接口 `GET /api/workflows/definitions`（`examplesListWorkflowDefinitions`，[模板路由](../../../../templates/app-template-examples/server/routes/workflows.ts)）；Default 没有 | 应用级 | 待获取（未接入）；接入后为 已配置 / 未配置 / 无权限 | `/workflows/definitions` | 已有接口（模板私有，未接入） |
| 已登记的业务流程 | 流程名称、所属业务 | 待获取：内核没有可枚举全应用流程的通用目录                                                                                                                                                                                                              | 应用级 | 待获取                                              | —                        | 待补摘要（需设计契约）       |
| 流程参数         | 允许配置的参数摘要 | 待获取：[参数契约](../../../../libs/lifecycle/docs/parameters.md)由应用提供，无统一读取                                                                                                                                                                 | 应用级 | 待获取                                              | —                        | 待补摘要（需设计契约）       |

**通过 Agent 添加或完善**（页面文案）：「为业务增加流程」「调整已有流程参数」「补充处理记录与操作入口」。

> 帮我为【售后工单】增加【待处理、处理中、待客户确认、已关闭】流程。说明每一步由谁操作，并在工单详情中提供可执行操作和处理记录。

**配置步骤与边界**（展开内容）：流程由应用或业务插件声明，记录自身字段保存状态；按模板约定在系统设置中提供流程定义目录、流程图、参数和执行记录。

**给实现者的约束**：不扫描名为 `status` 的字段、依赖包或示例路由推断流程数量；没有读取契约时保持「待获取」，不说「没有流程」。不假设存在 `config.yml.lifecycle` 或全局流程管理接口。状态变化不等于外部副作用已成功。Examples 的流程目录是模板私有接口，foundation 不能直接依赖；推荐约定稳定路由名 `workflowDefinitions` 作为界面识别依据（推荐，待确认）。

**读取来源与缺口**：[lifecycle 公共契约](../../../../libs/lifecycle/README.md)、[应用流程集成指南](../../../../app/app-skills/skills/nocobase-app-development/references/lifecycle.md)。待获取：流程目录与参数摘要，需要先设计由应用提供的读取契约。

### 6.11 实时更新（`realtime`）

**是什么**（页面文案）：在业务数据变化时及时通知相关页面更新，减少手动刷新。

**当前应用**

| 行       | 展示对象                                    | 读取来源                                                                              | 范围   | 状态   | 入口 | 接口     |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------- | ------ | ------ | ---- | -------- |
| 消息分发 | 实现（`adapter`）、命名空间、连接与订阅限制 | 待获取：[实时配置解析](../../../../app/app-server/src/realtime/config.ts)没有对外摘要 | 应用级 | 待获取 | —    | 待补摘要 |

**通过 Agent 添加或完善**（页面文案）：「改为跨实例实时分发」「调整连接和订阅限制」；为具体页面添加实时刷新作为独立操作（推荐，待确认）。

> 应用将运行在【多个实例】上，帮我配置跨实例的实时消息分发，让用户连接到不同实例时仍能收到相关更新。保留现有消息权限。

**配置步骤与边界**（展开内容）：`realtime` 是单个分发配置，Redis 分发需要对应插件和部署条件。

**给实现者的约束**：不照搬 jobs/queue 的多配置结构。默认实现 `inMemory`、命名空间默认取应用名，仍需运行时证据。浏览器连接状态只能作辅助，不能代替配置；不能从连接 URL 或是否收到事件反推实现。不扫描哪些页面使用了实时更新。

**读取来源与缺口**：[Realtime Skill](../../../../libs/realtime/skills/nocobase-realtime/SKILL.md)。待获取：服务端脱敏的实时配置摘要。

### 6.12 模板打印（`app-plugin-template-print`）

**是什么**（页面文案）：按文档模板生成业务单据，供下载或打印。

**目录收录**：代码核对与负责人 21:56 评论不一致——`88fb71b7` 时两个模板都在 `dependencies` 中直接声明了 `@nocobase/app-plugin-template-print`（Default `package.json` 第 21 行，Examples 第 30 行），Examples 另外声明了 `app-plugin-template-print-example`。因此它现在出现在两个应用的目录里（Default 第 19 项，Examples 第 34 项）。规则：只要应用 `package.json` 的四类依赖中任一处声明了这个包，它就列入目录；只依赖 `-example` 时只列示例条目，不列它。若负责人希望 Default 不列它，应从模板依赖中移除，而不是在目录里隐藏（推荐，待确认）。

**当前应用**

| 行                                   | 展示对象       | 读取来源                                                                                       | 范围   | 状态                                                                                           | 入口 | 接口                       |
| ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- | ---- | -------------------------- |
| 开发指南                             | 包发布的 Skill | [包发布内容](../../../app-plugin-template-print/package.json)：仅 Skill，无 Client/Server 插件 | —      | 不判定状态，显示「开发指南扩展，无需运行时注册」（代码现状 `featureOverview.modes.reference`） | —    | —                          |
| 模板管理界面、业务生成入口、输出格式 | 应用实现的功能 | 待获取：嵌在记录页的按钮无法用路由扫描证明，应用没有能力声明                                   | 应用级 | 待获取                                                                                         | —    | 待补摘要（需应用能力声明） |

**通过 Agent 添加或完善**（页面文案）：「增加业务单据生成」「增加模板管理」「增加已需要的输出格式」。

> 帮我为【销售报价】添加生成文档的操作，使用【DOCX 报价单模板】，包含报价明细和合计。生成结果仅允许有权查看该报价的人员下载。

**配置步骤与边界**（展开内容）：先完成一种模板和输出；PDF 需确认转换环境。

**给实现者的约束**：渲染器、模板存储、接口和按钮由应用或业务插件实现。不能因支持 DOCX 就显示支持 PDF。浏览器打印、生成可打印文档和驱动物理打印机是不同能力。

**读取来源与缺口**：[模板打印 Skill](../../../app-plugin-template-print/skills/nocobase-app-plugin-template-print/SKILL.md)。待获取：应用的单据生成能力声明。

### 6.13 功能与扩展（`app-plugin-foundation`）

**是什么**（页面文案）：查看应用可用功能、实际配置，以及如何通过 Agent 添加或完善。

**当前应用**

| 行             | 展示对象     | 读取来源                                           | 范围   | 状态                   | 入口                     | 接口     |
| -------------- | ------------ | -------------------------------------------------- | ------ | ---------------------- | ------------------------ | -------- |
| 功能与扩展界面 | 目录页       | 路径 `/settings/capabilities`（`capabilityPages`） | 应用级 | 已配置 / 未配置        | `/settings/capabilities` | 已有接口 |
| 目录覆盖范围   | 条目来源说明 | 应用传入的 `manifest`（2.2）                       | 应用级 | 只显示说明，不判定状态 | —                        | —        |

**通过 Agent 添加或完善**（页面文案）：「在系统设置添加入口」「补充自定义功能说明」。

> 帮我在系统设置中提供「功能与扩展」入口，使用插件内置页面，展示当前应用自己的功能和配置。

**配置步骤与边界**（展开内容）：注册 foundation 并传入应用依赖清单及导航选项；应用私有功能用 `guideEntryLoaders` 覆盖，不修改安装包源码。

**给实现者的约束**：目录不等于已启用插件清单，也不等于业务功能数量。不恢复旧版底座使用率、扫描任务和能力评分；不把用户引导到「应用使用情况」作为完成目标。目录页可访问不代表用户能读取所有配置，详情数据遵守各模块权限。

**读取来源与缺口**：[目录生成](../../shared/capability-guide/catalog.ts)、[插件路由选项](../../client/routes.ts)。无「待获取」项。

### 6.14 示例插件逐项处理

依赖里存在的示例全部保留，并明确其示例性质；界面型示例显示实际入口，非界面型示例描述实际声明和用途，不为了套三块布局虚构页面。每篇以一句用途开头，当前应用列事实，第三块提供「基于此示例实现业务」的 Agent 操作。

代码现状：示例使用通用详情；入口按 [capability-pages.ts](../../client/capability-guide/details/capability-pages.ts) 登记的固定路径在路由表中查找；`FEATURE_OVERVIEWS` 的 `mode`（`full` / `service` / `cli`）决定没有入口时的说明。

| 示例插件（均为 `@nocobase/app-plugin-…`） | 当前应用：展示对象与读取来源                                                         | 状态（Examples） | 接口     | Agent 操作与边界                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------ | ---------------- | -------- | ---------------------------------------------------------- |
| `authorization-example`                   | 示例入口，路径 `/authorization-example`                                              | 已配置           | 已有接口 | 将权限示例改为具体业务的职责分工，不复制演示账号或生产授权 |
| `cli-example`                             | 注册的示例命令；待获取：浏览器端无法读取 CLI 注册                                    | 待获取           | 待补摘要 | 为明确业务增加 CLI 命令，区分注册与执行结果                |
| `database-example`                        | 示例迁移与种子；待获取：需迁移记录                                                   | 待获取           | 待补摘要 | 增加业务数据结构与初始数据，不把包已注册写成表已创建       |
| `file-example`                            | 示例入口，路径 `/file-repository`                                                    | 已配置           | 已有接口 | 将附件关联到具体业务；存储与文件表按 5.4                   |
| `jobs-example`                            | 入口 `/jobs-example/jobs`；另有 `/jobs-example/schedules` 未登记                     | 已配置           | 已有接口 | 增加业务后台任务，示例周期任务界面不是通用 Scheduler       |
| `lifecycle-example`                       | 入口 `/lifecycle-example/tickets`；另有 expenses、invoices、orders 等 7 个页面未登记 | 已配置           | 已有接口 | 改为具体业务的状态与操作；示例数量不代表应用流程数量       |
| `mail-example`                            | 入口 `/mail-example`                                                                 | 已配置           | 已有接口 | 基于工作台实现真实邮箱业务，模拟账号不表示外部邮箱已连接   |
| `notification-example`                    | 入口 `/notification-example`                                                         | 已配置           | 已有接口 | 配置某项真实业务的通知，示例规则不成为全应用默认           |
| `office-flows-example`                    | 入口 `/office-flows/data-requests`                                                   | 已配置           | 已有接口 | 调整为组织自己的部门和处理规则，不沿用示例人员和日历       |
| `queue-example`                           | 示例队列配置和消费者；待获取：无页面、无读取来源                                     | 待获取           | 待补摘要 | 为需延迟、优先级的业务实现队列，不用示例发布动作检测状态   |
| `realtime-example`                        | 入口 `/realtime-example`                                                             | 已配置           | 已有接口 | 为业务页面实现刷新与恢复，演示成功不证明跨实例已配置       |
| `repository-example`                      | 入口 `/repository-example/crm`                                                       | 已配置           | 已有接口 | 按业务补查询、关联与修改，不沿用演示权限边界               |
| `routes-example`                          | 入口 `/routes-example`                                                               | 已配置           | 已有接口 | 添加具体业务路由，路由注册不等于接口可匿名访问             |
| `service-provider-example`                | 示例服务声明；待获取：无页面、无读取来源                                             | 待获取           | 待补摘要 | 为业务增加公共服务，存在 Token 不等于服务健康              |
| `skills-example`                          | AppNotice 等嵌入组件与 Skill；待获取：嵌入位置不是路由                               | 待获取           | 待补摘要 | 让 Agent 使用公开组件和服务，Skill 已同步不等于组件已嵌入  |
| `template-print-example`                  | 入口 `/template-print-example`                                                       | 已配置           | 已有接口 | 替换成业务模板和授权数据；PDF 需单独确认                   |

所有入口路径都在对应示例插件的 `client/routes.ts` 中注册（[examples 源码目录](../../../../examples/)），Examples 在 `client/plugins.ts` 中注册了这些示例的客户端插件。

统一需求示例：

> 参考【文件关联示例】，为【合同】增加附件功能。复用应用已有的文件存储和权限，让【合同参与人员】上传、查看和下载附件。

**给实现者的约束**：命令、迁移和服务类示例没有浏览器可读来源时显示「待获取」并附一句示例用途，不显示「未配置」；纯命令、迁移或服务的注册信息不能冒充业务功能已完成。多页面示例只登记一个代表入口，推荐保持一个「打开示例」入口，在说明中列出其余页面（推荐，待确认）。

### 6.15 官方未安装、商业及尚未收录的插件

未安装插件的介绍与安装指引来自独立的官方目录元数据或公开 Skill，不能要求先安装运行时代码才能让 Agent 了解它。元数据建议记录包名、用途、适用版本、官方文档、安装条件、可用的 Skill 来源及安装配置指引；商业性质和授权条件必须有可核对来源，不通过名字或当前安装状态猜测。

页面仍保留三块：一句用途；当前应用明确「未安装」，不把安装和业务配置合并；第三块提供按条件安装并配置的 Agent 需求。已安装但未配置则回到对应模块的配置判断。配置型扩展应说明它可替换或补充哪个模块，例如 Redis 实现应关联 jobs、queue、realtime 或并发的配置操作；不能承诺只安装包即可自动切换现有部署。

> 应用准备部署为【多个实例】，请确认适用的【后台任务共享执行扩展】及安装条件，完成所需注册和配置，并说明已有任务如何衔接。

代码现状：目录只基于应用依赖生成（2.2），尚未合入未安装官方插件目录；此前讨论的独立 `app-skill-*` 与集中维护公开指南属于待确认的发布组织方式，本节不把其中一种写成已落地。依赖中存在但没有文案的插件以 `known: false` 列出完整名称及可核实文档，不套用其他插件的配置字段或编造管理入口。

### 6.16 落地时逐项确认的读取契约

每个模块正式调整页面前，先为「当前应用」的每一行确认以下信息，再实现展示（第 5、6 节的表格按此模板填写）：

| 项目       | 必须明确的内容                                                          |
| ---------- | ----------------------------------------------------------------------- |
| 展示对象   | 配置项、界面、资源目录或 Skill，不能只写「插件状态」                    |
| 读取来源   | 已有公开接口、公开运行时或待实现的受保护摘要；示例默认值不是读取来源    |
| 范围       | 应用级、当前用户可见范围、单个空间或单个配置；分页及总数是否完整        |
| 状态       | 按 3.2 状态表：已配置、未配置、已停用、无权限、加载中、读取失败、待获取 |
| 入口       | 运行时真实路径、应用部署前缀及访问权限；嵌入按钮不能仅靠目录路由猜测    |
| 接口       | 已有接口 / 待补摘要                                                     |
| Agent 操作 | 对应明确的新增或调整目标；配置步骤落实到该模块实际契约                  |

优先复用已有读取能力；确实缺少摘要时，再在明确的所属模块或公共契约中补充。foundation 负责解释与呈现，不直接扫描其他插件私有表、读取完整配置给浏览器，也不维护平行配置。

### 6.17 「待获取」项与所需读取接口汇总

| 模块                     | 待获取的行                                              | 需要的读取接口（本轮不新增）                                                 |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 并发                     | 默认服务、实现、协调范围、命名空间、其他服务            | 并发配置摘要（不含连接参数）                                                 |
| 文件管理                 | 默认存储、存储列表、文件表                              | drive 存储摘要；File Repository 资源目录                                     |
| 身份认证                 | 企业 / 第三方登录、双重验证                             | 已启用登录方式摘要（类型与显示名）                                           |
| AI Agent                 | 模型服务、机器连接                                      | 核对 `agentsListModelServices`、`agentsListRunners` 权限后接入，或补数量摘要 |
| 多语言                   | 语言切换入口                                            | 应用外壳声明是否提供切换器                                                   |
| 知识库                   | 文件存储；空间与检索（接口已有，未接入）                | 知识库存储摘要                                                               |
| 邮箱                     | 界面、`mail.jobs`；服务与账号（接口已有，未接入）       | 邮箱界面稳定路由名；mail 配置摘要                                            |
| 通知 / 站内信 / 内置渠道 | 渠道、后台任务、重试；投递记录界面                      | 通知渠道安全摘要（三个模块共用）；记录页稳定路由名                           |
| 定时任务                 | 管理界面、执行配置；任务列表（接口已有，未接入）        | 管理页稳定路由名；`scheduler.jobs` 摘要                                      |
| 用户管理                 | 邀请入口、邀请邮件                                      | 邀请入口识别方式；邀请邮件配置摘要                                           |
| jobs / queue / realtime  | 全部配置行                                              | 各自的生效配置摘要                                                           |
| 业务流程                 | 流程目录、参数                                          | 需先设计应用提供的流程目录契约                                               |
| 模板打印                 | 应用实现的单据能力                                      | 应用能力声明                                                                 |
| 示例插件                 | cli、database、queue、service-provider、skills 五个示例 | 命令、迁移、服务和嵌入组件的声明摘要                                         |

## 7. 页面复用与代码位置

“功能与扩展”属于所有应用可复用的插件能力，目录、详情、文案、Agent 指引、状态展示和相关测试统一归 `@nocobase/app-plugin-foundation` 所有，不能在 Default 和 Examples 模板分别维护。

应用只注册插件，传入自身依赖清单和导航位置等基础选项。插件默认提供全部内置详情，不要求应用逐篇注册 loader、维护语言资源、复制页面或手动整理模块信息。现有 `guideEntryLoaders` 仅作为可选覆盖机制保留。

- [内置详情入口](../../client/capability-guide/details/feature-overview-loaders.ts)：`builtInDetailLoaders` 集中维护按需加载的详情页面；`FEATURE_OVERVIEWS` 中的条目共用通用详情。
- [公共详情布局](../../client/capability-guide/details/detail-layout.tsx)：当前应用卡片、配置项、界面入口和可展开的 Agent 操作。
- [运行时适配](../../client/capability-guide/details/runtime-provider.tsx)：通过公开的应用运行时和授权客户端读取路由与权限，不依赖模板私有的路由上下文。
- [目录中文内容](../../shared/capability-guide/content/zh-CN.ts)与[详情文案](../../client/capability-guide/details/copy-zh-CN.ts)：由插件统一维护。
- 专用详情：[数据库](../../client/capability-guide/details/database-overview.tsx)、[数据库浏览器](../../client/capability-guide/details/database-explorer-overview.tsx)、[并发](../../client/capability-guide/details/concurrency-overview.tsx)、[文件管理](../../client/capability-guide/details/file-overview.tsx)、[身份认证](../../client/capability-guide/details/authentication-overview.tsx)、[授权](../../client/capability-guide/details/authorization-overview.tsx)、[AI Agent](../../client/capability-guide/details/agents-overview.tsx)、[多语言](../../client/capability-guide/details/i18n-overview.tsx)；API 密钥在通用详情中走 [api-keys-readiness.tsx](../../client/capability-guide/details/api-keys-readiness.tsx)。
- [详情测试](../../tests/client/details/)：从两个模板迁移并去重的已有用例，旧断言待设计确认后更新。
- [文件插件 Skill](../../../app-plugin-file/skills/nocobase-app-plugin-file/SKILL.md)、[Drive Skill](../../../../libs/drive/skills/nocobase-drive/SKILL.md)、[并发插件 Skill](../../../app-plugin-concurrency/skills/nocobase-app-plugin-concurrency/SKILL.md)、[数据库浏览器 Skill](../../../app-plugin-database-explorer/skills/nocobase-app-plugin-database-explorer/SKILL.md)：实现约束来源。

实际数据库浏览器、账号菜单、API 密钥管理等业务界面仍由对应插件或应用负责；foundation 识别实际存在的入口并链接，不复制它们的业务实现。页面身份通过稳定路由约定识别，权限通过公开授权能力判断，未知信息不能猜测。

复用插件自己的 UI 组件和公共主题 token。相同插件装到不同应用，展示该应用自己的配置和入口；不能引用某个模板的源文件，不能要求用户修改已安装的 foundation 包来登记页面。

## 8. 交付状态与后续验收

本轮只改文档，待确认后再改页面与测试：第 5 节 9 个模块改为与第 6 节相同的格式，所有模块的「当前应用」改为表格并标明读取来源和接口情况，3.2 改为状态表，页面文案与实现约束分开，目录条目数和模板打印收录按代码更正。没有修改页面代码、没有新增服务端接口，也没有修改或运行测试。

代码现状：并发和文件管理是界面草稿，配置读取未实现；数据库、数据库浏览器、身份认证、授权、API 密钥、多语言的界面判定已接入真实路由或已有接口；第 6 节模块仍是通用详情。旧测试保留，未按本轮结构更新；PR 最新提交的 CI 失败项留待确认后处理，不要把存在测试文件写成已验证通过。

后续验收逐项检查：

- 三块结构一致，顶部无重复介绍，入口和面包屑正确。
- 当前应用展示的是有来源的配置或界面事实；状态只用 3.2 的 7 种，未知、空数据、失败和无权限区分清楚。
- 数量完整且去重，实际配置不会被默认示例替代。
- Agent 操作具体，提示词像真实需求，复制的是编辑框内当前内容。
- 配置步骤与当前 Skill、实际实现一致，示例清楚标注，敏感配置不出现在概览中。
- 两个模板及其他宿主使用插件同一套详情，中英文内容一致，移动端无横向溢出。
- 设计确认后再补齐数据接口、相关测试及包级检查，在 PR 中更新验证结果和剩余限制。

## 最新页面草稿进度

剩余 13 个模块和 16 个示例插件已改为共用配置概览布局：先列对应配置，再列必要界面或资源事实，最后给出具体的 Agent 操作。已有专用详情页保持原有实现。中英文内容分别按模块编写，配置步骤与可编辑提示词分开。

实现位于 [公共模块布局](../../client/capability-guide/details/module-overview.tsx)、[模块内容](../../client/capability-guide/details/module-overviews.ts)和[示例内容](../../client/capability-guide/details/example-overviews.ts)。配置摘要和资源清单尚未接通读取，明确显示「待获取 / 待确认」，不把默认值或插件安装状态当成配置事实。已知界面使用运行时路由识别；自定义嵌入入口不能仅靠固定路由推断不存在。

本轮通过 foundation lint、build、UI 组件检查及两个应用模板的类型检查。没有新增或运行测试，也未进行浏览器验收。迁移的数据库概览前端用例仅模拟 API 返回的数据库类型，已使用仓库支持的标记说明其用途，数据库可移植性静态检查通过。真实配置读取、资源数量与最终界面验收仍待完成。

### 页面草稿的回归用例同步

已开始执行并同步测试：删除针对已取消的注册状态、前后端语言拆分和旧教学段落的断言，改为检查实际界面、未知配置、访问权限及提示词编辑复制。Agent 详情按界面路由判断，无需在用例中安装 Agent 插件。配置操作的展开按钮使用可见标题作为无障碍名称。模板认证测试固定本地 origin，避免开发者的公网预览环境改变 Cookie 和来源校验；不关闭认证的来源或 CSRF 检查。此前「未运行测试」描述对应原型阶段，最新结果以 PR 验证记录为准。
