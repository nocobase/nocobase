---
pkg: "@nocobase/plugin-ai"
title: "AI 员工接入 MCP"
description: "为 AI 员工接入 MCP 服务，测试 MCP 服务可用性，并管理 MCP 工具调用权限。"
keywords: "AI 员工技能,MCP,Model Context Protocol,tools"
---

# MCP 接入

AI 员工可以接入遵循 Model Context Protocol (MCP) 协议的 MCP 服务，接入 MCP 服务后 AI 员工就可以使用 MCP 服务提供的工具完成任务。


## MCP 配置

进入 MCP 配置模块，在这里可以添加新的 MCP 服务，维护已接入的 MCP 服务。

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## 添加 MCP 服务

点击 MCP 服务列表右上角`添加`按钮，在弹窗中输入 MCP 服务接入信息完成 MCP 服务添加。

支持 Stdio 和 HTTP（Streamable / SSE）这两种 MCP 服务传输协议。

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

添加 MCP 服务时，需要输入`名字`，`标题`，`描述`。`名字`是 MCP 服务的唯一标识；`标题`是 MCP 服务在系统里展示用的名字；`描述`是可选的，用于简单描述 MCP 服务提供的功能。

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio 

添加支持 stdio 传输协议的 MCP 服务时，需要输入运行 MCP 服务的`命令`和`命令参数`，根据需要可以添加运行 MCP 服务命令需要的`环境变量`。

:::warning
运行 MCP 服务的命令如 node，npx，uvx，go 等需要部署 Nocobase 的服务器环境支持才能使用。

Nocobase 的 Docker 镜像只支持 node，npx 等 Nodejs 环境命令。
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

添加支持 http 传输协议的 MCP 服务时，需要输入 MCP 服务 `URL` 地址, 根据需要可以添加`请求头`。

http 传输协议支持 Streamable 和 SSE 两种传输方式，Streamable 是 MCP 标准新增加的传输方式，SSE 传输方式即将废弃，请根据所使用的 MCP 服务文档说明选择具体传输方式。

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### 可用性测试

添加和编辑 MCP 服务时，输入完 MCP 配置信息后可以对 MCP 服务发起可用测试，MCP 配置信息完整无误且 MCP 服务可用时，会返回 MCP 服务可用性测试成功的信息。

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## 查看 MCP 服务

点击 MCP 服务列表上的`查看`按钮可以查看 MCP 服务提供的工具列表。

在 MCP 服务的工具列表里还可以设置 AI 员工使用该工具的权限配置，工具权限设置为 `Ask` 时，调用前会询问是否允许调用；设置为 `Allow` 时，在需要时会直接调用工具。

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## 使用 MCP 服务

在 MCP 配置模块中启用需要使用的 MCP 服务后，和 AI 员工对话时，AI 员工会自动使用 MCP 服务提供的工具完成任务。

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)
