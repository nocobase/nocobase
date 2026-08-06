---
title: "大模型选择"
description: "了解主流旗舰模型搭建 NocoBase 应用的实测结果、选择参考，以及覆盖数据建模、页面、权限和工作流的标准化评测体系。"
keywords: "NocoBase AI 搭建,大模型选择,GPT,DeepSeek,Qwen,AI Agent,模型评测"
---

# 大模型选择

:::tip 实测结论

目前市面上的主流旗舰模型都能够完成 NocoBase 应用的主体搭建。不同模型在单次产物的完整度、耗时和问题数量上有所差异，可以结合已有的模型服务、所在地区的网络条件、使用成本和团队习惯自主选择。

:::

本次使用一套标准的 CRM（销售机会与客户跟进系统）需求，对不同模型的搭建产物进行验收：

| 测评维度 | 标准化测评项 |
| :---: | :---: |
| 14 个 | 61 个 |

## 测评维度

本次测评覆盖 NocoBase 的基础能力、配置能力和基础组件，同时检查模型是否能够理解需求并执行对应的搭建任务。

| 能力 | 评测关注点 |
| --- | --- |
| 数据建模 | 数据表、字段类型、关联关系、必填、唯一和默认值 |
| 页面与功能 | 导航、列表、表单、详情、搜索、筛选和数据看板 |
| 业务逻辑 | 状态流转、业务校验、计算规则和关联数据一致性 |
| 权限与安全 | 角色、菜单权限、操作权限、数据范围和字段权限 |
| 工作流自动化 | 触发器、节点、条件分支、通知、数据副作用和失败重试 |
| 界面体验 | 信息架构、表单体验、操作反馈和响应式布局 |
| 稳健性 | 非法输入、重复提交、失败一致性、数据规模和网络恢复 |
| 需求覆盖 | 明确需求和核心业务路径是否完整实现 |
| 合理扩展 | 模型主动增加的功能是否具有明确业务用途 |
| 范围控制 | 是否存在重复、闲置或超出需求范围的业务模块 |

## 测评结果

