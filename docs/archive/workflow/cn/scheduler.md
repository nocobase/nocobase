---
title: '定时任务'
description: '让 Agent 使用 Scheduler 插件开发可观测、可启停的定时任务。'
---

# 定时任务

定时任务插件提供通过代码定义“按固定时间触发”业务动作的能力，并让管理员在 UI 上查看排程、启停任务、追踪每次触发的结果。开发者通常不需要手写完整实现细节，而是把业务需求、可观测要求和验收条件交给应用 Agent，由 Agent 使用当前应用同步的 Scheduler Skill 完成代码、同步和验证。

## 什么时候使用

优先使用 Scheduler 的场景：

- 每天、每小时、每几分钟触发一次同步、汇总、清理、提醒或巡检；
- 管理员需要看到任务是否启用、下次运行时间、历史触发记录和失败原因；
- 触发动作需要幂等，不能因为进程重启或 worker 重试产生重复业务效果。

不需要管理员在 UI 上查看和启停的后台任务，不必接入 Scheduler；周期性的用应用自己的 `ScheduleExecutor`，一次性的后台工作用 `JobExecutor`，二者都来自应用的 jobs 服务。如果业务需要人工审批、版本化流程、路径观测和节点级运行记录，优先让 Agent 评估是否使用[工作流](./workflow)。

## 使用 Agent 开发

Scheduler 插件随包发布 `nocobase-app-plugin-scheduler` Skill。插件启用后，应用会把它同步到 `.agents/skills/`；如果目录缺失或明显过期，在应用根目录运行：

```bash
pnpm nocobase skills sync
```

通常不需要显式指定 Skill。只要需求包含“定时运行”和“管理员可在 UI 观测”，应用 Agent 应主动发现并使用它。开发者可以直接描述业务目标、处理规则和管理员需要看到的结果，例如：

> 我们需要一个“每日客户回访提醒”：每个工作日早上 9 点，找出昨天仍未联系的客户，为负责销售创建待办并发送站内提醒。管理员需要能看到任务是否启用、每次执行处理了多少客户以及失败原因；同一个客户在同一天不能重复创建提醒。请先了解当前应用已有的数据、通知和自动化能力，选择合适的实现方式并简要说明方案，确认后再完成开发和验证。

一个高质量需求应说明：

- 什么时候运行：Cron、人类时间描述、时区、起止时间或次数上限；
- 执行什么：调用哪个业务动作、工作流或外部系统；
- 管理员需要看什么：任务名称、说明、成功标准、失败时如何定位；
- 验收证据：需要跑哪些测试、是否要在 UI 中看到一次真实执行。

## 提示词示例

先用这个通用模板描述需求：

> 我需要一个管理员可观测的定时任务：`<什么时候运行>`，按 `<时区>`，执行 `<业务动作>`。管理员需要看到 `<任务名称、说明、成功或失败依据>`。请先了解当前应用和这项业务，提出实现方案并确认；确认后再完成开发、同步和验证。

### 生成经营报表

> 每天凌晨 2 点按 `Asia/Shanghai` 时区生成经营报表。现有“经营报表”功能已经可以完成报表生成，管理员需要看到下次运行时间和每次执行是否成功。请先了解现有实现并提出方案；确认后完成开发，并告诉我如何在界面中验证。

### 库存检查与补货建议

> 每天 01:00 检查库存并生成补货建议。现在还没有这项自动化能力，请设计并实现完整方案。管理员需要知道本次检查处理了哪些商品、生成了多少补货建议，以及失败时如何定位；同一批库存数据重复处理不能产生重复建议。请先说明方案，确认后再开发和验证。

### 客户状态同步

> 每 10 分钟同步一次客户状态。请复用现有的客户同步能力，不要改变现有业务规则。管理员要看到每次同步是否成功、同步了多少客户以及失败原因；重复执行同一时间段的同步不能造成重复更新。请先说明方案，确认后再开发和验证。

### 大批量对账

> 每晚 23:30 执行一次大批量对账，数据量很大，通常需要几十分钟才能完成。管理员需要看到任务已经开始、当前是否仍在处理，最终能确认成功或失败，并能定位失败原因；同一批账单不能被重复对账。请先了解当前应用的对账实现和运行条件，提出方案并确认；确认后完成开发和验证。

