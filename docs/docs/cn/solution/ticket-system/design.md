# 工单方案详细设计

> **版本**: v2.0-beta

> **更新日期**: 2026-01-05

> **状态**: 预览版

## 1. 系统概述与设计理念

### 1.1 系统定位

本系统是一套 **AI驱动的智能工单管理平台**，基于 NocoBase 低代码平台构建。核心目标是：

```
让客服更专注于解决问题，而非繁琐的流程操作
```

### 1.2 设计理念

#### 理念一：T型数据架构

**什么是T型架构？**

借鉴"T型人才"的理念——横向广度 + 纵向深度：

- **横向（主表）**：覆盖所有业务类型的通用能力——编号、状态、处理人、SLA 等核心字段
- **纵向（扩展表）**：深入特定业务的专业字段——设备维修有序列号，投诉有赔偿方案

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**为什么这样设计？**

| 传统方案 | T型架构 |
|----------|---------|
| 每种业务一张表，字段重复 | 公共字段统一管理，业务字段按需扩展 |
| 统计报表需要合并多张表 | 一张主表直接统计所有工单 |
| 流程变更要改多处 | 核心流程只改一处 |
| 新增业务类型要建新表 | 只需新增扩展表，主流程不变 |

#### 理念二：AI员工团队

不是"AI功能"，而是"AI员工"。每个AI有明确的角色、性格、职责：

| AI员工 | 岗位 | 核心职责 | 触发场景 |
|--------|------|----------|----------|
| **Sam** | 服务台主管 | 工单分流、优先级评估、升级决策 | 工单创建时自动 |
| **Grace** | 客户成功专家 | 回复生成、语气调整、投诉处理 | 客服点击"AI回复" |
| **Max** | 知识助手 | 相似案例、知识推荐、解决方案综合 | 工单详情页自动 |
| **Lexi** | 翻译官 | 多语言翻译、评论翻译 | 检测到外语时自动 |

**为什么用"AI员工"模式？**

- **职责清晰**：Sam管分流，Grace管回复，不会混乱
- **易于理解**：对用户说"让Sam分析一下"比"调用分类API"更友好
- **可扩展**：新增AI能力 = 招聘新员工

#### 理念三：知识自循环

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

这形成了一个 **知识沉淀-知识应用** 的闭环。

---

## 2. 核心实体与数据模型

### 2.1 实体关系总览

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 核心表详解

#### 2.2.1 工单主表 (nb_tts_tickets)

这是系统的核心，采用"宽表"设计，将常用字段全部放入主表。

**基础信息**

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | BIGINT | 主键 | 1001 |
| ticket_no | VARCHAR | 工单编号 | TKT-20251229-0001 |
| title | VARCHAR | 标题 | 网络连接缓慢 |
| description | TEXT | 问题描述 | 今早开始办公室网络... |
| biz_type | VARCHAR | 业务类型 | it_support |
| priority | VARCHAR | 优先级 | P1 |
| status | VARCHAR | 状态 | processing |

**来源追溯**

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| source_system | VARCHAR | 来源系统 | crm / email / iot |
| source_channel | VARCHAR | 来源渠道 | web / phone / wechat |
| external_ref_id | VARCHAR | 外部引用ID | CRM-2024-0001 |

**联系人信息**

| 字段 | 类型 | 说明 |
|------|------|------|
| customer_id | BIGINT | 客户ID |
| contact_name | VARCHAR | 联系人姓名 |
| contact_phone | VARCHAR | 联系电话 |
| contact_email | VARCHAR | 联系邮箱 |
| contact_company | VARCHAR | 公司名称 |

**处理人信息**

| 字段 | 类型 | 说明 |
|------|------|------|
| assignee_id | BIGINT | 处理人ID |
| assignee_department_id | BIGINT | 处理部门ID |
| transfer_count | INT | 转交次数 |

**时间节点**

| 字段 | 类型 | 说明 | 触发时机 |
|------|------|------|----------|
| submitted_at | TIMESTAMP | 提交时间 | 工单创建时 |
| assigned_at | TIMESTAMP | 分派时间 | 指定处理人时 |
| first_response_at | TIMESTAMP | 首响时间 | 首次回复客户时 |
| resolved_at | TIMESTAMP | 解决时间 | 状态变更为resolved时 |
| closed_at | TIMESTAMP | 关闭时间 | 状态变更为closed时 |