![四个旗舰模型在十个结果质量维度上的验收结果，以及各模型的单次质量评分](https://static-docs.nocobase.com/Snipaste_2026-08-06_14-27-41.png)

:::tip 单次质量评分

单次质量评分满分为 100 分，首次完整验收每发现 1 个 Bug 扣 1 分，用于观察模型一次搭建的产物质量。通过后续反馈和修改，模型可以闭环修复这些问题。

:::

:::info 搭建耗时提示

搭建耗时会受到电脑硬件性能、依赖安装与 Build 编译、模型服务响应速度和网络条件等因素影响。

:::

## 测评项明细

61 个标准化测评项分为三层：搭建结果质量 46 项、需求理解与合理扩展 7 项、搭建过程效能 8 项。每一项均使用统一的检查方法和通过条件。

### 第一层：搭建结果质量（46 项）

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>测评维度</th><th>标准化测评项</th></tr></thead>
  <tbody>
    <tr><td>数据建模（8 项）</td><td><code>DM-01</code> 必需集合是否全部创建<br /><code>DM-02</code> 必需字段是否存在<br /><code>DM-03</code> 字段类型是否正确<br /><code>DM-04</code> 一对一关系能否创建和使用<br /><code>DM-05</code> 一对多关系能否创建和使用<br /><code>DM-06</code> 多对多关系能否创建和使用<br /><code>DM-07</code> 必填、唯一和默认值是否生效<br /><code>DM-08</code> 关联数据能否查看和筛选</td></tr>
    <tr><td>功能完成（6 项）</td><td><code>FC-01</code> 必需页面与导航入口是否齐全<br /><code>FC-02</code> 记录新增、查看、编辑和删除是否可用<br /><code>FC-03</code> 核心用户路径能否完整走通<br /><code>FC-04</code> 关键业务动作是否具备<br /><code>FC-05</code> 搜索、筛选和排序是否可用<br /><code>FC-06</code> 统计看板是否具备规定内容</td></tr>
    <tr><td>业务逻辑（6 项）</td><td><code>BL-01</code> 商机状态流转规则是否正确<br /><code>BL-02</code> 业务校验规则是否生效<br /><code>BL-03</code> 计算字段与统计口径是否正确<br /><code>BL-04</code> 线索转化后的数据映射是否正确<br /><code>BL-05</code> 关联记录更新是否保持一致<br /><code>BL-06</code> 删除与归档规则是否正确</td></tr>
    <tr><td>权限安全（7 项）</td><td><code>ACL-01</code> 必需角色是否全部创建<br /><code>ACL-02</code> 测试用户与角色分配是否正确<br /><code>ACL-03</code> 页面与菜单访问权限是否正确<br /><code>ACL-04</code> 数据操作权限是否正确<br /><code>ACL-05</code> 记录级数据范围是否正确<br /><code>ACL-06</code> 字段级查看与编辑权限是否正确<br /><code>ACL-07</code> 角色变更与多角色叠加是否正确</td></tr>
    <tr><td>工作流自动化（7 项）</td><td><code>WF-01</code> 必需工作流是否创建并启用<br /><code>WF-02</code> 工作流触发器设计是否正确<br /><code>WF-03</code> 节点顺序与数据传递是否正确<br /><code>WF-04</code> 条件与分支结果是否正确<br /><code>WF-05</code> 记录读写副作用是否正确<br /><code>WF-06</code> 通知对象与内容是否正确<br /><code>WF-07</code> 失败日志与重试行为是否可追踪</td></tr>
    <tr><td>界面体验（7 项）</td><td><code>UX-01</code> 导航与信息架构是否清晰<br /><code>UX-02</code> 列表信息与常用操作是否易用<br /><code>UX-03</code> 表单分组、顺序与提示是否清晰<br /><code>UX-04</code> 详情页是否支持理解和继续操作<br /><code>UX-05</code> 操作反馈与状态变化是否明确<br /><code>UX-06</code> 不同屏幕宽度下是否可用<br /><code>UX-07</code> 空数据、加载和错误状态是否完整</td></tr>
    <tr><td>稳健性（5 项）</td><td><code>ROB-01</code> 非法与边界输入是否安全处理<br /><code>ROB-02</code> 重复提交是否产生重复副作用<br /><code>ROB-03</code> 执行失败时是否保持数据一致<br /><code>ROB-04</code> 空数据与大数据量下是否可用<br /><code>ROB-05</code> 会话或网络中断后是否可恢复</td></tr>
  </tbody>
</table>

### 第二层：需求理解与合理扩展（7 项）

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>测评维度</th><th>标准化测评项</th></tr></thead>
  <tbody>
    <tr><td>需求覆盖（3 项）</td><td><code>COV-01</code> 提示词要求的页面与操作是否全部实现<br /><code>COV-02</code> 提示词要求的数据、权限和工作流是否全部实现<br /><code>COV-03</code> 主流程必需但提示词未逐项规定的能力是否具备</td></tr>
    <tr><td>合理扩展（2 项）</td><td><code>EXT-01</code> 主动补充的字段、关系和规则是否必要<br /><code>EXT-02</code> 主动增加的页面、操作和统计是否有明确用途</td></tr>
    <tr><td>范围控制（2 项）</td><td><code>SCOPE-01</code> 是否生成重复或未被使用的功能与配置<br /><code>SCOPE-02</code> 是否增加与任务范围无关的业务模块</td></tr>
  </tbody>
</table>

### 第三层：搭建过程效能（8 项）

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>测评维度</th><th>标准化测评项</th></tr></thead>
  <tbody>
    <tr><td>首次可用（1 项）</td><td><code>EFF-FIRST-01</code> 达到首次可用所需时间</td></tr>
    <tr><td>收敛效率（3 项）</td><td><code>EFF-FINAL-01</code> 达到最终验收所需轮次<br /><code>EFF-FINAL-02</code> 达到最终状态所需总时间<br /><code>EFF-FINAL-03</code> 达到最终状态消耗的 Token</td></tr>
    <tr><td>人工干预（1 项）</td><td><code>EFF-HUMAN-01</code> 评测过程中发生了多少次人工干预</td></tr>
    <tr><td>重复稳定性（3 项）</td><td><code>EFF-STABLE-01</code> 同任务重复运行的验收结果是否一致<br /><code>EFF-STABLE-02</code> 三次生成的集合、关系、角色和工作流是否一致<br /><code>EFF-STABLE-03</code> 轮次与耗时波动是否可控</td></tr>
  </tbody>
</table>

## 接下来

- [与 AI Agent 协作搭建](./agent-workflow.md) — 用自然语言描述页面和交互，并与 AI Agent 持续迭代
- [AI Portal 搭建快速开始](./index.md) — 创建并运行第一个 AI Portal
- [数据建模](../data-modeling.md) — 用自然语言创建数据表、字段和关联关系
- [工作流管理](../workflow.md) — 创建、编辑、启用和诊断工作流
- [权限配置](../acl.md) — 管理角色、权限策略、用户绑定和风险评估
