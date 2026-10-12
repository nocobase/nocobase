---
title: 'AI Agent 创建应用'
description: '让 AI Agent 创建并启动 NocoBase 3 应用，然后在新会话中继续开发。'
---

# AI Agent 创建应用

让 AI Agent 帮你完成环境检查、项目创建和本地启动。

## 安装创建应用的 Skills

准备 Node.js 24 或更高版本及 pnpm 11，以下命令在 Bash 终端执行，Windows 用户可在 WSL 中操作。在终端安装 NocoBase 3 的全局 Skills：

```bash
npx skills@latest add nocobase/skills-v3 --skill '*' -g
```

按提示选择你使用的 Coding Agent，再开启新的 Agent 会话。Skills 由[轻量分发仓库](https://github.com/nocobase/skills-v3)提供，其中的 `nocobase-create-app` 指导 Agent 检查环境、创建和启动应用。应用生成后，开发工作使用应用目录中的项目 Skills。

## 创建应用

1. **开启 AI Agent 会话**

   以一个用于存放应用的空目录作为工作目录，开启新会话：

   - **CLI**：先创建空目录，在终端进入该目录，再启动 AI Agent，开始新会话
   - **桌面客户端**：先创建空目录，将它添加为项目或工作目录，再在其中新建会话

   :::tip 目录命名要求

   **目录名将作为应用的默认名称**。名称必须以小写英文字母或数字开头，且仅包含小写英文字母、数字、点（`.`）、短横线（`-`）或下划线（`_`），不能包含中文、空格或大写字母。建议使用 `my-app`、`crm-demo` 或 `order-system` 这样的名称。

   :::

2. **创建应用**

   在刚开启的会话中，复制并发送下面这句话：

   ```text
   帮我创建一个 NocoBase 3 应用：https://v3.docs.nocobase.com/cn/get-started/create-app-with-agent.md （请直接访问链接内容）
   ```

   AI Agent 会检查环境，在当前空目录中初始化应用，然后读取项目指引，确认数据库需求并启动服务。

   启动成功后，按 AI Agent 提供的地址打开应用。

   :::warning 注意

   **应用创建并启动后，请重新开启一个会话来继续开发。**

   创建应用时，NocoBase 会把开发用的 Skills 同步到项目目录的 `.agents/skills/`。这些项目指引是在当前会话开始后才生成的，当前会话未必自动加载。请在应用目录重新开启会话，再继续开发。

   :::

## 登录应用

浏览器会进入登录页：

![新应用的登录页面](https://static-docs.nocobase.com/nb3-docs-20260916-login-en.png)

AI Agent 应在启动完成后直接告诉你访问地址和登录方式。使用模板初始管理员时，登录信息如下：

| 项目 | 初始值               |
| ---- | -------------------- |
| 邮箱 | `admin@nocobase.com` |
| 密码 | `admin123`           |

这组账号用于本地首次体验。对外开放应用前，应更改初始密码并配置正式访问方式。如果安装时设置了自己的管理员账号，或连接已有数据库，以实际设置为准。

登录后会看到应用首页。通过右上角账户菜单的「Language / 语言」可切换为中文。

![登录后应用首页，示例已添加订单菜单](https://static-docs.nocobase.com/nb3-docs-20260916-home-cn.png)

图中的「订单管理」是下一页添加的功能，新创建的应用暂时没有这个菜单。

## 停止和再次启动

让 AI Agent 停止当前开发服务。下次在同一个应用目录开启会话，请它启动已有应用即可，无需重新创建项目。如果自己管理服务终端，可以按 `Ctrl+C` 停止，之后在应用目录运行 `pnpm dev` 再次启动。

开发时使用 `pnpm dev`。`pnpm build` 和 `pnpm start` 用于构建后运行，首次跟随文档先保持开发模式。

## 下一步

在应用目录开启新的会话，继续[让 AI Agent 做第一个功能](./first-feature)。AI Agent 本身的安装、账号登录和模型访问需要事先准备好。

接着你就可以让你的 AI Agent 开始开发你的应用了。比如你想做一个 CRM 应用，就可以跟它说：

```text
帮我基于这个 NocoBase 3 项目模板，创建一个 CRM 应用。
```

把业务目标、使用角色和已有的表格、流程说清楚，AI Agent 会把需求落到页面、数据模型和流程里。换成你自己的业务目标也一样。
