# CRM 2.0 系统详细设计


## 1. 系统概述与设计理念

### 1.1 系统定位

本系统是基于 NocoBase 无代码平台构建的 **CRM 2.0 销售管理平台**。核心目标是：

```
让销售专注于建立客户关系，而非数据录入和重复性分析
```

系统通过工作流自动化处理常规任务，并借助 AI 辅助完成线索评分、商机分析等工作，帮助销售团队提升效率。

### 1.2 设计理念

#### 理念一：完整的销售漏斗

**端到端销售流程：**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**为什么这样设计？**

| 传统方式 | 集成式 CRM |
|---------|-----------|
| 不同阶段使用多个系统 | 单一系统覆盖全生命周期 |
| 系统间手动数据传递 | 自动数据流转和转化 |
| 客户视图不一致 | 统一的客户 360 度视图 |
| 分散的数据分析 | 端到端销售管线分析 |

#### 理念二：可配置的销售管线
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)


不同行业可以自定义销售管线阶段，无需修改代码。

#### 理念三：模块化设计

- 核心模块（客户+商机）必需，其他模块可按需启用
- 禁用模块不需要修改代码，通过 NocoBase 界面配置即可
- 每个模块独立设计，降低耦合度

---

## 2. 模块架构与定制化

### 2.1 模块概述

CRM 系统采用**模块化架构**设计——每个模块可以根据业务需求独立启用或禁用。
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 模块依赖关系

| 模块 | 是否必需 | 依赖项 | 禁用条件 |
|-----|---------|--------|---------|
| **客户管理** | ✅ 是 | - | 无法禁用（核心） |
| **商机管理** | ✅ 是 | 客户管理 | 无法禁用（核心） |
| **线索管理** | 可选 | - | 不需要线索获取 |
| **报价管理** | 可选 | 商机、产品 | 简单交易无需正式报价 |
| **订单管理** | 可选 | 商机（或报价） | 不需要订单/付款跟踪 |
| **产品管理** | 可选 | - | 不需要产品目录 |
| **邮件集成** | 可选 | 客户、联系人 | 使用外部邮件系统 |

### 2.3 预配置版本

| 版本 | 包含模块 | 使用场景 | 数据表数量 |
|-----|---------|---------|-----------|
| **轻量版** | 客户 + 商机 | 简单交易跟踪 | 6 |
| **标准版** | 轻量版 + 线索 + 报价 + 订单 + 产品 | 完整销售周期 | 15 |
| **企业版** | 标准版 + 邮件集成 | 完整功能含邮件 | 17 |

### 2.4 模块-数据表映射

#### 核心模块数据表（始终必需）

| 数据表 | 模块 | 描述 |
|-------|------|------|
| nb_crm_customers | 客户管理 | 客户/公司记录 |
| nb_crm_contacts | 客户管理 | 联系人 |
| nb_crm_customer_shares | 客户管理 | 客户共享权限 |
| nb_crm_opportunities | 商机管理 | 销售商机 |
| nb_crm_opportunity_stages | 商机管理 | 阶段配置 |
| nb_crm_opportunity_users | 商机管理 | 商机协作者 |
| nb_crm_activities | 活动管理 | 活动记录 |
| nb_crm_comments | 活动管理 | 评论/备注 |
| nb_crm_tags | 核心 | 共享标签 |
| nb_cbo_currencies | 基础数据 | 货币字典 |
| nb_cbo_regions | 基础数据 | 国家/地区字典 |

### 2.5 如何禁用模块

在 NocoBase 管理后台隐藏该模块的菜单入口即可，无需修改代码或删除数据表。

---

## 3. 核心实体与数据模型

### 3.1 实体关系概述
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 核心数据表详情

#### 3.2.1 线索表（nb_crm_leads）

采用简化的 4 阶段工作流的线索管理。

**阶段流程：**
```
新建 → 跟进中 → 已验证 → 转化为客户/商机
         ↓          ↓
      不合格      不合格
```

