---
title: "AI 员工插件开发常见问题"
description: "排查 NocoBase AI 员工 Tool、Skill、内置员工和前端 Tool 卡片没有注册或没有执行的问题。"
keywords: "NocoBase,AI 员工常见问题,Tool 未注册,Skill 未加载,前端卡片"
---

# AI 员工插件开发常见问题

## Tool 没有被注册

按下面的顺序检查：

- 文件是否位于插件构建范围内的 `src/ai/**/tools/`
- 是否使用 `.ts` 或 `.js` 文件
- 是否 `export default defineTools(...)`
- Tool 文件是否被错误命名为 `.d.ts`
- 是否出现同名 Tool，导致后注册项被忽略
- 插件是否已经重新构建并加载

## Skill 没有出现

优先检查文件名。当前必须是：

```text
SKILLS.md
```

另外确认 frontmatter 中包含稳定的 `name` 和 `description`，并且文件位于 `src/ai/**/skills/<skill-name>/SKILLS.md`。

## Skill 能加载，但不能调用 Tool

检查下面几项：

- Skill 的 `tools` 列表是否包含 Tool 名称
- Tool 是否放在当前 Skill 的 `tools/` 目录
- Tool 文件名、`definition.name` 和 Skill 引用是否一致
- `scope` 是否适合当前绑定方式
- Tool 是否因重复名称而没有注册

绑定 Tool 只代表模型可以使用它。如果 Tool 已经出现在 Skill 中，但模型仍然没有调用，需要在 `SKILLS.md` 的工作流里明确写出调用时机、参数要求和等待结果的步骤。

## 前端卡片没有显示

前端注册名称需要和服务端最终 Tool 名称完全一致：

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

另外检查：

- 自定义插件是否使用 `src/client-v2/` 运行时
- 卡片是否注册在客户端插件的 `load()` 中
- ToolCall 是否进入了卡片支持的状态
- 卡片是否因为 `invokeStatus` 判断而被禁用
- 客户端插件是否已经重新构建并加载

## 点击卡片后 Tool 没有继续执行

确认调用了 `approve()`、`edit()` 或 `reject()` 之一。需要把用户选择写回参数时，使用：

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

同时确认服务端 schema 允许这个字段，并且 `invoke()` 会读取它。

## 修改 `definition.name` 后没有生效

自动加载的 Tool 名称由文件名或目录名决定。比如：

```text
src/ai/tools/developerChoice.ts
```

最终名称就是 `developerChoice`。如果希望改名，需要同步重命名文件、Skill 引用、AI 员工配置和前端注册名称。

## 相关链接

- [AI 员工插件开发](./index.md) — 返回开发指南概述
- [定义服务端 Tool](./define-tool.md) — 检查 Tool 命名和注册方式
- [定义 Skill](./define-skill.md) — 检查 Skill 和 Tool 绑定
- [为 Tool 添加前端交互](./frontend-tool-ui.md) — 检查 ToolCall 和前端注册