**SLA相关**

| 字段 | 类型 | 说明 |
|------|------|------|
| sla_config_id | BIGINT | SLA配置ID |
| sla_response_due | TIMESTAMP | 响应截止时间 |
| sla_resolve_due | TIMESTAMP | 解决截止时间 |
| sla_paused_at | TIMESTAMP | SLA暂停开始时间 |
| sla_paused_duration | INT | 累计暂停时长(分钟) |
| is_sla_response_breached | BOOLEAN | 响应是否违约 |
| is_sla_resolve_breached | BOOLEAN | 解决是否违约 |

**AI分析结果**

| 字段 | 类型 | 说明 | 由谁填充 |
|------|------|------|----------|
| ai_category_code | VARCHAR | AI识别分类 | Sam |
| ai_sentiment | VARCHAR | 情绪分析 | Sam |
| ai_urgency | VARCHAR | 紧急度 | Sam |
| ai_keywords | JSONB | 关键词 | Sam |
| ai_reasoning | TEXT | 推理过程 | Sam |
| ai_suggested_reply | TEXT | 建议回复 | Sam/Grace |
| ai_confidence_score | NUMERIC | 置信度 | Sam |
| ai_analysis | JSONB | 完整分析结果 | Sam |

**多语言支持**

| 字段 | 类型 | 说明 | 由谁填充 |
|------|------|------|----------|
| source_language_code | VARCHAR | 原始语言 | Sam/Lexi |
| target_language_code | VARCHAR | 目标语言 | 系统默认EN |
| is_translated | BOOLEAN | 是否已翻译 | Lexi |
| description_translated | TEXT | 翻译后描述 | Lexi |

#### 2.2.2 业务扩展表

**设备维修 (nb_tts_biz_repair)**

| 字段 | 类型 | 说明 |
|------|------|------|
| ticket_id | BIGINT | 关联工单ID |
| equipment_model | VARCHAR | 设备型号 |
| serial_number | VARCHAR | 序列号 |
| fault_code | VARCHAR | 故障代码 |
| spare_parts | JSONB | 备件清单 |
| maintenance_type | VARCHAR | 维护类型 |

**IT支持 (nb_tts_biz_it_support)**

| 字段 | 类型 | 说明 |
|------|------|------|
| ticket_id | BIGINT | 关联工单ID |
| asset_number | VARCHAR | 资产编号 |
| os_version | VARCHAR | 操作系统版本 |
| software_name | VARCHAR | 涉及软件 |
| remote_address | VARCHAR | 远程地址 |
| error_code | VARCHAR | 错误代码 |

**客户投诉 (nb_tts_biz_complaint)**

| 字段 | 类型 | 说明 |
|------|------|------|
| ticket_id | BIGINT | 关联工单ID |
| related_order_no | VARCHAR | 涉及订单号 |
| complaint_level | VARCHAR | 投诉等级 |
| compensation_amount | DECIMAL | 赔偿金额 |
| compensation_type | VARCHAR | 赔偿方式 |
| root_cause | TEXT | 根本原因 |

#### 2.2.3 评论表 (nb_tts_ticket_comments)

**核心字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| ticket_id | BIGINT | 工单ID |
| parent_id | BIGINT | 父评论ID (支持树形) |
| content | TEXT | 评论内容 |
| direction | VARCHAR | 方向: inbound(客户)/outbound(客服) |
| is_internal | BOOLEAN | 是否内部备注 |
| is_first_response | BOOLEAN | 是否首次响应 |

**AI审核字段 (用于outbound)**

| 字段 | 类型 | 说明 |
|------|------|------|
| source_language_code | VARCHAR | 源语言 |
| content_translated | TEXT | 翻译内容 |
| is_translated | BOOLEAN | 是否翻译 |
| is_ai_blocked | BOOLEAN | 是否被AI拦截 |
| ai_block_reason | VARCHAR | 拦截原因 |
| ai_block_detail | TEXT | 详细说明 |
| ai_quality_score | NUMERIC | 质量评分 |
| ai_suggestions | TEXT | 改进建议 |

#### 2.2.4 评价表 (nb_tts_ratings)