**关键字段：**

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| lead_no | VARCHAR | 线索编号（自动生成） |
| name | VARCHAR | 联系人姓名 |
| company | VARCHAR | 公司名称 |
| title | VARCHAR | 职位 |
| email | VARCHAR | 邮箱 |
| phone | VARCHAR | 电话 |
| mobile_phone | VARCHAR | 手机 |
| website | TEXT | 网站 |
| address | TEXT | 地址 |
| source | VARCHAR | 线索来源：website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | 行业 |
| annual_revenue | VARCHAR | 年营收规模 |
| number_of_employees | VARCHAR | 员工数量规模 |
| status | VARCHAR | 状态：new/working/qualified/unqualified |
| rating | VARCHAR | 评级：hot/warm/cold |
| owner_id | BIGINT | 负责人（FK → users） |
| ai_score | INTEGER | AI 质量评分 0-100 |
| ai_convert_prob | DECIMAL | AI 转化概率 |
| ai_best_contact_time | VARCHAR | AI 推荐联系时间 |
| ai_tags | JSONB | AI 生成的标签 |
| ai_scored_at | TIMESTAMP | AI 评分时间 |
| ai_next_best_action | TEXT | AI 下一步最佳行动建议 |
| ai_nba_generated_at | TIMESTAMP | AI 建议生成时间 |
| is_converted | BOOLEAN | 已转化标记 |
| converted_at | TIMESTAMP | 转化时间 |
| converted_customer_id | BIGINT | 转化的客户 ID |
| converted_contact_id | BIGINT | 转化的联系人 ID |
| converted_opportunity_id | BIGINT | 转化的商机 ID |
| lost_reason | TEXT | 丢失原因 |
| disqualification_reason | TEXT | 不合格原因 |
| description | TEXT | 描述 |

#### 3.2.2 客户表（nb_crm_customers）

支持外贸业务的客户/公司管理。

**关键字段：**

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| name | VARCHAR | 客户名称（必填） |
| account_number | VARCHAR | 客户编号（自动生成，唯一） |
| phone | VARCHAR | 电话 |
| website | TEXT | 网站 |
| address | TEXT | 地址 |
| industry | VARCHAR | 行业 |
| type | VARCHAR | 类型：prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | 员工数量规模 |
| annual_revenue | VARCHAR | 年营收规模 |
| level | VARCHAR | 级别：normal/important/vip |
| status | VARCHAR | 状态：potential/active/dormant/churned |
| country | VARCHAR | 国家 |
| region_id | BIGINT | 地区（FK → nb_cbo_regions） |
| preferred_currency | VARCHAR | 首选货币：CNY/USD/EUR |
| owner_id | BIGINT | 负责人（FK → users） |
| parent_id | BIGINT | 母公司（FK → self） |
| source_lead_id | BIGINT | 来源线索 ID |
| ai_health_score | INTEGER | AI 健康度评分 0-100 |
| ai_health_grade | VARCHAR | AI 健康度等级：A/B/C/D |
| ai_churn_risk | DECIMAL | AI 流失风险 0-100% |
| ai_churn_risk_level | VARCHAR | AI 流失风险等级：low/medium/high |
| ai_health_dimensions | JSONB | AI 健康度各维度得分 |
| ai_recommendations | JSONB | AI 建议列表 |
| ai_health_assessed_at | TIMESTAMP | AI 健康评估时间 |
| ai_tags | JSONB | AI 生成的标签 |
| ai_best_contact_time | VARCHAR | AI 推荐联系时间 |
| ai_next_best_action | TEXT | AI 下一步最佳行动建议 |
| ai_nba_generated_at | TIMESTAMP | AI 建议生成时间 |
| description | TEXT | 描述 |
| is_deleted | BOOLEAN | 软删除标记 |

#### 3.2.3 商机表（nb_crm_opportunities）

采用可配置销售管线阶段的销售商机管理。

**关键字段：**

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| opportunity_no | VARCHAR | 商机编号（自动生成，唯一） |
| name | VARCHAR | 商机名称（必填） |
| amount | DECIMAL | 预期金额 |
| currency | VARCHAR | 货币 |
| exchange_rate | DECIMAL | 汇率 |
| amount_usd | DECIMAL | 美元等值金额 |
| customer_id | BIGINT | 客户（FK） |
| contact_id | BIGINT | 主要联系人（FK） |
| stage | VARCHAR | 阶段代码（FK → stages.code） |
| stage_sort | INTEGER | 阶段排序（冗余，便于排序） |
| stage_entered_at | TIMESTAMP | 进入当前阶段时间 |
| days_in_stage | INTEGER | 当前阶段停留天数 |
| win_probability | DECIMAL | 手动赢率 |
| ai_win_probability | DECIMAL | AI 预测赢率 |
| ai_analyzed_at | TIMESTAMP | AI 分析时间 |
| ai_confidence | DECIMAL | AI 预测置信度 |
| ai_trend | VARCHAR | AI 预测趋势：up/stable/down |
| ai_risk_factors | JSONB | AI 识别的风险因素 |
| ai_recommendations | JSONB | AI 建议列表 |
| ai_predicted_close | DATE | AI 预测成交日期 |
| ai_next_best_action | TEXT | AI 下一步最佳行动建议 |
| ai_nba_generated_at | TIMESTAMP | AI 建议生成时间 |
| expected_close_date | DATE | 预计成交日期 |
| actual_close_date | DATE | 实际成交日期 |
| owner_id | BIGINT | 负责人（FK → users） |
| last_activity_at | TIMESTAMP | 最后活动时间 |
| stagnant_days | INTEGER | 无活动天数 |
| loss_reason | TEXT | 丢单原因 |
| competitor_id | BIGINT | 竞争对手（FK） |
| lead_source | VARCHAR | 线索来源 |
| campaign_id | BIGINT | 营销活动 ID |
| expected_revenue | DECIMAL | 预期收入 = amount × probability |
| description | TEXT | 描述 |