### 修改已有定时任务

> 把现有“每日经营报表”的执行时间从每天 02:00 改为每天 03:30，时区仍然是 `Asia/Shanghai`。请先找到现有实现并修改它，不要创建重复的任务；完成后确认管理员界面中的下次运行时间已经更新。

<!--
### 停用已经从代码删除的任务

> 旧的客户同步功能已经下线。请确认管理员界面不再把它显示为有效任务，同时保留过去的执行记录，方便追溯；不要直接删除历史数据，并说明处理结果。

### 诊断失败的定时任务

> 请诊断“每日经营报表”最近一次失败。只读取现有记录，不要修改代码或重跑任务。请说明这次任务何时开始、执行到哪一步、具体失败原因，以及管理员后续应该关注什么；如果还需要查看关联的业务流程，请一并给出定位结果。-->

### 审核 Agent 方案

> 先不要改代码。我们希望每周一早上生成上周的销售分析并通知各区域负责人。请根据当前应用已有能力给出实现方案，说明运行时间、业务步骤、管理员能看到的结果、失败后的处理方式、需要我确认的信息，以及完成后如何验证。

Agent 应报告它选择的执行模型、稳定 schedule key、时区、目标类型、同步命令、验证命令和未验证的运行边界。不要只接受“已实现”四个字；让 Agent 给出实际检查证据。

## 推荐开发流程

1. **确认是否需要 Scheduler。** 关键判断是管理员是否需要通过 UI 查看、启停和追踪执行记录。没有这个要求时，用应用自己的 `ScheduleExecutor` 更合适。
2. **根据业务选择执行任务类型。** 需要多个流程步骤、节点级观测、人工介入或较长时间运行的任务，使用工作流类 job；单一动作、无需节点级观测和人工介入的任务，使用普通 job。是否使用工作流应由业务场景决定，而不是由任务是否已经存在工作流来决定。
3. **定义任务。** 在应用或业务插件 Provider 中调用 `schedulerServiceToken.defineSchedule(definition)`，使用应用内全局唯一且稳定的 `key`，建议使用业务命名空间，例如 `sales.daily-report`。
4. **同步并验证。** 运行 `pnpm nocobase scheduler sync --json`，用管理员账号进入“设置 → 自动化 → 定时任务”确认任务、下次运行时间和执行记录。
5. **发布时 finalize。** 生产部署确认完整插件清单已加载后，每个应用运行一次 `pnpm nocobase scheduler sync --finalize --json`，软停用代码中已移除的定义。

## 常用服务 API

开发者最常用的是 Scheduler service 实例上的 `defineSchedule()`。它注册“这个应用应该有哪些定时任务”，Scheduler 在同步时把这些代码定义写入排程表，并保留管理员在 UI 上做过的启停状态。

```ts
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';

export default class DailyReportScheduleProvider extends ServiceProvider<Application> {
  public readonly name = 'app/daily-report-schedule';

  public override async boot(): Promise<void> {
    if (!this.app.container.has(schedulerServiceToken)) return;

    const scheduler = this.app.container.resolve(schedulerServiceToken);
    scheduler.defineSchedule({
      key: 'daily-analytics-report',
      title: '每日经营报表',
      description: '每天 02:00 触发经营报表工作流。',
      schedule: { cron: '0 2 * * *', timezone: 'Asia/Shanghai' },
      target: {
        type: 'workflow',
        config: { workflowKey: 'example-analytics-report', input: {} },
      },
    });
  }
}
```

`key` 是应用内全局唯一的稳定标识。应用名和 `key` 共同构成持久身份；改名不是原地更新，而是创建一个新定义。多个业务模块可以使用带命名空间的 key，例如 `sales.daily-report` 和 `inventory.daily-report`。

`register()` 和 `boot()` 都会在 Scheduler 自己的 `start()` 读取清单前执行完。只要在这两个生命周期里定义任务，插件之间的启动顺序通常不需要额外协调；在 `start()` 之后再定义的任务，要等下一次同步才会生效。

定义字段：