| 字段 | 类型 | 说明 |
|------|------|------|
| ticket_id | BIGINT | 工单ID (唯一) |
| overall_rating | INT | 总体满意度 (1-5) |
| response_rating | INT | 响应速度 (1-5) |
| professionalism_rating | INT | 专业程度 (1-5) |
| resolution_rating | INT | 问题解决 (1-5) |
| nps_score | INT | NPS评分 (0-10) |
| tags | JSONB | 快捷标签 |
| comment | TEXT | 文字评价 |

#### 2.2.5 知识文章表 (nb_tts_qa_articles)

| 字段 | 类型 | 说明 |
|------|------|------|
| article_no | VARCHAR | 文章编号 KB-T0001 |
| title | VARCHAR | 标题 |
| content | TEXT | 内容(Markdown) |
| summary | TEXT | 摘要 |
| category_code | VARCHAR | 分类代码 |
| keywords | JSONB | 关键词 |
| source_type | VARCHAR | 来源: ticket/faq/manual |
| source_ticket_id | BIGINT | 源工单ID |
| ai_generated | BOOLEAN | 是否AI生成 |
| ai_quality_score | NUMERIC | 质量评分 |
| status | VARCHAR | 状态: draft/published/archived |
| view_count | INT | 浏览次数 |
| helpful_count | INT | 有帮助数 |

### 2.3 数据表清单

| 序号 | 表名 | 说明 | 记录类型 |
|------|------|------|----------|
| 1 | nb_tts_tickets | 工单主表 | 业务数据 |
| 2 | nb_tts_biz_repair | 设备维修扩展 | 业务数据 |
| 3 | nb_tts_biz_it_support | IT支持扩展 | 业务数据 |
| 4 | nb_tts_biz_complaint | 客户投诉扩展 | 业务数据 |
| 5 | nb_tts_customers | 客户主表 | 业务数据 |
| 6 | nb_tts_customer_contacts | 客户联系人 | 业务数据 |
| 7 | nb_tts_ticket_comments | 工单评论 | 业务数据 |
| 8 | nb_tts_ratings | 满意度评价 | 业务数据 |
| 9 | nb_tts_qa_articles | 知识文章 | 知识数据 |
| 10 | nb_tts_qa_article_relations | 文章关联 | 知识数据 |
| 11 | nb_tts_faqs | 常见问题 | 知识数据 |
| 12 | nb_tts_tickets_categories | 工单分类 | 配置数据 |
| 13 | nb_tts_sla_configs | SLA配置 | 配置数据 |
| 14 | nb_tts_skill_configs | 技能配置 | 配置数据 |
| 15 | nb_tts_business_types | 业务类型 | 配置数据 |

---

## 3. 工单生命周期

### 3.1 状态定义

| 状态 | 中文 | 说明 | SLA计时 | 颜色 |
|------|------|------|---------|------|
| new | 新建 | 刚创建，等待分派 | 开始 | 🔵 蓝色 |
| assigned | 已分派 | 已指定处理人，等待接单 | 继续 | 🔷 青色 |
| processing | 处理中 | 正在处理 | 继续 | 🟠 橙色 |
| pending | 挂起 | 等待客户反馈 | **暂停** | ⚫ 灰色 |
| transferred | 已转交 | 转给其他人 | 继续 | 🟣 紫色 |
| resolved | 已解决 | 等待客户确认 | 停止 | 🟢 绿色 |
| closed | 已关闭 | 工单结束 | 停止 | ⚫ 灰色 |
| cancelled | 已取消 | 工单取消 | 停止 | ⚫ 灰色 |

### 3.2 状态流转图

**主流程（从左到右）**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**分支流程**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**完整状态机**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 关键状态转换规则

| 从 | 到 | 触发条件 | 系统动作 |
|----|----|---------|---------|
| new | assigned | 指定处理人 | 记录assigned_at |
| assigned | processing | 处理人点击"接单" | 无 |
| processing | pending | 点击"挂起" | 记录sla_paused_at |
| pending | processing | 客户回复 / 手动恢复 | 计算暂停时长，清空paused_at |
| processing | resolved | 点击"解决" | 记录resolved_at |
| resolved | closed | 客户确认 / 3天超时 | 记录closed_at |
| * | cancelled | 取消工单 | 无 |


