---
title: '使用 AI 组件'
description: '使用 NocoBase AI Employee Registry 中的聊天、任务、页面上下文和 Tool 渲染组件。'
keywords: 'AIChatProvider,AIChatWindow,ChatSurface,AIEmployeeShortcut,AIPageContextScope,AIToolRendererProvider'
---

# 使用 AI 组件

AI 员工插件提供名为 `nocobase-ai` 的 Registry 源码项。把它安装到应用的 `client/extensions/nocobase-ai/` 后，这些文件归应用所有，可以直接修改和组合。Registry 不会随插件启用自动复制；目录不存在时，让编码 Agent 从当前 AI Employee 插件安装这个 Registry 项。应用页面应从安装后的公开目录导入，不要从插件包的 `client/registry` 私有源码路径导入。

## 先装好运行时

`@nocobase/app-plugin-ai-employee` is deprecated, and current Default and Examples templates no longer install or register it. This guide applies to existing applications that retain the plugin and its configuration. Verify its registrations in `client/plugins.ts`, `server/plugins.ts`, and `cli/plugins.ts` before using the components. The Registry item does not include an automatically discovered `extension.ts` or mount React Providers; after installing it, create an application-owned wrapper in that directory:

```tsx
import type { PropsWithChildren } from 'react';
import { NocoBaseAIRootProvider } from './components';

export function AppAIProvider({ children }: PropsWithChildren) {
  return <NocoBaseAIRootProvider>{children}</NocoBaseAIRootProvider>;
}
```

然后在 `client/react-providers.ts` 的现有 `defineClientReactProviders()` 列表中加入应用级 Provider：

```ts
{
  component: AppAIProvider,
  layer: 'application',
  name: 'ai',
}
```

`NocoBaseAIRootProvider` 组合 AI 数据、Tool 渲染和页面上下文所需的 Provider，并默认使用插件现有的 `nocobaseAIService`。它在应用级只挂载一次；具体页面只需要为每个独立对话场景创建 `AIChatProvider`。

`NocoBaseAIRootProvider` 会异步加载员工和模型，但不会等加载完成才渲染子组件。所以页面里的 `AIChatProvider` 要放在一个就绪检查之后，等员工和模型都加载好再挂载，否则第一次发送会失败。写法见 [聊天框 · 等配置就绪再挂载](./chat.md#等配置就绪再挂载)。

## 五种组件场景

| Dev Route                     | 适合解决的问题                           | 核心 API                                                      |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `/dev/ai-components/chat`     | 完整聊天窗口、容器切换和输入区扩展       | `AIChatProvider`、`AIChatWindow`、`ChatInline`、`ChatSurface` |
| `/dev/ai-components/floating` | 全局悬浮按钮、右侧面板和对话框           | `AIChatFloatingTrigger`、`ChatSurfaceActions`                 |
| `/dev/ai-components/tasks`    | 把固定业务任务交给指定员工               | `AIEmployeeShortcut`、`employeeTasks`                         |
| `/dev/ai-components/context`  | 把记录、表单和页面 Tool 交给对话         | `useAIPageElement`、`useAIForm`、`AIPageContextScope`         |
| `/dev/ai-components/tools`    | 为 Tool 调用提供审批、进度和业务结果界面 | `NocoBaseAIRootProvider.toolRenderers`、`AIToolRendererProps` |

![AI Chat Window 组件示例](https://static-docs.nocobase.com/20260914111142-ai-components-chat.png)

Dev Route 只在开发构建中存在，它们是可交互的实现样例，不是生产权限边界。编写页面时可以让编码 Agent 先访问对应 Route，再阅读 `client/dev/demo` 和 `client/extensions/nocobase-ai` 中的当前源码。

## 共同规则

1. 每个对话场景使用稳定且唯一的 `AIChatProvider.id`。不要用随机值或每次渲染都变化的值。
2. 员工和模型加载完成之前不要挂载 `AIChatProvider`，并用 `defaultEmployee` 明确指定员工的 `username`。不指定时聊天会打开 `sort` 最小的员工，通常是内置的 `atlas`。
3. 同一个会话在嵌入、侧栏和 Dialog 之间切换时，复用同一个 `AIChatWindow` 和 Controller，不要通过条件分支反复卸载。
4. 工作上下文必须可序列化；不要传 DOM、函数、React 节点、数据库连接或带循环引用的对象。
5. 页面组件只声明交互和上下文，网络、SSE、会话持久化、Tool 审批和恢复交给现有 AI Service。
6. 前端 Tool 仍要按最小权限设计。页面隐藏按钮不能替代服务端授权。

## 相关链接

- [聊天框](./chat.md) — 创建独立对话场景
- [全局对话入口](./floating.md) — 在应用布局中挂载悬浮入口
- [员工任务](./tasks.md) — 绑定可复用任务
- [页面上下文](./context.md) — 注册业务页面信息
- [Tool 卡片](./tool-cards.md) — 渲染 Tool 过程和结果