#### 3.2.4 报价表（nb_crm_quotations）

支持多币种和审批流程的报价管理。

**状态流程：**
```
草稿 → 待审批 → 已批准 → 已发送 → 已接受/已拒绝/已过期
           ↓
       被驳回 → 修改 → 草稿
```

**关键字段：**

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| quotation_no | VARCHAR | 报价单号（自动生成，唯一） |
| name | VARCHAR | 报价单名称 |
| version | INTEGER | 版本号 |
| opportunity_id | BIGINT | 商机（FK，必填） |
| customer_id | BIGINT | 客户（FK） |
| contact_id | BIGINT | 联系人（FK） |
| owner_id | BIGINT | 负责人（FK → users） |
| currency_id | BIGINT | 货币（FK → nb_cbo_currencies） |
| exchange_rate | DECIMAL | 汇率 |
| subtotal | DECIMAL | 小计 |
| discount_rate | DECIMAL | 折扣率 |
| discount_amount | DECIMAL | 折扣金额 |
| shipping_handling | DECIMAL | 运费/手续费 |
| tax_rate | DECIMAL | 税率 |
| tax_amount | DECIMAL | 税额 |
| total_amount | DECIMAL | 总金额 |
| total_amount_usd | DECIMAL | 美元等值金额 |
| status | VARCHAR | 状态：draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | 提交时间 |
| approved_by | BIGINT | 审批人（FK → users） |
| approved_at | TIMESTAMP | 审批时间 |
| rejected_at | TIMESTAMP | 驳回时间 |
| sent_at | TIMESTAMP | 发送时间 |
| customer_response_at | TIMESTAMP | 客户响应时间 |
| expired_at | TIMESTAMP | 过期时间 |
| valid_until | DATE | 有效期至 |
| payment_terms | TEXT | 付款条款 |
| terms_condition | TEXT | 条款条件 |
| address | TEXT | 送货地址 |
| description | TEXT | 描述 |

#### 3.2.5 订单表（nb_crm_orders）

含收款跟踪的订单管理。

**关键字段：**

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| order_no | VARCHAR | 订单编号（自动生成，唯一） |
| customer_id | BIGINT | 客户（FK） |
| contact_id | BIGINT | 联系人（FK） |
| opportunity_id | BIGINT | 商机（FK） |
| quotation_id | BIGINT | 报价（FK） |
| owner_id | BIGINT | 负责人（FK → users） |
| currency | VARCHAR | 货币 |
| exchange_rate | DECIMAL | 汇率 |
| order_amount | DECIMAL | 订单金额 |
| paid_amount | DECIMAL | 已付金额 |
| unpaid_amount | DECIMAL | 未付金额 |
| status | VARCHAR | 状态：pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | 付款状态：unpaid/partial/paid |
| order_date | DATE | 下单日期 |
| delivery_date | DATE | 预计交付日期 |
| actual_delivery_date | DATE | 实际交付日期 |
| shipping_address | TEXT | 送货地址 |
| logistics_company | VARCHAR | 物流公司 |
| tracking_no | VARCHAR | 物流单号 |
| terms_condition | TEXT | 条款条件 |
| description | TEXT | 描述 |

### 3.3 数据表汇总

#### CRM 业务表