---

## 4. SLA服务等级管理

### 4.1 优先级与SLA配置

| 优先级 | 名称 | 响应时间 | 解决时间 | 预警阈值 | 典型场景 |
|--------|------|----------|----------|----------|----------|
| P0 | 紧急 | 15分钟 | 2小时 | 80% | 系统宕机、生产线停止 |
| P1 | 高 | 1小时 | 8小时 | 80% | 重要功能故障 |
| P2 | 中 | 4小时 | 24小时 | 80% | 一般问题 |
| P3 | 低 | 8小时 | 72小时 | 80% | 咨询、建议 |

### 4.2 SLA计算逻辑

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### 创建工单时

```
响应截止时间 = 提交时间 + 响应时限（分钟）
解决截止时间 = 提交时间 + 解决时限（分钟）
```

#### 挂起时 (pending)

```
SLA暂停开始时间 = 当前时间
```

#### 恢复时 (从pending回到processing)

```
-- 计算本次暂停时长
本次暂停时长 = 当前时间 - SLA暂停开始时间

-- 累加到总暂停时长
累计暂停时长 = 累计暂停时长 + 本次暂停时长

-- 延长截止时间（暂停期间不计入SLA）
响应截止时间 = 响应截止时间 + 本次暂停时长
解决截止时间 = 解决截止时间 + 本次暂停时长

-- 清空暂停开始时间
SLA暂停开始时间 = 空
```

#### SLA违约判定

```
-- 响应违约判定
响应是否违约 = (首次响应时间为空 且 当前时间 > 响应截止时间)
            或 (首次响应时间 > 响应截止时间)

-- 解决违约判定
解决是否违约 = (解决时间为空 且 当前时间 > 解决截止时间)
            或 (解决时间 > 解决截止时间)
```

### 4.3 SLA预警机制

| 预警等级 | 条件 | 通知对象 | 通知方式 |
|----------|------|----------|----------|
| 黄色预警 | 剩余时间 < 20% | 处理人 | 站内消息 |
| 红色预警 | 已超时 | 处理人+主管 | 站内消息+邮件 |
| 升级预警 | 超时1小时 | 部门经理 | 邮件+短信 |

### 4.4 SLA仪表盘指标

| 指标 | 计算公式 | 健康阈值 |
|------|----------|----------|
| 响应达标率 | 未违约工单数 / 总工单数 | > 95% |
| 解决达标率 | 解决未违约数 / 已解决工单数 | > 90% |
| 平均响应时间 | SUM(响应时间) / 工单数 | < SLA的50% |
| 平均解决时间 | SUM(解决时间) / 工单数 | < SLA的80% |

---

## 5. AI能力与员工系统

### 5.1 AI员工团队

系统配置8位AI员工，分为两类：

**新建员工（工单系统专用）**

| ID | 姓名 | 岗位 | 核心能力 |
|----|------|------|----------|
| sam | Sam | 服务台主管 | 工单分流、优先级评估、升级决策、SLA风险识别 |
| grace | Grace | 客户成功专家 | 专业回复生成、语气调整、投诉处理、满意度恢复 |
| max | Max | 知识助手 | 相似案例查找、知识推荐、解决方案综合 |

**复用员工（通用能力）**

| ID | 姓名 | 岗位 | 核心能力 |
|----|------|------|----------|
| dex | Dex | 数据整理师 | 邮件提取工单、电话转工单、批量数据清洗 |
| ellis | Ellis | 邮件专家 | 邮件情绪分析、线程摘要、回复起草 |
| lexi | Lexi | 翻译官 | 工单翻译、回复翻译、实时对话翻译 |
| cole | Cole | NocoBase专家 | 系统使用指导、工作流配置帮助 |
| vera | Vera | 研究分析师 | 技术方案研究、产品信息核查 |

### 5.2 AI任务清单

每位AI员工配置4个具体任务：

#### Sam的任务

| 任务ID | 名称 | 触发方式 | 说明 |
|--------|------|----------|------|
| SAM-01 | 工单分析分流 | 工作流自动 | 新工单创建时自动分析 |
| SAM-02 | 优先级重评估 | 前端交互 | 根据新信息调整优先级 |
| SAM-03 | 升级决策 | 前端/工作流 | 判断是否需要升级 |
| SAM-04 | SLA风险评估 | 工作流自动 | 识别超时风险 |

