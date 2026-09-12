---
title: '用 NocoBase 搭建可联动的运营仪表盘'
description: '以工单运营仪表盘为例，组合图表区块、筛选区块与 JS 区块，实现统一筛选、KPI、图表下钻和自定义样式。'
keywords: 'NocoBase,运营仪表盘,数据可视化,图表区块,筛选区块,JS 区块,图表下钻'
---

# 用 NocoBase 搭建可联动的运营仪表盘

本文以“工单系统”的运营仪表盘为例，介绍如何组合使用 NocoBase 的图表区块、筛选区块和 JS 区块，搭建一个支持筛选联动、图表下钻和自定义样式的数据看板。

虽然示例来自工单场景，但这些方法也适用于 CRM、设备运维、项目管理、审批流、客户成功等业务系统。

:::tip
这篇文章想介绍的不是“怎么用 JS 区块写一个大屏”，而是如何把 NocoBase 的原生区块能力和 JS 区块组合起来：让原生区块负责标准能力，让 JS 区块补足个性化体验。
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## 场景目标

我们希望搭建一个 Operations dashboard，用来帮助运营或服务团队快速判断当前工作负载：

- 当前还有多少未完成工单
- 哪些工单存在 SLA 风险
- 新建工单趋势如何
- 工单状态、优先级分布如何
- 点击某个图表后，可以查看对应明细

页面大致可以分为四层：

1. 顶部筛选区：时间、服务组、请求类型、优先级、SLA 状态
2. KPI 统计区：Open backlog、Unassigned、SLA warning 等
3. 图表分析区：趋势、状态、SLA、优先级分布
4. 下钻明细区：点击图表后展示匹配记录

## 先明确一个搭建思路

很多人在做数据看板时，容易把问题想成二选一：

要么全部使用 NocoBase 的原生区块，配置简单，但担心样式和交互不够灵活；要么干脆写一个大的 JS 区块，把查询、图表、筛选、下钻都自己控制，但这样又会失去低代码配置带来的便利性。

实际上，更推荐的方式是把两者组合起来。

在这个 Operations dashboard 里，我们没有把整个页面写成一个 JS 大屏，而是按职责拆分：

- 顶部筛选使用 NocoBase 系统自带的筛选区块；
- 趋势图、状态分布、SLA 分布使用原生图表区块；
- KPI 卡片和下钻明细使用 JS 区块；
- 筛选区块同时影响图表区块和 JS 区块；
- 图表点击后，再把下钻条件传给下方 JS 明细区块。

这样做的好处是：标准统计和筛选仍然保留 NocoBase 的配置能力，个性化展示和复杂交互则交给 JS 区块完成。页面既不是“只能配置”，也不是“全部代码”，而是配置和代码各司其职。

---

## 一、图表区块如何自定义样式

