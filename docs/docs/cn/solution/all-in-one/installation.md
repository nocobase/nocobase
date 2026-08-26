---
title: "一体化业务管理系统 - 如何安装"
description: "一体化业务管理系统安装部署:通过备份管理器一键还原 nbdata 备份文件,需 NocoBase v2.1.0-alpha.40 及以上、PostgreSQL 16,DB_UNDERSCORED 不能为 true。"
keywords: "一体化业务管理系统 安装,All-in-One,备份还原,备份管理器,nbdata,PostgreSQL,NocoBase"
---

# 如何安装

一体化业务管理系统涵盖 **CRM 客户管理、销售管理、工单系统、项目管理、固定资产管理、HR 人事管理** 六大模块。通过 NocoBase 内置的「备份管理器」插件一键还原 `.nbdata` 备份文件即可拿到完整数据。

:::tip 前置阅读

- 已经有一个基础的 NocoBase 运行环境。主系统的安装见[官方安装文档](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- NocoBase 版本 **v2.1.0-alpha.40 及以上**(备份管理器插件从这个版本起开源,社区版可用)
- 已下载备份文件:[nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning 注意

- 本方案基于 **PostgreSQL 16** 制作,环境必须是 PostgreSQL 16
- **`DB_UNDERSCORED` 不能为 `true`** — 检查 `docker-compose.yml`,如果设置了 `true` 还原会失败
- **还原会覆盖当前应用的全部数据** — 如果目标环境已有数据,请先备份好当前应用,再谨慎执行还原操作

:::

当前版本采用**备份还原**形式部署,后续版本会换成增量迁移,方便接入已有的 NocoBase 系统。

---

## 操作步骤

### 第 1 步:用 `full` 镜像启动应用

强烈建议用 `full` 版本的 Docker 镜像,它内置了数据库客户端等所有配套程序,无需额外配置:

```bash
docker pull nocobase/nocobase:alpha-full
```

然后用这个镜像启动 NocoBase 服务。

:::tip

如果不用 `full` 镜像,可能需要在容器内手动安装 `pg_dump` 客户端,过程繁琐且不稳定。

:::

### 第 2 步:开启「备份管理器」插件

1. 登录 NocoBase 系统
2. 进入「插件管理」
3. 找到并启用「备份管理器」插件

### 第 3 步:从本地备份文件还原

1. 启用插件后刷新页面
2. 进入左侧菜单的「系统管理 / 备份管理器」

   ![备份管理器主界面](https://static-docs.nocobase.com/202510302154966.png)

3. 点击右上角的「从本地备份还原」按钮
4. 把下载的 `nocobase_all_in_one_backup_260521.nbdata` 文件拖拽到上传区域

   ![从本地备份文件还原(上传对话框)](https://static-docs.nocobase.com/202510302155602.png)

5. 点击「提交」,等还原完成,通常需要几十秒到几分钟

---

## 注意事项

- **数据库兼容性** — PostgreSQL 数据库版本、字符集、大小写敏感设置必须与备份源匹配,`schema` 名称尤其要一致
- **商业插件匹配** — 本地必须先开好备份里用到的所有商业插件,否则还原会中断。一体化方案涉及的商业插件包括:邮件管理、审计日志、AI 员工等。社区版缺这些插件时对应入口不显示,不影响其他模块

---

## 安装之后的必要配置

还原完成后系统已经能打开,但有两处配置是**指向我们演示环境的**,需要切换成自己的。

### 1. 文件存储引擎(OSS / 本地)

Demo 备份里默认的存储引擎指向我们演示用的阿里云 OSS,Access Key 不对外开放,任何附件字段、模板打印、AI 员工头像上传都会失败。

通常来说切到本地存储就够了,需要 CDN 加速或大文件场景再用自己的 OSS。

**切换步骤:**

1. 进入「插件管理 / 文件管理器」(或直接访问 `/admin/settings/file-manager`)

2. **选项 A — 用本地存储**(最简单,适合自部署):

   - 找到自动创建的「Local Storage(本地存储)」项
   - 点击「编辑」,在配置面板底部勾选「设为默认存储引擎」→ 提交

   ![存储引擎通用配置(底部"设为默认存储引擎")](https://static-docs.nocobase.com/20240529115151.png)

   :::warning 注意

   Docker 部署时本地存储在容器内,容器删除会丢文件。生产环境建议挂载 volume 或换云存储。

   :::

3. **选项 B — 用自己的 OSS / S3 / COS**:

   - 点击「添加新的」,选对应类型(阿里云 OSS / Amazon S3 / 腾讯云 COS / S3 Pro)
   - 填入 Access Key、Bucket、Region、域名等参数,勾选「设为默认存储引擎」,提交

   ![阿里云 OSS 存储引擎配置示例](https://static-docs.nocobase.com/20240712220011.png)

4. 删除或停用 Demo 预置的 OSS 项,避免误用

详细参数说明见[存储引擎概述](../../file-manager/storage/index.md)。

### 2. AI 员工的 LLM 服务密钥

Demo 备份预置了若干 LLM 服务条目(OpenAI、Claude、Gemini、DeepSeek、Qwen、Kimi 等),里面填的是我们的 API Key,**不会对外生效**。AI 员工功能在切换之前不可用。

**配置步骤:**

1. 进入「系统设置 / AI 员工 / LLM service」(或访问 `/admin/settings/ai/llm-services`)

   ![进入 LLM service 配置页面](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. 预置的服务列表里,可以拖拽排序,`Enabled` 开关启停

   ![LLM 服务列表(启停 + 排序)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. 对每一条打算用的服务:

   - 点击「编辑」
   - 把「API Key」替换成自己的密钥(从对应服务商账号获取:OpenAI、Anthropic、Google AI Studio、DeepSeek、Qwen、Kimi 等)
   - 如果走代理或国内中转,调整「Base URL」
   - 在「Enabled Models」中保留要用的模型,其他可去掉

   ![编辑 LLM 服务(API Key、Base URL、Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. 点击底部「Test flight」测试连通性,通过后「Submit」保存

   ![Test flight 测试连接](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. 不打算用的服务直接 Disabled 即可,不必删除

详细配置见[配置 LLM 服务](../../ai-employees/features/llm-service.md)。

:::tip

这两项是 Demo 还原后必改的两处。其他配置(站点 Logo、SMTP、企业版插件等)按需调整。

:::

---

## 常见问题

### 社区版能用吗?会不会报错?

可以直接用,不会报错。备份管理器从 `v2.1.0-alpha.40` 开始开源,社区版可装。Demo 里用到一些企业版插件(邮件管理、审计日志、AI 员工等),社区版缺这些插件时对应入口不会显示,不影响其他模块。比如审计日志入口会消失,但 CRM、销售、工单、项目、资产、HR 等核心模块完全正常。

### 还原后版本应该选哪个?

推荐用最新的 `alpha-full` 镜像(`nocobase/nocobase:alpha-full`)。`full` 镜像内置了数据库客户端等依赖,避免还原时缺工具。

### 还原后 Logo 不显示?

官网 Demo 的 Logo 配置了域名限制,本地域名加载不出来。进入「系统设置」重新上传自己的 Logo 即可。

### 文件上传报错(OSS Key 错误)?

Demo 备份预置的存储引擎指向我们演示用的 OSS,Key 不对外。进入「插件管理 / 文件管理器」,把「Local Storage(本地存储)」设为默认存储,保存后就能正常上传。

详细处理见上方[文件存储引擎](#1-文件存储引擎oss--本地)章节。

### 多语言切换?

一体化方案已经做了 20+ 语种的本地化(`nb_demo` 命名空间)。还原后默认中文,切到其他语言:「系统设置 / 启用对应语言」。

### 增量升级怎么办?

目前版本升级是全量替换,自定义修改会被覆盖。升级前务必备份。增量迁移方案正在规划中。