#### Grace的任务

| 任务ID | 名称 | 触发方式 | 说明 |
|--------|------|----------|------|
| GRACE-01 | 专业回复生成 | 前端交互 | 根据上下文生成回复 |
| GRACE-02 | 回复语气调整 | 前端交互 | 优化已有回复的语气 |
| GRACE-03 | 投诉降级处理 | 前端/工作流 | 化解客户投诉 |
| GRACE-04 | 满意度恢复 | 前端/工作流 | 负面体验后的跟进 |

#### Max的任务

| 任务ID | 名称 | 触发方式 | 说明 |
|--------|------|----------|------|
| MAX-01 | 相似案例查找 | 前端/工作流 | 查找历史相似工单 |
| MAX-02 | 知识文章推荐 | 前端/工作流 | 推荐相关知识文章 |
| MAX-03 | 解决方案综合 | 前端交互 | 从多源综合解决方案 |
| MAX-04 | 故障排除指南 | 前端交互 | 创建系统性排查流程 |

#### Lexi的任务

| 任务ID | 名称 | 触发方式 | 说明 |
|--------|------|----------|------|
| LEXI-01 | 工单翻译 | 工作流自动 | 翻译工单内容 |
| LEXI-02 | 回复翻译 | 前端交互 | 翻译客服回复 |
| LEXI-03 | 批量翻译 | 工作流自动 | 批量翻译处理 |
| LEXI-04 | 实时对话翻译 | 前端交互 | 实时翻译对话 |

### 5.3 AI员工与工单生命周期

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 AI响应示例

#### SAM-01 工单分析响应

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "登录失败", "超时", "月末结算"],
  "confidence": 0.92,
  "reasoning": "该工单描述ERP系统登录问题，影响财务部门月末结算，紧急程度较高",
  "suggested_reply": "尊敬的客户，感谢您反馈此问题...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hello, our ERP system cannot login..."
}
```

#### GRACE-01 回复生成响应

```
尊敬的张先生，

感谢您联系我们反馈ERP登录问题。我完全理解这个问题正在影响贵司的月末结算工作，
我们已将此问题列为高优先级处理。

目前情况：
- 技术团队正在排查服务器连接问题
- 预计30分钟内给您更新进展

在此期间，您可以尝试：
1. 通过备用地址访问: https://erp-backup.company.com
2. 如有紧急报表需求，可联系我们协助导出

如有其他问题，请随时联系我。

此致
技术支持团队
```

### 5.5 AI情商防火墙

Grace负责的回复质量审核会拦截以下问题：

| 问题类型 | 示例原文 | AI建议 |
|----------|----------|--------|
| 否定语气 | "不行，这不在保修范围" | "该故障暂时无法享受免费保修，我们可以提供付费维修方案" |
| 指责客户 | "你自己弄坏的" | "经核实，该故障属于意外损坏" |
| 推卸责任 | "不是我们的问题" | "让我帮您进一步排查问题原因" |
| 冷漠表达 | "不知道" | "我来帮您查询一下相关信息" |
| 敏感信息 | "您的密码是abc123" | [拦截] 包含敏感信息，不允许发送 |

---

## 6. 知识库体系

### 6.1 知识来源

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 工单转知识流程

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**评估维度**：
- **通用性**: 这是常见问题吗?
- **完整性**: 解决方案清晰完整吗?
- **可重复性**: 步骤可复用吗?

### 6.3 知识推荐机制

当客服打开工单详情时，Max自动推荐相关知识：

```
┌────────────────────────────────────────────────────────────┐
│ 📚 推荐知识                                    [展开/收起]  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC伺服系统故障诊断指南        匹配度: 94%    │ │
│ │ 包含: 报警代码解读、伺服驱动器检查步骤                  │ │
│ │ [查看] [应用到回复] [标记有帮助]                        │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000系列维护手册        匹配度: 87%    │ │
│ │ 包含: 常见故障、预防性维护计划                          │ │
│ │ [查看] [应用到回复] [标记有帮助]                        │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. 工作流引擎

### 7.1 工作流分类