![](https://static-docs.nocobase.com/202607121920941.png)

NocoBase 的图表区块可以先用 Query builder 定义统计口径，再用自定义 ECharts option 调整样式。

以“工单状态统计”为例，Query builder 可以配置为：

- 数据表：tickets
- 指标：id count，别名 ticketCount
- 维度：status

关键是自定义样式时，不需要重写查询，只需要基于 `ctx.data.objects` 处理图表展示。

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

这行代码读取图表查询结果。然后定义状态标签和颜色：

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

这里建议所有可见文案都使用 `ctx.t()`，方便后续支持多语言。

生成图表数据时，可以把下钻信息挂到每个图表数据点上：

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

这里最关键的是 `ticketingDrilldown`。它不是 ECharts 的标准字段，而是我们自己放进去的业务上下文，后续点击图表时会用到。

最后返回 ECharts option：

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

这一部分的核心思路是：

- Query builder 负责统计数据；
- Custom option 负责视觉表达；
- 自定义字段负责携带下钻上下文。

---

## 二、让系统筛选区块成为整个页面的观察口径

![](https://static-docs.nocobase.com/202607121920687.png)

运营仪表盘里的筛选区，不应该只是一个孤立的表单。它代表的是整个页面当前的观察口径。

例如用户选择了某个服务组、某个请求类型、某段创建时间，那么 KPI、趋势图、状态分布和下钻明细都应该基于同一组条件展示。否则页面上不同区块的数字就会互相打架，使用者也很难判断到底哪个数据才是当前范围内的结果。

这里我们直接使用 NocoBase 系统自带的筛选区块，而不是自己写一个筛选组件。原生筛选区块可以自然绑定到图表区块，让 Chart block 继续使用 Query builder、权限、刷新和筛选机制。

顶部 `Dashboard scope` 可以配置这些筛选项：

- Created at
- Service group
- Request type
- Priority
- SLA status

对于 JS 区块，只需要在代码里读取同一组筛选条件，再转换成查询 filter。这样 KPI 和下钻明细也能和原生图表保持一致。

过滤条件组合可以封装成一个小函数：

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

按过滤条件统计数量：

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

这里的关键点是：

```javascript
resource.setFilter(filter);
await resource.refresh();
```

JS 区块通过 resource 查询业务数据，而不是直接写 SQL。这样更容易和 NocoBase 的权限、数据源和页面运行时保持一致。

---

## 三、用 JS 区块展示 KPI 卡片

![](https://static-docs.nocobase.com/202607121920374.png)

KPI 更适合使用 JS 区块。因为 KPI 通常不是一个单独查询，而是多个业务口径的组合：未完成、未分派、SLA warning、SLA breached、新建、已解决等。

JS 区块可以根据当前筛选范围重新查询数据，并渲染成统计卡片。

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

JS 区块的关键点是：

- 用 `ctx.makeResource()` 查询数据；
- 用 `ctx.libs.antd` 渲染界面；
- 用 `ctx.render()` 输出内容；
- 筛选变化后重新渲染 JS 区块。

在真实页面里，筛选按钮和重置按钮可以配置事件流，让它们在完成原生筛选动作后，同时刷新 KPI JS 区块和下钻 JS 区块。这样用户点击一次筛选，图表和自定义内容都会基于同一个范围更新。

---

## 四、图表联动 JS 区块做下钻

![](https://static-docs.nocobase.com/202607121921577.png)

图表点击下钻是仪表盘里很实用的交互。

在工单场景里，用户点击 “Status: Open” 柱子，下方明细区显示所有 Open 工单；点击 “SLA breached”，下方显示所有超时工单。

实现思路是：

1. 图表数据点上携带 `ticketingDrilldown`；
2. 图表事件读取这个下钻信息；
3. 把下钻信息写入目标 JS 区块上下文；
4. 触发目标 JS 区块重新渲染。

图表事件中的关键代码如下。先找到下钻 JS 区块：

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

然后把图表点击得到的下钻条件写入目标区块：

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

最关键的是这两行：

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

第一行把下钻条件交给 JS 区块，第二行触发 JS 区块刷新。

最后绑定图表点击事件：

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

这里推荐一定要返回 cleanup：

```javascript
return () => chart.off('click', clickHandler);
```

这样图表重新配置或重新渲染时，可以清理旧事件，避免重复绑定。

上述点击事件相关代码适用于 [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) 以上版本，旧版本代码参考：

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 五、下钻 JS 区块如何展示明细

![](https://static-docs.nocobase.com/202607121921601.png)

下钻 JS 区块读取刚才写入的 `ticketingDashboardDrilldown`，然后按其中的 filter 查询数据。

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

如果用户还没有点击图表，就显示一个提示。点击后，根据 `drilldown.filter` 查询工单：

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

然后渲染表格：

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

如果需要清除下钻条件，可以参考

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

这部分的关键点是：

- 图表只负责传递 filter；
- JS 区块负责查询和展示明细；
- 点击不同图表，可以共用同一个下钻区块。

---

## 实践建议

### 1. 不要急着把复杂页面整体代码化

这个页面最重要的经验是：不要把原生能力和 JS 能力对立起来。

如果一个能力已经是 NocoBase 的原生能力，比如筛选、图表查询、表格展示、权限控制，就优先用原生区块。这样后续调整字段、筛选条件、图表口径时，仍然可以在界面上配置。

JS 区块更适合处理那些原生区块不擅长的部分，例如多个指标组合成一组 KPI、特殊卡片样式、点击图表后展示一组自定义明细、或者在不同区块之间传递业务上下文。

换句话说，原生区块负责“可配置的标准能力”，JS 区块负责“业务化的个性体验”。这也是这个仪表盘最值得复用的搭建思路。

### 2. 简单统计优先用图表区块 Query builder

这样可以保留 NocoBase 的标准查询、权限、筛选和刷新能力。只有当默认图表样式无法表达业务重点时，再通过自定义 ECharts option 做视觉优化。

### 3. KPI 卡片优先用 JS 区块

KPI 通常需要多个查询、条件组合和自定义布局，JS 区块更灵活。尤其是当 KPI 需要响应同一组系统筛选条件时，用 JS 区块统一处理会更清晰。

### 4. 图表事件要返回 cleanup

推荐写法：

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

不要直接使用 `chart.off('click')` 清空所有点击事件，这可能会误删图表区块或配置面板自己的监听。

---

## 让 AI 帮你搭建

这类仪表盘非常适合让 AI 辅助生成，因为它同时涉及数据模型、统计口径、图表样式和页面交互。你可以把这篇文章的内容交给它，并参考下面的提示词进行提问。

你可以这样提问：

```markdown
我正在用 NocoBase 搭建一个工单系统的运营仪表盘。
请以工单场景为例，帮我设计一个 Operations dashboard。

数据表 tickets 包含：
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

页面需要：

1. 顶部筛选：Created at、Service group、Request type、Priority、SLA status。
2. KPI 卡片：Open backlog、Unassigned、SLA warning、SLA breached、New tickets、Resolved tickets。
3. 图表：Created tickets trend、Ticket status、SLA status、Priority mix。
4. 点击图表后，下方 JS 区块展示匹配的 Ticket drilldown 表格。
5. 图表样式要适合运营大盘，颜色清晰，布局紧凑。
6. 所有 JS 文案使用 ctx.t()。
7. 图表事件使用 chart.on，并返回 cleanup 函数。
8. 优先使用 NocoBase 原生筛选区块和图表区块，只有 KPI、下钻明细、特殊样式和跨区块交互使用 JS 区块，不要把整个页面写成一个大 JS 区块。

请给出每个区块的配置思路，并标出关键 JS 代码。
```

如果你已经有页面，也可以让 AI 帮你优化：

```markdown
这是我现在的 NocoBase 仪表盘设计：
顶部是筛选区，中间是 4 个图表，下面是下钻 JS 区块。
请帮我从运营人员使用体验角度优化：

1. KPI 应该展示哪些指标；
2. 图表之间是否需要联动；
3. 下钻明细应该展示哪些列；
4. JS 区块和图表事件应该如何组织；
5. 哪些代码应该放在图表 custom option，哪些应该放在 JS 区块。
```

这样 AI 生成的内容会更接近真实业务，而不是只给出孤立代码。

:::warning
如果选择让 AI 帮你搭建，在开始前请用备份管理器先备份项目。
:::

## 参考文档

- [图表配置](/data-visualization/guide/chart-options)
- [前端 RunJS](/runjs/)
- [筛选表单](/interface-builder/blocks/filter-blocks/form)
- [AI 搭建 - 界面搭建](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
