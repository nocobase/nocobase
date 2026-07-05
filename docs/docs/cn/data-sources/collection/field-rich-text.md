---
title: "富文本字段"
description: "了解 NocoBase 富文本字段的适用场景，包括 Markdown、Markdown(Vditor)、富文本和 Code。"
keywords: "富文本字段,Markdown,Markdown(Vditor),Code,NocoBase"
---

# 富文本字段

## 适用场景

富文本字段适合保存正文、说明文档、处理方案、代码片段等较复杂内容。

| 你要保存 | 建议字段 | 适合场景 |
| --- | --- | --- |
| Markdown 内容 | Markdown | 知识库正文、需求说明、技术文档、处理方案。 |
| 所见即所得 Markdown | Markdown(Vditor) | 需要实时预览、所见即所得编辑、上传图片或附件到对象存储的说明文档、文章正文。 |
| 带格式的正文 | 富文本 | 公告、产品说明、处理记录、邮件模板。 |
| 代码片段 | Code | 脚本、SQL 片段、配置片段、技术备注。 |

## 字段来源

参考下面的来源路径，了解字段在 NocoBase 中的创建和管理方式：

- **[主数据库配置字段](../main/database.md#配置字段)**
- **[主数据库同步字段](../main/database.md#从数据库同步)**
- **[主数据库创建 SQL 数据表映射字段](../main/collection-sql.md)**
- **[主数据库连接数据库视图映射字段](../main/collection-view.md)**
- **[外部数据库同步字段](../external/database.md#从数据库同步)**
- **[REST API 数据源映射字段](../external/rest-api.md#字段映射)**

## 从 NocoBase 创建

通过**[主数据库配置字段](../main/database.md#新增字段)**在页面新增富文本字段。创建时重点确认 Field interface、Field type、是否必填、默认值和字段说明。

![add_field](https://static-docs.nocobase.com/add_field.png)
![add_field_configure](https://static-docs.nocobase.com/add_field_configure.png)

### 字段配置

| 配置 | 说明 |
| --- | --- |
| Field interface | 富文本字段的界面类型。可以选择「Markdown」「Markdown(Vditor)」「富文本」「Code」等。它决定页面中使用普通 Markdown 编辑器、Vditor 编辑器、富文本编辑器还是代码编辑器。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能直接理解的名称，比如「处理方案」「公告正文」「脚本内容」。 |
| Field name | 字段标识名称，用于 API、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在 NocoBase 数据层的类型。富文本字段通常使用 `text` 保存较长内容。 |
| Default value | 默认值。适合放入说明模板、处理意见模板、固定代码片段等内容。 |
| Required | 必填。适合公告正文、知识库正文、处理结论等创建记录时必须填写的字段。 |
| Description | 字段说明。适合写清楚内容格式、维护要求、是否支持 Markdown 或代码片段。 |

### 字段类型映射

| Field interface | 默认 Field type | 默认数据库字段类型 | 默认长度 |
| --- | --- | --- | --- |
| Markdown | `text` | `text` |  |
| Markdown(Vditor) | `text` | `text` |  |
| 富文本 | `text` | `text` |  |
| Code | `text` | `text` |  |

这里的默认数据库字段类型以 PostgreSQL 为例。不同数据库最终生成的字段类型显示可能略有差异。

### 校验规则

富文本字段常用校验规则比文本字段少，通常只关注是否必填和内容长度。内容越长，越要关注页面加载、列表展示和第三方同步的性能。

| 校验规则 | 适合字段 | 说明 | 页面反馈 |
| --- | --- | --- | --- |
| Required | Markdown、Markdown(Vditor)、富文本、Code。 | 提交记录时必须填写。适合正文、处理结论、脚本内容等核心字段。 | 字段为空时，提交表单会提示必填错误。 |
| Max length | Markdown、富文本、Code。 | 限制最多字符数。适合对外同步、审批意见、公告正文等需要控制长度的内容。 | 输入字符数过多时，会提示最大长度要求。 |

### 页面使用效果

待截图

## 从数据源映射

外部数据库中的富文本内容通常已经保存为文本字段。NocoBase 同步字段后，需要把数据库字段类型映射为 NocoBase 的 Field type，再根据内容格式选择 Field interface。

同步后，需要进入数据表的「Configure fields」检查字段是否识别正确。重点确认 Field interface、字段标题、描述，以及是否需要在页面中隐藏原始技术字段。

编辑字段配置不会修改外部数据库里的真实字段名、字段类型、长度、默认值或索引。如果需要调整这些结构，请先在数据库侧修改，再重新同步到 NocoBase。

### 字段配置

参考上文的「从 NocoBase 创建」章节，了解字段配置的各项参数。

### 字段类型映射

从数据源同步字段时，映射顺序通常是先读取数据库字段类型，再映射为 NocoBase 的 Field type，最后根据字段内容选择 Field interface。数据库只能告诉 NocoBase 这是长文本，不能判断里面是 Markdown、HTML 还是代码。

| 数据库字段类型 | 映射后的 Field type | 常用 Field interface | 说明 |
| --- | --- | --- | --- |
| `text` / `mediumtext` / `longtext` / `clob` | `text` | Markdown、Markdown(Vditor)、富文本、Code。 | 适合保存正文、说明、HTML、Markdown、代码片段等长文本内容。 |
| `varchar` / `char` / `nvarchar` / `nchar` | `string` 或 `text` | Markdown、富文本、Code。 | 如果实际保存的是较短模板、短代码片段或小段富文本，可以按业务含义调整界面类型。 |
| HTML 字符串 | `text` | 富文本。 | 适合已有系统保存的 HTML 正文。需要确认前端展示时是否符合安全策略。 |
| Markdown 字符串 | `text` | Markdown、Markdown(Vditor)。 | 适合已有系统保存的 Markdown 正文。 |
| 代码字符串 | `text` | Code。 | 适合 SQL、脚本、JSON 片段等需要代码编辑器展示的内容。 |

:::warning 注意

字段映射只改变 NocoBase 如何理解和展示字段，不会改变外部数据库中的真实字段结构。如果外部字段长度不足，页面中即使能输入更长内容，保存时也可能被数据库拒绝。

:::

### 页面使用效果

待截图
