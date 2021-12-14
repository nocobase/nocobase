# Automations

## HTTP API

```bash
# 自动化列表
GET     /api/automations
# 添加自动化
POST    /api/automations
# 获取某一条自动化配置详情
GET     /api/automations/<automationId>?appends=on,nodes
# 修改
PUT     /api/automations/<automationId>
# 删除
DELETE  /api/automations/<automationId>

# 创建触发器
POST    /api/automations/<automationId>/on
# 触发器详情
GET     /api/automations/<automationId>/on
# 修改触发器配置
PUT     /api/automations/<automationId>/on
# 删除触发器配置
DELETE  /api/automations/<automationId>/on

# 节点列表（递归）
GET    /api/automations/<automationId>/nodes
# 新增节点
POST    /api/automations/<automationId>/nodes
# 节点详情
GET     /api/automations/<automationId>/nodes/<nodeId>
# 修改节点
PUT     /api/automations/<automationId>/nodes/<nodeId>
# 删除节点
DELETE  /api/automations/<automationId>/nodes/<nodeId>
```

## 参数说明

```ts
interface AutomationOptions {
  title?: string;
  active?: boolean;
  on?: TriggerOptions;
  // 条件节点之后，action 只能写在每个条件之后
  nodes?: NodeOptions[];
}

// 触发类型，可扩展
type TriggerOptions = 
  // 新增数据后触发
  | CollectionsAfterCreateTriggerOptions
  // 更新数据后触发
  | CollectionsAfterUpdateTriggerOptions
  // 新增或更新数据后触发
  | CollectionsAfterSaveTriggerOptions
  // 删除数据后触发
  | CollectionsAfterDestroyTriggerOptions
  // 根据日期字段触发
  | CollectionsScheduleTriggerOptions
  // 自定义时间触发
  | ScheduleTriggerOptions
// 条件
type WhenOptions = any;

interface CollectionsAfterCreateTriggerOptions {
  type: 'collections:afterCreate';
  collectionName: string;
  when:? WhenOptions;
}

interface CollectionsAfterUpdateTriggerOptions {
  type: 'collections:afterUpdate';
  collectionName: string;
  changed?: string[];
  when:? WhenOptions;
}

interface CollectionsAfterSaveTriggerOptions {
  type: 'collections:afterSave';
  collectionName: string;
  changed?: string[];
  when:? WhenOptions;
}

interface CollectionsAfterDestroyTriggerOptions {
  type: 'collections:afterDestroy';
  collectionName: string;
  when:? WhenOptions;
}

type DateTimeOptions = {
  // 日期时间
  value?: string;
  // 日期字段
  byField?: string;
  // 偏移，小于零之前，大于零之后，等于零当天
  offset?: number;
  unit?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
};

// 支持的几种格式
// every second 每秒
// every 2 seconds 每 2 秒
// cron 格式：，如 '* * * * * *'
type Unit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
type CronType = 
  | 'every second'
  | 'every minute'
  | 'every hour'
  | 'every day'
  | 'every week'
  | 'every month'
  | `every ${[x: number]} ${[unit: Unit]}`
  //  cron 格式，如 '* * * * * *'
  | CustomCron;

interface CollectionsScheduleTriggerOptions {
  type: 'collections:schedule';
  collectionName: string;
  // 开始时间
  startTime: DateTimeOptions;
  // 结束方式：
  // 永不结束 - null
  // 指定重复次数 - 2 times
  // 根据日期字段 - byField
  endMode?: 'byField' | `${[x: number]} times`;
  // 结束时间
  endTime: DateTimeOptions;
  // 重复周期
  cron: CronType;
}

interface ScheduleTriggerOptions {
  type: 'schedule';
  startTime: DateTimeOptions,
  endMode: 'customTime' | 'none' | 'times';
  endTime: DateTimeOptions,
  cron: CronType,
}

// 节点类型，总共就两大类 condition 和 action
type NodeOptions = ActionNodeOptions | ConditioNodeOptions;
// 动作节点类型，可扩展
type ActionNodeOptions = CreateActionNodeOptions | UpdateActionNodeOptions;
// 条件 when...otherwise...
type ConditionOptions = WhenConditionOptions | OtherwiseConditionOptions;

interface ConditioNodeOptions {
  type: 'condition';
  conditions: ConditionOptions[];
}

interface WhenConditionOptions {
  when: WhenOptions;
  run: ActionNodeOptions[];
}

interface OtherwiseConditionOptions {
  run: ActionNodeOptions[];
}

interface CreateActionNodeOptions {
  type: 'action';
  actionType: 'create';
  actionParams?: {};
}

interface UpdateActionNodeOptions {
  type: 'action';
  actionType: 'create';
  actionParams?: {};
}
```

## 示例：

### Trigger

新增数据后触发

```yml
on:
  # 触发器类型
  type: afterCreate
  # 数据表名
  collectionName: 'demos'
  # filter 条件
  when:
    col1: val1
```

更新数据后触发

```yml
on:
  # 触发器类型
  type: afterUpdate
  # 数据表名
  collectionName: 'demos'
  changed:
    - field1
    - field2
  # filter 条件
  when:
    col1: val1
```

新增或更新数据后触发

```yml
on:
  # 触发器类型
  type: afterSave
  # 数据表名
  collectionName: 'demos'
  changed:
    - field1
    - field2
  # filter 条件
  when:
    col1: val1
```

删除数据后触发

```yml
on:
  # 触发器类型
  type: afterDestroy
  # 数据表名
  collectionName: 'demos'
  # filter 条件
  when:
    col1: val1
```

### Node

总览

```yml
nodes:
  - type: action
  - type: action
  - type: action
  - type: condition # 条件之后，action 只能写在 condition 里

nodes:
  - type: condition
    conditions:
      - when: xx
        run: 
          - type: action
          - type: condition
      - when:
        run: 
          - type: action
          - type: condition
      - otherwise:
        run: 
          - type: action
          - type: condition
```