| 序号 | 表名 | 描述 | 类型 |
|-----|------|------|------|
| 1 | nb_crm_leads | 线索管理 | 业务 |
| 2 | nb_crm_customers | 客户/公司 | 业务 |
| 3 | nb_crm_contacts | 联系人 | 业务 |
| 4 | nb_crm_opportunities | 销售商机 | 业务 |
| 5 | nb_crm_opportunity_stages | 阶段配置 | 配置 |
| 6 | nb_crm_opportunity_users | 商机协作者（销售团队） | 关联 |
| 7 | nb_crm_quotations | 报价单 | 业务 |
| 8 | nb_crm_quotation_items | 报价明细 | 业务 |
| 9 | nb_crm_quotation_approvals | 审批记录 | 业务 |
| 10 | nb_crm_orders | 订单 | 业务 |
| 11 | nb_crm_order_items | 订单明细 | 业务 |
| 12 | nb_crm_payments | 收款记录 | 业务 |
| 13 | nb_crm_products | 产品目录 | 业务 |
| 14 | nb_crm_product_categories | 产品分类 | 配置 |
| 15 | nb_crm_price_tiers | 阶梯定价 | 配置 |
| 16 | nb_crm_activities | 活动记录 | 业务 |
| 17 | nb_crm_comments | 评论/备注 | 业务 |
| 18 | nb_crm_competitors | 竞争对手 | 业务 |
| 19 | nb_crm_tags | 标签 | 配置 |
| 20 | nb_crm_lead_tags | 线索-标签关联 | 关联 |
| 21 | nb_crm_contact_tags | 联系人-标签关联 | 关联 |
| 22 | nb_crm_customer_shares | 客户共享权限 | 关联 |
| 23 | nb_crm_exchange_rates | 汇率历史 | 配置 |

#### 基础数据表（公共模块）

| 序号 | 表名 | 描述 | 类型 |
|-----|------|------|------|
| 1 | nb_cbo_currencies | 货币字典 | 配置 |
| 2 | nb_cbo_regions | 国家/地区字典 | 配置 |

### 3.4 辅助表

#### 3.4.1 评论表（nb_crm_comments）

通用评论/备注表，可关联到多种业务对象。

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| content | TEXT | 评论内容 |
| lead_id | BIGINT | 关联线索（FK） |
| customer_id | BIGINT | 关联客户（FK） |
| opportunity_id | BIGINT | 关联商机（FK） |
| order_id | BIGINT | 关联订单（FK） |

#### 3.4.2 客户共享表（nb_crm_customer_shares）

实现客户的多人协作和权限共享。

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| customer_id | BIGINT | 客户（FK，必填） |
| shared_with_user_id | BIGINT | 被共享用户（FK，必填） |
| shared_by_user_id | BIGINT | 共享发起人（FK） |
| permission_level | VARCHAR | 权限级别：read/write/full |
| shared_at | TIMESTAMP | 共享时间 |

#### 3.4.3 商机协作者表（nb_crm_opportunity_users）

支持商机的销售团队协作。

| 字段 | 类型 | 描述 |
|-----|------|------|
| opportunity_id | BIGINT | 商机（FK，联合主键） |
| user_id | BIGINT | 用户（FK，联合主键） |
| role | VARCHAR | 角色：owner/collaborator/viewer |

#### 3.4.4 地区表（nb_cbo_regions）

国家/地区基础数据字典。

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| code_alpha2 | VARCHAR | ISO 3166-1 二字母代码（唯一） |
| code_alpha3 | VARCHAR | ISO 3166-1 三字母代码（唯一） |
| code_numeric | VARCHAR | ISO 3166-1 数字代码 |
| name | VARCHAR | 国家/地区名称 |
| is_active | BOOLEAN | 是否启用 |
| sort_order | INTEGER | 排序 |

---

## 4. 线索生命周期

线索管理采用简化的 4 阶段工作流，新线索创建时可通过工作流自动触发 AI 评分，辅助销售快速识别高质量线索。

### 4.1 状态定义

| 状态 | 名称 | 描述 |
|-----|------|------|
| new | 新建 | 刚创建，等待联系 |
| working | 跟进中 | 正在积极跟进 |
| qualified | 已验证 | 准备转化 |
| unqualified | 不合格 | 不适合 |

### 4.2 状态流程图

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 线索转化流程

转化界面同时提供三个选项，用户可选择创建或关联：

- **客户**：创建新客户 或 关联现有客户
- **联系人**：创建新联系人（关联到客户）
- **商机**：必须创建商机
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**转化后记录：**
- `converted_customer_id`：关联的客户 ID
- `converted_contact_id`：关联的联系人 ID
- `converted_opportunity_id`：创建的商机 ID

---

## 5. 商机生命周期

商机管理采用可配置的销售管线阶段。商机阶段变更时可自动触发 AI 赢率预测，帮助销售识别风险和机会。

### 5.1 可配置阶段

阶段存储在 `nb_crm_opportunity_stages` 表中，可以自定义：