| 字段                    | 说明                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `key`                   | 稳定标识，匹配 `^[A-Za-z0-9][A-Za-z0-9._:-]*$`，在应用内全局唯一。                    |
| `title` / `description` | 管理界面显示的标题和说明；标题必填。                                                  |
| `schedule.cron`         | 五段或六段 Cron。`*/5 * * * *` 表示每五分钟，`*/10 * * * * *` 表示每十秒。            |
| `schedule.timezone`     | 默认 `UTC`；业务本地时间应显式使用 IANA 时区，例如 `Asia/Shanghai`。                  |
| `schedule.from` / `to`  | 可选的包含边界，使用带明确时区的 `Date`；`from` 不能晚于 `to`。                       |
| `schedule.limit`        | 可选正整数，限制开始执行的触发次数，不是成功完成次数。                                |
| `target.type`           | 已注册的执行目标类型，例如 Workflow 插件提供的 `workflow`，或业务插件自己注册的类型。 |
| `target.config`         | JSON 对象。不能放函数、Service 实例、密码、API key、访问令牌或其他秘密。              |

`defineSchedule()` 会校验 Cron、时区、敏感配置字段和目标类型，规范化定义并计算哈希。不要手写哈希，也不要直接修改 `schedule_definitions` 或 `schedule_occurrences`。

## 使用内置 Workflow 目标

多数“需要 UI 观测的复杂定时业务”可以拆成两层：Scheduler 负责“什么时候触发”，Workflow 负责“触发后做哪些步骤”。Workflow 插件注册了内置目标 `workflow`，所以定时任务只需要引用工作流源码目录名：

```ts
scheduler.defineSchedule({
  key: 'nightly-inventory-check',
  title: '夜间库存检查',
  schedule: { cron: '0 1 * * *', timezone: 'Asia/Shanghai' },
  target: {
    type: 'workflow',
    config: {
      workflowKey: 'inventory-replenishment',
      input: { source: 'schedule' },
    },
  },
});
```

`workflowKey` 是工作流 source root 的目录名，不是标题或数据库里的版本 id。工作流目标会用本次定时任务 occurrence 作为幂等来源启动运行。工作流不存在、被禁用或输入不符合当前版本要求时，任务会在执行记录中显示失败或跳过原因。

让 Agent 同时处理工作流和定时任务时，应要求它分别报告：工作流目录、输入约定、定时任务 key、Cron、时区、同步结果，以及至少一次执行记录如何检查。

## 扩展开发：自定义目标

只有当内置 `workflow` 目标不能表达执行边界，或你要接入应用自有 Service、`JobExecutor`、外部执行系统时，才需要注册自定义 target。这个 API 是扩展开发入口，不是每个定时任务都要写。

```ts
const handle = scheduler.registerTarget({
  type: 'app.customer-sync',
  title: '客户同步',
  validate: validateCustomerSyncConfig,
  async start(config, context) {
    // executor is the target owner's JobExecutor, set up with CustomerSyncJob registered.
    await executor.addJob(
      new CustomerSyncJob({ ...config, occurrenceId: context.occurrenceId }),
    );
    // The reference is the occurrence's own execution record, stable across repeated starts.
    return {
      state: 'accepted',
      reference: { type: 'app.customer-sync', id: context.occurrenceId },
    };
  },
  async inspect(reference) {
    return inspectCustomerSyncJob(reference.id);
  },
  referenceHref(reference) {
    return `/settings/customer-sync/jobs/${encodeURIComponent(reference.id)}`;
  },
});
```

目标类型要带命名空间，避免和其他插件冲突。`app.` 适合应用自有目标，插件目标可以使用插件名或包名前缀。重复注册同一个 `type` 会在启动时报错。

短任务可以在 `start()` 中直接返回 `{ state: 'completed', outcome: 'succeeded' }`。长耗时任务应交给 `JobExecutor` 或外部系统执行，然后返回 `accepted`，并同时满足：

- 用 `context.occurrenceId` 作为 reference 和幂等键：job 按 occurrence 记录执行状态，同一个 occurrence 重复分发时找到的是同一个业务执行；
- 在实际成功、失败、取消或超时后调用 `handle.reportCompletion(occurrenceId, reference, completion)`。结果由 job 自己判定，判定后正常结束而不是抛错，因为 job 无法知道哪一次尝试是最后一次；
- 实现 `inspect(reference)`，让 Scheduler 在通知丢失、进程重启或通知早于接受记录落库时能补偿状态。

`start()` 可以返回四类结果：

