---
pkg: '@nocobase/plugin-ai'
title: 'AI Chat box 区块'
description: '面向 NocoBase 管理员和页面搭建者的 AI Chat box 区块操作手册，介绍添加区块、设置对话能力、配置 Work context、管理会话和添加 Actions。'
keywords: 'AI Chat box,AI 员工,页面区块,Work context,Scope,Actions,NocoBase'
---

# AI Chat box 区块

在 NocoBase 中，**AI Chat box** 是可以直接添加到页面中的 AI 对话区块。你可以把它放在业务页面中，为当前页面提供固定入口的 AI 助手。

每个 AI Chat box 区块都有独立的当前会话和输入状态。页面搭建者还可以限制可选的 AI 员工、模型、文件上传、联网搜索和工作上下文，让区块更贴合当前业务场景。

:::tip 使用前准备

请先完成 [LLM 服务配置](../features/llm-service.md) 并[启用至少一个 AI 员工](../features/enable-ai-employee.md)。

:::

## 添加 AI Chat box 区块

1. 打开需要配置的页面。
2. 点击右上角的「UI Editor」，进入页面编辑模式。
3. 点击「Add block」。
4. 在「Other blocks」中选择「AI chat box」。

![在 Add block 菜单中选择 AI chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## 认识区块结构

![AI Chat box 区块主体](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

AI Chat box 从上到下分为三个区域：

- **顶部操作区**——会话列表入口、Actions、自定义动作、新会话按钮；隐藏消息区后还会显示消息按钮
- **消息区**——显示当前草稿或会话中的消息
- **发送区**——输入框、上下文选择、文件上传、联网搜索、AI 员工选择、模型选择、发送按钮和免责声明

### 在区块 body 中添加展示内容

进入页面编辑模式后，点击 AI Chat box 内部的「Add block」，可以在聊天区域上方添加这些区块：

- JS block
- Iframe
- Markdown

这些区块适合展示说明、外部页面或辅助信息。AI Chat box 的内部添加菜单只开放以上三类区块，不能继续嵌套 AI Chat box。

## 配置 AI Chat box

将鼠标移到区块上方，打开区块设置菜单。点击「Edit chat box」，可以设置会话范围、默认消息、Work context、AI 员工和模型。

![Edit chat box 设置弹窗](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Edit chat box 设置

| 设置项 | 作用 |
| --- | --- |
| 「Scope」 | 控制哪些 AI Chat box 共享会话列表。新建区块默认使用自己的区块 UID，用于隔离会话。 |
| 「Background」 | 附加到 AI 员工定义后的系统提示词，用于补充当前页面的角色、目标或回答要求。 |
| 「Default user message」 | 新会话开始时预填到发送框中的默认用户消息。 |
| 「Work context」 | 选择默认放入新草稿的页面区块。 |
| 「AI employees」 | 限制可在该区块中选择的业务类 AI 员工。留空时允许全部可用的业务类 AI 员工。 |
| 「Models」 | 限制可在该区块中选择的模型。留空时允许全部可用模型。 |

### 其他区块设置

| 设置项 | 作用 |
| --- | --- |
| 「Show messages」 | 控制消息区是否直接显示在区块中。关闭后通过顶部的消息按钮打开右侧面板。 |
| 「Sender placeholder」 | 修改发送框的占位提示。 |
| 「Enable add context」 | 显示或隐藏发送框中的上下文选择入口。 |
| 「Enable upload files」 | 显示或隐藏文件上传入口。关闭后，粘贴文件也不会触发上传。 |
| 「Enable web search」 | 显示或隐藏联网搜索开关。关闭后，当前草稿中的联网搜索状态也会关闭。 |
| 「Enable employee select」 | 显示或隐藏 AI 员工选择器。 |
| 「Enable model select」 | 显示或隐藏模型选择器。 |
| 「Show disclaimer」 | 显示或隐藏发送框下方的 AI 免责声明。 |

## 配置 Work context

在「Edit chat box」的「Work context」中点击添加上下文按钮，选择「Pick block」，再点击需要提供给 AI 的页面区块。保存后，选中的区块会作为新会话的默认工作上下文；发送前也可以在发送区中移除。

## 隐藏消息区并使用右侧面板

关闭「Show messages」后，区块主体只保留发送区。顶部会出现消息按钮，点击后从右侧打开消息面板。

![隐藏消息区后的右侧消息面板](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

面板打开时，区块其余区域会显示遮罩；点击遮罩或再次点击消息按钮即可关闭面板。

这种布局适合把 AI Chat box 作为页面中的轻量输入入口——平时只显示发送框，需要回看消息时再打开面板。

## 管理历史会话

点击区块左上角的会话列表按钮，可以查看当前 Scope 下的历史会话。

需要注意这些规则：

- 使用相同 Scope 的多个 AI Chat box 可以看到相同的会话列表
- 每个区块仍有独立的当前会话、发送框草稿、AI 员工、模型、附件和上下文状态
- 全局浮动 chatbox 不按区块 Scope 过滤，因此不会隐藏带 Scope 的区块会话
- 清空 Scope 后，区块会话列表不再按 Scope 过滤，会显示未设置 Scope 和设置了其他 Scope 的会话

通常来说，保留新建区块自动生成的 Scope 就可以让每个页面助手的历史会话彼此隔离。只有当你需要多个区块共享同一批历史会话时，才需要给它们配置相同的 Scope。

## 添加 Actions

在页面编辑模式下，点击区块顶部的「Actions」，可以添加这些操作：

- JS Action
- AI employee

添加 AI employee 后，可以继续为员工配置快捷任务。

快捷任务中的「Chat box uid」可以指定任务要在哪个 AI Chat box 中运行。在 AI Chat box 内直接添加的 AI employee，任务会默认指向当前区块的 UID。

如果任务指定的 AI Chat box 当前没有挂载，NocoBase 会提示找不到目标区块，不会回退到全局浮动 chatbox。详细配置见 [AI 员工快捷任务](../features/task.md)。

## 一个页面专用助手的配置流程

下面的配置可以做出一个页面专用的轻量 AI 助手：

1. 添加 AI Chat box 区块，并调整到合适的页面位置。
2. 在「Edit chat box」中填写页面专用的 Background。
3. 选择一个或多个 Work context。
4. 在「AI employees」和「Models」中限制可用员工与模型。
5. 退出编辑模式，输入问题并发送。

## 注意事项

- AI Chat box 区块和右下角的全局浮动 chatbox 是两个独立入口，当前会话和输入状态不会自动同步
- 在 AI Chat box 内部的「Add block」中，只能添加 JS block、Iframe 和 Markdown
- 修改 Scope 会影响会话列表的查询范围，不会把另一个区块当前打开的会话和草稿状态复制过来
