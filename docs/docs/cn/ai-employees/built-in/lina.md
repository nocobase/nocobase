---
title: 'Lina：本地化工程师'
description: 'Lina 是本地化插件内置的 AI 员工，用于翻译 NocoBase 系统本地化词条和插件界面文案。'
keywords: 'Lina,本地化工程师,AI 翻译,本地化管理,AI 员工,NocoBase'
---

# Lina：本地化工程师

## 角色定位

Lina 是本地化插件注册的内置 AI 员工，专门用于系统本地化翻译。她会将本地化词条翻译为目标语言，并尽量保留变量、占位符、标签、格式和界面文案的简洁性。

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=提示}
Lina 是本地化场景的专用 AI 员工，不支持使用通用的 Skills 和 Tools.
:::

## 适用场景

- 批量翻译系统和插件词条。
- 翻译数据表、字段、菜单等本地化内容。
- 为新增语言快速生成初始译文。
- 对已同步的词条进行增量补译。
- 只翻译用户在表格中勾选的指定词条。

## 前置条件

使用 Lina 前，需要先完成以下配置：

- 启用 **本地化管理** 插件。
- 配置可用的大语言模型服务，并为 Lina 配置默认模型。参考 [配置 AI 员工模型](/ai-employees/features/model-settings) 和 [模型选择建议](#模型选择建议)。
- 在系统设置中启用目标语言。
- 在本地化管理页面同步需要翻译的词条。

:::info{title=提示}
Lina 会根据当前语言环境创建翻译任务。例如当前界面语言为泰语时，任务会为泰语生成译文。
:::

## 提示词配置

可以在 `系统设置 -> AI 员工 -> AI employees` 中打开 Lina 的编辑弹窗，并在 `Role setting` 中调整提示词。提示词通常用于定义业务领域信息、术语规则和输出约束，不宜过长，否则可能不适合专项翻译模型。

![](https://static-docs.nocobase.com/202605191351816.png)

默认提示词示例：

```text
# Role
You are Lina, a professional localization translator for NocoBase.

# Task
Translate NocoBase localization text into the requested target language.

# Translation requirements
1. Keep the translation faithful, concise, and natural for product UI.
2. Use consistent NocoBase and software terminology.
3. Preserve placeholders, variables, HTML tags, ICU syntax, line breaks, and code-like tokens.
4. Return only the translated text. Do not explain, quote, or use Markdown.
5. If the text should not be translated, return it unchanged.
```

参考翻译和待翻译文本不需要写入 Lina 的提示词。创建任务时，系统会根据词条内容、目标语言和确认弹窗中的参考语言配置自动拼接。

## 使用方式

在本地化管理页面中，点击 Lina 的头像按钮后，可以选择不同范围的 AI 翻译任务：

### 增量翻译

仅翻译当前语言中尚未有译文的词条。适用于日常维护场景，例如新增插件、新增字段或新增菜单后，只希望补齐缺失译文。

对于内置词条，如果目标语言的系统或插件语言包中已经存在译文，即使本地化翻译表中还没有写入对应记录，也会被视为已有译文，不会计入增量翻译。

### 翻译所选项

先在词条表格中勾选需要处理的记录，再选择“翻译所选项”。适用于只想重译少量词条，或人工检查后发现部分译文需要重新生成的场景。

如果未选择任何词条，系统会提示先选择记录。

### 全量翻译

翻译当前语言中符合条件的全部词条。适用于新增语言时生成第一版译文。

:::warning{title=注意}
全量翻译可能覆盖已有译文。执行前请确认目标语言、词条数量和模型服务是否正确。
:::

## 任务确认

创建任务前，系统会弹出确认框，显示本次即将翻译的内容：

- 任务说明。
- 即将翻译的词条数量。
- 使用的服务商。
- 使用的模型。
- 参考翻译语言配置。

全量翻译和增量翻译还可以在确认框中选择翻译范围：

- **全部**：处理当前任务条件下的所有词条。
- **内置词条**：系统和插件词条。
- **自建词条**：路由名称、数据表和字段名称以及 UI 上的内容。

翻译所选项只处理表格中已经勾选的记录，因此不再显示翻译范围。它也只显示一组通用的参考翻译语言配置，不再区分内置词条和自建词条。

如果即将翻译的词条数量为 0，系统会提示用户，不会创建后台任务。确认后，系统会创建后台任务。任务执行过程中可以在异步任务中查看进度，任务完成后译文会写入对应语言的翻译内容中。

![](https://static-docs.nocobase.com/202605191341968.png)

## 参考翻译

有些词条本身较短，例如字段名、按钮名、状态名，单独翻译时缺少上下文。Lina 会尽量使用已有参考译文提升一致性。

- 内置词条默认使用中文译文作为参考，日文作为备选参考。
- 自建词条默认使用系统默认语言作为参考，中文作为备选参考。
- 用户可以在创建任务的确认弹窗中调整默认语言和备选语言。
- 系统会优先使用默认语言中的参考译文；如果不存在，再尝试使用备选语言。

例如已有参考翻译时，Lina 会以类似以下语义提示模型：

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## 模型选择建议

由于本地化翻译通常会一次处理大量词条，如果有条件，建议优先选择本地部署的翻译专用小模型，因为在线模型通常会有 API 调用频率、并发数或每分钟 token 数限制。翻译任务词条较多时，限流会导致任务执行时间变长，甚至出现部分请求等待或失败。

如果无法部署本地模型，也建议选择翻译专项模型，而不是普通聊天模型。翻译专项模型通常更适合短词条、界面文案和批量翻译场景。Lina 会将员工提示词、参考翻译和待翻译文本组织为提示词发送给模型，用户可以通过调整 Lina 的提示词来控制翻译风格和规则。

可以根据模型能力灵活调整请求并发数，更容易控制任务吞吐、响应时间和成本。

如需参考本地部署翻译专用小模型的完整实践，可查看 [使用 Lina 和本地 HY-MT1.5-1.8B 翻译本地化词条](/ai-employees/scenarios/localization-hy-mt)。

:::info{title=提示}
本地化翻译任务的并发数可通过环境变量 `AI_LOCALIZATION_CONCURRENCY` 控制，默认值为 `10`，允许范围为 `1` 到 `20`。超出范围时会使用默认值。
:::

## 进度和失败处理

Lina 的翻译任务以后台异步任务执行。任务会按词条逐条写入翻译结果，并更新任务进度。

![](https://static-docs.nocobase.com/202605121235761.png)

如果某条词条翻译失败，任务会记录失败信息并停止，避免在模型调用异常、模型返回异常内容或配置错误时继续写入不可控的结果。常见原因包括：

- AI 插件或异步任务管理插件未启用。
- Lina 未配置可用模型。
- 模型服务不可用或超时。
- 模型服务不支持当前请求格式。
- 模型返回空内容。

遇到失败时，可以先检查异步任务详情和服务端日志，确认服务商、模型、目标语言、失败词条 ID 和模型调用耗时。

## 发布前检查

AI 翻译完成后，建议在发布前进行人工复核：

- 检查菜单、按钮、字段名等短词条是否符合产品语境。
- 检查变量、占位符和 HTML 标签是否完整保留。
- 检查业务术语是否统一。
- 检查重要页面和面向最终用户的文案是否自然。
- 如果内置词条译文被覆盖，可以回到本地化管理页面，在同步时勾选 `重置系统内置词条翻译内容` 恢复默认译文。贡献系统和官方插件默认译文时，可参考 [翻译贡献](/get-started/translations)。
- 确认无误后，在本地化管理页面发布翻译。