| 编号 | 分类 | 说明 | 触发方式 |
|------|------|------|----------|
| WF-T | 工单流程 | 工单生命周期管理 | 表单事件 |
| WF-S | SLA流程 | SLA计算与预警 | 表单事件/定时 |
| WF-C | 评论流程 | 评论处理与翻译 | 表单事件 |
| WF-R | 评价流程 | 评价邀请与统计 | 表单事件/定时 |
| WF-N | 通知流程 | 通知发送 | 事件驱动 |
| WF-AI | AI流程 | AI分析与生成 | 表单事件 |

### 7.2 核心工作流

#### WF-T01: 工单创建流程

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: 工单AI分析

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: 评论翻译与审核

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: 知识生成

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 定时任务

| 任务 | 执行频率 | 说明 |
|------|----------|------|
| SLA预警检查 | 每5分钟 | 检查即将超时的工单 |
| 工单自动关闭 | 每天 | resolved状态3天后自动关闭 |
| 评价邀请发送 | 每天 | 关闭后24小时发送评价邀请 |
| 统计数据更新 | 每小时 | 更新客户工单统计 |

---

## 8. 菜单与界面设计

### 8.1 后台管理端

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 客户门户端

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 仪表盘设计

#### 高管视图

| 组件 | 类型 | 数据说明 |
|------|------|----------|
| SLA达标率 | 仪表盘 | 本月响应/解决达标率 |
| 满意度趋势 | 折线图 | 近30天满意度变化 |
| 工单量趋势 | 柱状图 | 近30天工单量 |
| 业务类型分布 | 饼图 | 各业务类型占比 |

#### 主管视图

| 组件 | 类型 | 数据说明 |
|------|------|----------|
| 超时预警 | 列表 | 即将超时/已超时工单 |
| 人员工作量 | 柱状图 | 团队成员工单数 |
| 积压分布 | 堆叠图 | 各状态工单数量 |
| 处理时效 | 热力图 | 平均处理时间分布 |

#### 客服视图

| 组件 | 类型 | 数据说明 |
|------|------|----------|
| 我的待办 | 数字卡片 | 待处理工单数 |
| 优先级分布 | 饼图 | P0/P1/P2/P3分布 |
| 今日统计 | 指标卡 | 今日处理/解决数 |
| SLA倒计时 | 列表 | 最紧急的5个工单 |

---

## 附录

### A. 业务类型配置

| 类型代码 | 名称 | 图标 | 关联扩展表 |
|----------|------|------|------------|
| repair | 设备维修 | 🔧 | nb_tts_biz_repair |
| it_support | IT支持 | 💻 | nb_tts_biz_it_support |
| complaint | 客户投诉 | 📢 | nb_tts_biz_complaint |
| consultation | 咨询建议 | ❓ | 无 |
| other | 其他 | 📝 | 无 |

### B. 分类代码

| 代码 | 名称 | 说明 |
|------|------|------|
| CONVEYOR | 输送系统 | 输送系统问题 |
| PACKAGING | 包装机 | 包装机问题 |
| WELDING | 焊接设备 | 焊接设备问题 |
| COMPRESSOR | 空压机 | 空压机问题 |
| COLD_STORE | 冷库 | 冷库问题 |
| CENTRAL_AC | 中央空调 | 中央空调问题 |
| FORKLIFT | 叉车 | 叉车问题 |
| COMPUTER | 电脑 | 电脑硬件问题 |
| PRINTER | 打印机 | 打印机问题 |
| PROJECTOR | 投影仪 | 投影仪问题 |
| INTERNET | 网络 | 网络连接问题 |
| EMAIL | 邮件 | 邮件系统问题 |
| ACCESS | 权限 | 账户权限问题 |
| PROD_INQ | 产品咨询 | 产品咨询 |
| COMPLAINT | 一般投诉 | 一般投诉 |
| DELAY | 物流延误 | 物流延误投诉 |
| DAMAGE | 包装损坏 | 包装损坏投诉 |
| QUANTITY | 数量短缺 | 数量短缺投诉 |
| SVC_ATTITUDE | 服务态度 | 服务态度投诉 |
| PROD_QUALITY | 产品质量 | 产品质量投诉 |
| TRAINING | 培训 | 培训请求 |
| RETURN | 退货 | 退货请求 |

---

*文档版本: 2.0 | 最后更新: 2026-01-05*