| 返回值                                                  | 含义                                           |
| ------------------------------------------------------- | ---------------------------------------------- |
| `{ state: 'completed', outcome: 'succeeded', result? }` | 同步完成且成功。不要用于只是提交了任务的情况。 |
| `{ state: 'accepted', reference, receipt? }`            | 已被异步执行系统接受，Scheduler 等待最终完成。 |
| `{ state: 'skipped', reason }`                          | 本次触发应跳过。                               |
| `{ state: 'failed', reason }`                           | 启动或同步执行失败。                           |

完成回报的状态是 `succeeded`、`failed`、`cancelled` 或 `timed_out`。`receipt`、`result`、`reason`、`reference` 和展示信息都应保持简短、可控、无敏感信息。

## 同步和发布

新增或修改定义后，在目标应用根目录运行：

```bash
pnpm nocobase scheduler sync --json
```

普通同步会加载完整应用、校验已注册目标、非破坏性 upsert 定义，并保留管理员在 UI 上做过的启停状态。应用正常启动时也会自动执行一次非破坏性同步，然后 Scheduler 开始按排程执行。

排程在哪里运行由应用的 `jobs` 配置决定。没有设置 `jobs.default` 时使用内置的 memory 适配器：状态保存在进程内存中，启动时从 `storage/jobs` 读取，应用停止时写回，进程被强制结束时会丢失启动以来的变化。这个适配器下，运行中的应用停止时会覆盖 `scheduler sync` 写入的内容，但不会因此丢失什么：每次启动都会从代码重新同步，并再次删除已停用和已失效定义的规则。部署多个实例前，在 `config.yml` 中把 `jobs.default` 设为 `redis`，每次触发只会在其中一个实例上执行。

如果要让 Scheduler 的排程使用单独的一套配置，在 `scheduler.jobs`（或环境变量 `SCHEDULER_JOBS`）中写出它的名字；不设置时跟随 `jobs.default`。排程使用这套配置的 `concurrency` 和 `attempts`。`attempts` 请保持为 `1`：失败的触发已经记录为该次执行的结果，重试时发现已有记录，不会再执行。

生产部署确认所有插件都已加载后，每个应用运行一次：

```bash
pnpm nocobase scheduler sync --finalize --json
```

`--finalize` 会把代码清单中已不存在的定义软停用，并保留历史记录。不要在只加载了部分插件的进程里 finalize。

## 管理员操作

管理员只在界面上操作，不直接编辑代码定义。进入“设置 → 自动化 → 定时任务”后，可以查看任务列表、搜索、按状态和目标类型筛选、启停任务，并打开详情页查看定义摘要、目标信息、下次运行时间和最近 100 条执行记录。

列表状态含义：

- **运行中**：任务启用，定义仍在代码清单中，目标可用；
- **已暂停**：管理员通过 UI 禁用了任务；
- **已失效**：`--finalize` 后，该定义已经从代码清单中移除；
- **目标异常**：目标缺失、禁用或配置无效。

执行记录常见状态：

- `pending` / `running`：Scheduler 已领取或正在分发；
- `waiting`：目标已接受请求，正在等待最终完成；
- `succeeded`：目标成功完成；
- `failed`：分发或目标执行失败；
- `skipped`：目标主动跳过或不可运行；
- `cancelled` / `timed_out`：异步目标以取消或超时结束；
- `triggered`：旧记录只表示目标已接受请求，最终结果未知。

界面可以启停任务，但不能新建、编辑或删除代码定义。遇到目标异常、定义失效或持续失败，应由开发者或 Agent 修复源代码、重新同步，并确认目标自己的 worker 或工作流运行正常。

## 审核 Agent 的交付

开发者审核时重点看证据：

- 是否说明为什么使用 Scheduler，而不是应用自己的 `ScheduleExecutor` 或工作流单独处理；
- 是否读取了当前应用已安装插件、Provider、`jobs` 配置和权限入口；
- 是否使用应用内全局唯一且稳定的 `key`、Cron 和 IANA 时区；
- 是否区分了内置 `workflow` 目标和自定义 target 扩展；
- 是否说明幂等策略、异步完成回报和失败后的观测方式；
- 是否运行了类型检查、相关测试、构建或同步命令，并说明跳过项；
- 是否能在管理员 UI 中看到任务和一次执行记录，或说明为什么无法现场验证。
