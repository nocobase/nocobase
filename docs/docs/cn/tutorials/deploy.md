---
title: '6. 上线'
description: '构建生产产物，准备环境配置，并在目标环境重新验证订单流程。'
---

# 6. 上线

开发环境跑通后，构建生产产物，再用生产入口检查。不要把 `pnpm dev` 作为线上服务。

## 本章目标与起点

先完成订单创建、权限、审批和通知的检查。本章把开发项目变成可运行的生产产物，并梳理目标环境必须准备的配置。你需要在目标机器上管理文件、配置服务和查看日志的权限。

## 分清代码、配置和业务数据

| 内容     | 包含什么                             | 更新应用时怎样处理   |
| -------- | ------------------------------------ | -------------------- |
| 构建产物 | 编译后的页面、服务端与工作流代码     | 随应用发布更新       |
| 环境配置 | 数据库位置、访问地址、密钥和通知渠道 | 按目标环境单独维护   |
| 业务数据 | 客户、订单、账号、通知及上传文件     | 持久保存，发布前备份 |

本地页面能运行，只说明当前环境下能使用。部署时还要核对数据库路径、外部访问地址和工作流启用状态，避免新进程连到空数据库或通知链接指向错误位置。

## 构建前检查

在应用根目录执行：

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

如果集成测试依赖运行中的应用，先按测试文件要求设置目标地址，并确认测试没有全部跳过。构建通过不能替代前面章节的权限、审批和通知验证。

## 在本机运行生产版本

先在 `config.yml` 中为 SQLite 明确指定持久文件的绝对路径。默认路径随运行根目录变化：开发时是 `storage/database.sqlite`，编译产物运行时可能是 `dist/storage/database.sqlite`。没有固定 `filename` 就可能进入一份新数据库，看不到之前的订单。`database` 字段不能代替 SQLite 的 `filename`。

```yaml
database:
  connections:
    main:
      dialect: sqlite
      filename: /absolute/path/to/persistent/database.sqlite
```

确认路径指向你要验证的数据，停止开发服务，避免两个进程同时处理同一份练习数据库，再执行：

```bash
pnpm start
```

使用终端打印的地址登录，重新检查订单详情和“我的通知”。生产构建中不会有开发专用页面，所以通知入口必须使用上一章的正式应用路由。

接下来准备目标服务器、域名和环境配置。

## 准备部署包

默认构建面向当前机器。在 Node.js 24、Linux x64、glibc 目标上部署时，可以生成对应包：

```bash
pnpm build --target linux-x64 --tar
```

产物为 `storage/exports/dist.tar.gz`，包含 `dist/` 和 `config.example.yml`，其中 `dist/` 已带有生产依赖。ARM 或 musl 环境需要匹配自己的目标；原生数据库依赖也必须与目标平台和 Node.js 版本一致。

不要把本地数据库、测试账号密码或真实 `config.yml` 打入公共仓库。把构建包上传到目标机器的新发布目录并解压：

```bash
mkdir -p order-app
cd order-app
tar -xzf /path/to/dist.tar.gz
cp config.example.yml config.yml
```

编辑 `config.yml`，配置目标数据库、认证和会话密钥、站内信渠道。SQLite 数据文件和上传文件应保存在持久目录，后续替换发布目录不能覆盖它们。生产环境使用独立配置和业务账号，不带入演示数据。

## 配置地址并启动

`APP_PUBLIC_ORIGIN` 是外部访问的 origin，不包含挂载路径；`APP_BASE_PATH` 是挂载路径。下面的域名和端口是配置示例，替换成你的目标环境：

```bash
export APP_PUBLIC_ORIGIN=https://orders.example.com
export APP_BASE_PATH=/main
export APP_SERVER_HOST=127.0.0.1
export APP_SERVER_PORT=13000
export NODE_ENV=production
node ./dist/server/standalone.js
```

部署包只包含构建产物，解压后直接用 `node` 运行编译产物入口 `dist/server/standalone.js`；源码目录中则使用 `pnpm start`。应用的命令（如 `db apply`）用 `node dist/cli/index.js db apply` 运行。

把域名的 HTTPS 流量通过反向代理转发到应用，保留 API、静态资源和 WebSocket 路径；使用服务管理器管理进程、重启和日志。正式迁移前备份已有数据库，并按照目标配置决定启动时迁移还是发布时单独迁移。

## 在目标环境验收

| 检查               | 预期结果                                                         |
| ------------------ | ---------------------------------------------------------------- |
| 登录、刷新详情     | 会话和页面正常，无资源路径错误                                   |
| 业务员甲与乙的数据 | 彼此隔离，直接访问对方详情也不能读取                             |
| 提交与主管审批     | 状态按规则变化，重复审批被拒绝                                   |
| 管理接口权限       | 普通账号不能读取他人的执行记录或执行管理操作，服务端独立检查权限 |
| 工作流版本         | 目标环境的正确版本已启用                                         |
| 我的通知           | 申请人收到通知，链接指向对应订单                                 |
| 重启服务           | 订单和通知仍存在                                                 |

工作流产物随构建部署，但数据库中的启用状态仍要在目标环境核对。失败时先分清配置、迁移、原生依赖和业务执行错误，避免通过清空数据库“修复上线”。

## 通过 Hub 部署

团队已有 Hub（需要专业版授权）时，可以将上面构建的部署包发布到 Hub，由 Hub 负责解压和进程管理。操作步骤见[手动部署：Hub](/deployment/hub)；由 AI Agent 执行时，提示词见[用 AI Agent 部署](/deployment/with-agent)。