| 代码 | 名称 | 顺序 | 默认赢率 |
|-----|------|------|---------|
| prospecting | 初步接洽 | 1 | 10% |
| analysis | 需求分析 | 2 | 30% |
| proposal | 方案提报 | 3 | 60% |
| negotiation | 商务谈判 | 4 | 80% |
| won | 成功赢单 | 5 | 100% |
| lost | 丢单 | 6 | 0% |

### 5.2 管线流程
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)


### 5.3 停滞检测

无活动的商机将被标记：

| 无活动天数 | 操作 |
|-----------|------|
| 7 天 | 黄色警告 |
| 14 天 | 橙色提醒给负责人 |
| 30 天 | 红色提醒给经理 |

```sql
-- 计算停滞天数
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 赢/丢单处理

**赢单时：**
1. 更新阶段为 'won'
2. 记录实际成交日期
3. 更新客户状态为 'active'
4. 触发订单创建（如果报价被接受）

**丢单时：**
1. 更新阶段为 'lost'
2. 记录丢单原因
3. 记录竞争对手 ID（如果输给竞争对手）
4. 通知经理

---

## 6. 报价生命周期

### 6.1 状态定义

| 状态 | 名称 | 描述 |
|-----|------|------|
| draft | 草稿 | 准备中 |
| pending_approval | 待审批 | 等待审批 |
| approved | 已批准 | 可以发送 |
| sent | 已发送 | 已发给客户 |
| accepted | 已接受 | 客户已接受 |
| rejected | 已拒绝 | 客户已拒绝 |
| expired | 已过期 | 超过有效期 |

### 6.2 审批规则（待完善）

审批流程基于以下条件触发：

| 条件 | 审批级别 |
|------|---------|
| 折扣 > 10% | 销售经理 |
| 折扣 > 20% | 销售总监 |
| 金额 > $100K | 财务 + 总经理 |


### 6.3 多币种支持

#### 设计理念

使用 **美元作为统一基础货币** 用于所有报表和分析。每条金额记录存储：
- 原始货币和金额（客户看到的）
- 交易时的汇率
- 美元等值金额（用于内部比较）

#### 货币字典表（nb_cbo_currencies）

货币配置采用公共基础数据表，支持动态管理。`current_rate` 字段存储当前汇率，由定时任务从 `nb_crm_exchange_rates` 最近日期的记录同步更新。

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| code | VARCHAR | 货币代码（唯一）：USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | 货币名称 |
| symbol | VARCHAR | 货币符号 |
| decimal_places | INTEGER | 小数位数 |
| current_rate | DECIMAL | 当前对美元汇率（定时从汇率历史表同步） |
| is_active | BOOLEAN | 是否启用 |
| sort_order | INTEGER | 排序 |

#### 汇率历史表（nb_crm_exchange_rates）

记录历史汇率数据，定时任务会将最新汇率同步到 `nb_cbo_currencies.current_rate`。

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| currency_code | VARCHAR | 货币代码（CNY/EUR/GBP/JPY） |
| rate_to_usd | DECIMAL(10,6) | 对美元汇率 |
| effective_date | DATE | 生效日期 |
| source | VARCHAR | 汇率来源：manual/api |
| createdAt | TIMESTAMP | 创建时间 |

> **说明**：报价单通过 `currency_id` 外键关联到 `nb_cbo_currencies` 表，汇率直接从 `current_rate` 字段获取。商机和订单使用 `currency` VARCHAR 字段存储货币代码。

#### 金额字段模式

含金额的表遵循此模式：

| 字段 | 类型 | 描述 |
|-----|------|------|
| currency | VARCHAR | 交易货币 |
| amount | DECIMAL | 原币金额 |
| exchange_rate | DECIMAL | 交易时对美元汇率 |
| amount_usd | DECIMAL | 美元等值（计算） |

**应用于：**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### 工作流集成
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)


**汇率获取逻辑：**
1. 业务操作时直接从 `nb_cbo_currencies.current_rate` 获取汇率
2. 美元交易：汇率 = 1.0，无需查找
3. `current_rate` 由定时任务从 `nb_crm_exchange_rates` 最新记录同步

### 6.4 版本管理

当报价被拒绝或过期时，可以复制为新版本：

```
QT-20260119-001 v1 → 已拒绝
QT-20260119-001 v2 → 已发送
QT-20260119-001 v3 → 已接受
```

---

## 7. 订单生命周期

### 7.1 订单概述

订单在报价被接受时创建，代表已确认的业务承诺。
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)


### 7.2 订单状态定义

| 状态 | 代码 | 描述 | 允许操作 |
|-----|------|------|---------|
| 草稿 | `draft` | 订单已创建，尚未确认 | 编辑、确认、取消 |
| 已确认 | `confirmed` | 订单已确认，等待履行 | 开始履行、取消 |
| 处理中 | `in_progress` | 订单正在处理/生产 | 更新进度、发货、取消（需审批） |
| 已发货 | `shipped` | 产品已发货给客户 | 标记送达 |
| 已送达 | `delivered` | 客户已收货 | 完成订单 |
| 已完成 | `completed` | 订单完全完成 | 无 |
| 已取消 | `cancelled` | 订单已取消 | 无 |

### 7.3 订单数据模型

#### nb_crm_orders

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| order_no | VARCHAR | 订单编号（自动生成，唯一） |
| customer_id | BIGINT | 客户（FK） |
| contact_id | BIGINT | 联系人（FK） |
| opportunity_id | BIGINT | 商机（FK） |
| quotation_id | BIGINT | 报价（FK） |
| owner_id | BIGINT | 负责人（FK → users） |
| status | VARCHAR | 订单状态 |
| payment_status | VARCHAR | 付款状态：unpaid/partial/paid |
| order_date | DATE | 下单日期 |
| delivery_date | DATE | 预计交付日期 |
| actual_delivery_date | DATE | 实际交付日期 |
| currency | VARCHAR | 订单货币 |
| exchange_rate | DECIMAL | 对美元汇率 |
| order_amount | DECIMAL | 订单总额 |
| paid_amount | DECIMAL | 已付金额 |
| unpaid_amount | DECIMAL | 未付金额 |
| shipping_address | TEXT | 送货地址 |
| logistics_company | VARCHAR | 物流公司 |
| tracking_no | VARCHAR | 物流单号 |
| terms_condition | TEXT | 条款条件 |
| description | TEXT | 描述 |

#### nb_crm_order_items

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| order_id | FK | 父订单 |
| product_id | FK | 产品引用 |
| product_name | VARCHAR | 产品名称快照 |
| quantity | INT | 订购数量 |
| unit_price | DECIMAL | 单价 |
| discount_percent | DECIMAL | 折扣百分比 |
| line_total | DECIMAL | 行项目总计 |
| notes | TEXT | 行项目备注 |

### 7.4 收款跟踪

#### nb_crm_payments

| 字段 | 类型 | 描述 |
|-----|------|------|
| id | BIGINT | 主键 |
| order_id | BIGINT | 关联订单（FK，必填） |
| customer_id | BIGINT | 客户（FK） |
| payment_no | VARCHAR | 付款编号（自动生成，唯一） |
| amount | DECIMAL | 付款金额（必填） |
| currency | VARCHAR | 付款货币 |
| payment_method | VARCHAR | 付款方式：transfer/check/cash/credit_card/lc |
| payment_date | DATE | 付款日期 |
| bank_account | VARCHAR | 银行账号 |
| bank_name | VARCHAR | 银行名称 |
| notes | TEXT | 付款备注 |

---

## 8. 客户生命周期

### 8.1 客户概述

客户在线索转化或商机赢单时创建。系统跟踪从获客到拥护者的完整生命周期。
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)


### 8.2 客户状态定义

| 状态 | 代码 | 健康度 | 描述 |
|-----|------|--------|------|
| 潜在 | `prospect` | 无 | 已转化线索，尚无订单 |
| 活跃 | `active` | ≥70 | 付费客户，互动良好 |
| 成长 | `growing` | ≥80 | 有扩展机会的客户 |
| 风险 | `at_risk` | <50 | 显示流失迹象的客户 |
| 流失 | `churned` | 无 | 不再活跃的客户 |
| 挽回 | `win_back` | 无 | 正在重新激活的前客户 |
| 拥护者 | `advocate` | ≥90 | 高满意度，提供转介绍 |

### 8.3 客户健康度评分

基于多个因素计算客户健康度：

| 因素 | 权重 | 衡量指标 |
|-----|------|---------|
| 购买时效性 | 25% | 距上次订单天数 |
| 购买频率 | 20% | 每时段订单数 |
| 货币价值 | 20% | 总订单额和平均订单额 |
| 互动程度 | 15% | 邮件打开率、会议参与 |
| 支持健康 | 10% | 工单量和解决率 |
| 产品使用 | 10% | 活跃使用指标（如适用） |

**健康度阈值：**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 客户分群

#### 自动分群

| 分群 | 条件 | 建议操作 |
|-----|------|---------|
| VIP | 生命周期价值 > $100K | 白手套服务，高管赞助 |
| 企业 | 公司规模 > 500 人 | 专属客户经理 |
| 中型 | 公司规模 50-500 人 | 定期回访，规模化支持 |
| 初创 | 公司规模 < 50 人 | 自助资源，社群 |
| 休眠 | 90+ 天无活动 | 重新激活营销 |

---

## 9. 邮件集成

### 9.1 概述

NocoBase 提供内置邮件集成插件，支持 Gmail 和 Outlook。邮件同步到系统后，可通过工作流自动触发 AI 分析邮件情感和意图，辅助销售快速了解客户态度。

### 9.2 邮件同步

**支持的邮箱：**
- Gmail（通过 OAuth 2.0）
- Outlook/Microsoft 365（通过 OAuth 2.0）

**同步行为：**
- 发送和接收邮件双向同步
- 自动关联邮件到 CRM 记录（线索、联系人、商机）
- 附件存储在 NocoBase 文件系统

### 9.3 邮件-CRM 关联 (待完善)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 邮件模板

销售可以使用预设模板：

| 模板类别 | 示例 |
|---------|------|
| 初次触达 | 冷邮件、热情介绍、活动跟进 |
| 跟进 | 会议跟进、方案跟进、无回复催促 |
| 报价 | 报价已附、报价修订、报价即将过期 |
| 订单 | 订单确认、发货通知、送达确认 |
| 客户成功 | 欢迎、回访、评价请求 |

---

## 10. AI 辅助能力

### 10.1 AI 员工团队

CRM 系统集成 NocoBase AI 插件，复用以下内置 AI 员工，并针对 CRM 场景配置专属任务：

| ID | 名称 | 内置职位 | CRM 扩展能力 |
|----|------|---------|-------------|
| viz | Viz | 数据分析师 | 销售数据分析、管线预测 |
| dara | Dara | 图表专家 | 数据可视化、报表图表开发、仪表盘设计 |
| ellis | Ellis | 编辑 | 邮件回复起草、沟通摘要、商务邮件起草 |
| lexi | Lexi | 翻译 | 多语言客户沟通、内容翻译 |
| orin | Orin | 组织者 | 每日优先级、下一步建议、跟进计划 |

### 10.2 AI 任务列表

AI 能力分为两类，相互独立：

#### 一、AI 员工（前端区块触发）

通过前端 AI 员工区块，用户直接与 AI 对话交互，获取分析与建议。

| 员工 | 任务 | 描述 |
|------|------|------|
| Viz | 销售数据分析 | 分析管线趋势、转化率 |
| Viz | 管线预测 | 基于加权管线预测收入 |
| Dara | 图表生成 | 生成销售报表图表 |
| Dara | 仪表盘设计 | 设计数据仪表盘布局 |
| Ellis | 回复起草 | 生成专业邮件回复 |
| Ellis | 沟通摘要 | 总结邮件线程 |
| Ellis | 商务邮件起草 | 会议邀约、跟进、感谢等邮件 |
| Orin | 每日优先级 | 生成当日优先级任务列表 |
| Orin | 下一步建议 | 为每个商机推荐下一步行动 |
| Lexi | 内容翻译 | 翻译营销材料、方案、邮件 |

#### 二、工作流 LLM 节点（后端自动执行）

嵌套在工作流中的 LLM 节点，通过数据表事件、操作事件、定时任务等方式自动触发，与 AI 员工无关。

| 任务 | 触发方式 | 描述 | 写入字段 |
|------|---------|------|---------|
| 线索评分 | 数据表事件（创建/更新） | 评估线索质量 | ai_score, ai_convert_prob |
| 赢率预测 | 数据表事件（阶段变更） | 预测商机成功可能性 | ai_win_probability, ai_risk_factors |

> **说明**：工作流 LLM 节点使用提示词和 Schema 输出结构化 JSON，解析后写入业务数据字段，无需用户介入。

### 10.3 数据库中的 AI 字段

| 表 | AI 字段 | 描述 |
|----|--------|------|
| nb_crm_leads | ai_score | AI 评分 0-100 |
| | ai_convert_prob | 转化概率 |
| | ai_best_contact_time | 最佳联系时间 |
| | ai_tags | AI 生成的标签 (JSONB) |
| | ai_scored_at | 评分时间 |
| | ai_next_best_action | 下一步最佳行动建议 |
| | ai_nba_generated_at | 建议生成时间 |
| nb_crm_opportunities | ai_win_probability | AI 预测赢率 |
| | ai_analyzed_at | 分析时间 |
| | ai_confidence | 预测置信度 |
| | ai_trend | 趋势：up/stable/down |
| | ai_risk_factors | 风险因素 (JSONB) |
| | ai_recommendations | 建议列表 (JSONB) |
| | ai_predicted_close | 预测成交日期 |
| | ai_next_best_action | 下一步最佳行动建议 |
| | ai_nba_generated_at | 建议生成时间 |
| nb_crm_customers | ai_health_score | 健康度评分 0-100 |
| | ai_health_grade | 健康度等级：A/B/C/D |
| | ai_churn_risk | 流失风险 0-100% |
| | ai_churn_risk_level | 流失风险等级：low/medium/high |
| | ai_health_dimensions | 各维度得分 (JSONB) |
| | ai_recommendations | 建议列表 (JSONB) |
| | ai_health_assessed_at | 健康评估时间 |
| | ai_tags | AI 生成的标签 (JSONB) |
| | ai_best_contact_time | 最佳联系时间 |
| | ai_next_best_action | 下一步最佳行动建议 |
| | ai_nba_generated_at | 建议生成时间 |

---

## 11. 工作流引擎

### 11.1 已实现工作流

| 工作流名称 | 触发类型 | 状态 | 说明 |
|-----------|---------|------|------|
| Leads Created | 数据表事件 | 启用 | 线索创建时触发 |
| CRM Overall Analytics | AI 员工事件 | 启用 | CRM 整体数据分析 |
| Lead Conversion | 操作后事件 | 启用 | 线索转化流程 |
| Lead Assignment | 数据表事件 | 启用 | 线索自动分配 |
| Lead Scoring | 数据表事件 | 禁用 | 线索评分（待完善） |
| Follow-up Reminder | 定时任务 | 禁用 | 跟进提醒（待完善） |

### 11.2 待实现工作流

| 工作流 | 触发类型 | 说明 |
|-------|---------|------|
| 商机阶段推进 | 数据表事件 | 阶段变更时更新赢率、记录时间 |
| 商机停滞检测 | 定时任务 | 检测无活动商机，发送提醒 |
| 报价审批 | 操作后事件 | 多级审批流程 |
| 订单生成 | 操作后事件 | 报价接受后自动生成订单 |

---

## 12. 菜单与界面设计

### 12.1 后台管理结构

| 菜单 | 类型 | 说明 |
|------|------|------|
| **Dashboards** | Group | 仪表盘 |
| - Dashboard | Page | 默认仪表盘 |
| - SalesManager | Page | 销售经理视图 |
| - SalesRep | Page | 销售代表视图 |
| - Executive | Page | 高管视图 |
| **Leads** | Page | 线索管理 |
| **Customers** | Page | 客户管理 |
| **Opportunities** | Page | 商机管理 |
| - Table | Tab | 商机列表 |
| **Products** | Page | 产品管理 |
| - Categories | Tab | 产品分类 |
| **Orders** | Page | 订单管理 |
| **Settings** | Group | 设置 |
| - Stage Settings | Page | 商机阶段配置 |
| - Exchange Rate | Page | 汇率设置 |
| - Activity | Page | 活动记录 |
| - Emails | Page | 邮件管理 |
| - Contacts | Page | 联系人管理 |
| - Data Analysis | Page | 数据分析 |

### 12.2 仪表盘视图

#### 销售经理视图

| 组件 | 类型 | 数据 |
|-----|------|------|
| 管线价值 | KPI 卡片 | 各阶段管线总额 |
| 团队排行榜 | 表格 | 代表业绩排名 |
| 风险预警 | 预警列表 | 高风险商机 |
| 赢率趋势 | 折线图 | 月度赢率 |
| 停滞交易 | 列表 | 需关注的交易 |

#### 销售代表视图

| 组件 | 类型 | 数据 |
|-----|------|------|
| 我的配额进度 | 进度条 | 月度实际 vs 配额 |
| 待处理商机 | KPI 卡片 | 我的待处理商机数 |
| 本周待关闭 | 列表 | 即将关闭的交易 |
| 逾期活动 | 预警 | 过期任务 |
| 快捷操作 | 按钮 | 记录活动、创建商机 |

#### 高管视图

| 组件 | 类型 | 数据 |
|-----|------|------|
| 年度收入 | KPI 卡片 | 年初至今收入 |
| 管线价值 | KPI 卡片 | 管线总额 |
| 赢率 | KPI 卡片 | 整体赢率 |
| 客户健康 | 分布图 | 健康度评分分布 |
| 预测 | 图表 | 月度收入预测 |


---

*文档版本: v2.0 | 更新日期: 2026-02-06*
