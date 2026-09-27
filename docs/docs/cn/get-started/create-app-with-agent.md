---
title: 'AI Agent 创建应用指引'
description: '供 AI Agent 读取的 NocoBase 3 单应用创建、配置与启动指引。'
---

# AI Agent 创建应用指引

这份指引供 AI Agent 创建或启动 **NocoBase 3 单应用项目**。默认在用户当前空目录中初始化，并在同一个会话继续配置和启动。已有应用直接继续，不重复创建。

## 一、确认当前目录

确认当前工作目录就是用户希望存放应用的空目录。默认使用该目录，不额外创建一层 `my-app` 子目录。目录名将作为应用名称，需要以小写字母或数字开头，并仅包含小写字母、数字、点、连字符或下划线。

当前目录已有应用时，读取项目指引后继续。目录非空且不是目标应用，或目录名不符合规则时，向用户说明情况，让用户选择合适的空目录，不覆盖文件或自行搬动项目。

## 二、检查环境并创建项目

检查 Node.js 24 和 pnpm 11。缺少环境或版本不符时，先停下，不要开始创建。告诉用户检测到的版本和要求的版本，给出适合其操作系统的安装命令（优先使用用户已有的版本管理工具，例如 `nvm install 24`；pnpm 可用 `corepack enable && corepack prepare pnpm@11 --activate`），并提醒安装后重新打开终端。只有用户要求时才代为安装；继续之前重新检查两个版本。生成项目后，以其 `package.json` 指定的包管理器版本为准。

以下命令适用于 Linux / WSL 的 Bash 终端。假设当前会话目录为 `/work/my-app`，目标目录已经存在且为空：先检查环境，再将创建命令的执行目录设为 `/work`，目标名称设为 `my-app`。路径与名称按实际目录替换。

创建工具不接受 `.` 作为应用名称；从父目录指定当前目录名称，可以将文件直接生成到已有空目录。不要先在当前目录创建子项目再搬动文件。

```bash
node --version
pnpm --version
(cd /work && PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm --registry="${NOCOBASE_REGISTRY:-https://npm.nocobase.ai}" create @nocobase/app my-app --json)
```

NocoBase 3 的包（包括 `@nocobase/create-app`）目前发布在 `https://npm.nocobase.ai/`，不在公共 npm 上，直接执行 `pnpm create @nocobase/app` 会返回 404。写在 `create` 前面的 `--registry` 让 pnpm 从这里获取 `create-app`；之后 `create-app` 从同一个包源下载模板、安装依赖，并把这个包源写进项目的 `.npmrc`。不要修改用户的 pnpm 配置，例如不要执行 `pnpm config set @nocobase:registry`。`NOCOBASE_REGISTRY` 只在终端被指向其他包源（比如未发布的快照）时才会设置，`create-app` 也会读取它。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 对此次命令及其子进程生效，允许下载刚发布的版本。`--json` 不会交互提问，只在 stdout 输出一个 JSON 结果，其中的 `nextCommands` 就是接下来要执行的配置与启动命令。

不要因为找不到某个包而改用 NocoBase 2 的安装方式。

等待创建命令结束，检查项目是否生成、依赖是否安装、开发指引是否同步。失败时说明失败步骤并修复，不以目录存在作为创建完成的依据，也不要重复创建同一个项目。

## 三、在当前会话完成创建与启动

命令中的子 shell 只改变创建命令的执行目录，会话工作目录仍为原来的应用目录。创建成功后，主动读取新生成的 `AGENTS.md` 及相关开发指引，再继续配置；不要假定新指引已自动加载。

创建和启动完成后，建议用户在应用目录重新开启会话，再继续开发。NocoBase 会把开发用的 Skills 同步到项目目录的 `.agents/skills/`，它们是在当前会话开始之后才出现的，当前会话未必已经加载；新会话能可靠加载。用户坚持在当前会话继续时，按 `AGENTS.md` 的指引直接读取相关的 `.agents/skills/<name>/SKILL.md`，不要假定它们已经加载。应用就在当前会话目录时，结束会话后在同一目录重新开启即可。用户选择了其他应用目录时，给出实际路径和在那里启动 Agent 的命令，例如 `cd /work/my-app && claude`，并提示先结束当前会话；桌面客户端基于那个目录创建或打开项目，再新建会话。

## 四、确认数据库和配置

确认当前工作目录就是应用根目录，先读取 `AGENTS.md`、`package.json` 以及任务相关的本地开发指引。检查已有配置，继续完成尚未完成的操作。

用户已经指定数据库时直接使用；否则询问用户希望使用什么数据库，不替用户决定。常见选项包括 SQLite、PostgreSQL 和 MySQL：SQLite 使用本地文件；PostgreSQL 和 MySQL 需要可连接的数据库服务。用户需要其他数据库时，依据当前项目的数据库指引核对对应驱动和连接方式。

数据库类型由用户决定后，在应用目录中完成配置。使用 SQLite 无需安装任何东西，模板已依赖它的驱动：

```bash
pnpm nocobase config init --dialect sqlite --json
```

其他数据库需要先安装驱动，例如 `pnpm add @nocobase/db-postgres`，再用同样的命令指定该方言。`pnpm nocobase config init` 不安装任何东西，驱动缺失时它不写入任何文件，返回 `error.code` 为 `DRIVER_MISSING` 的失败结果，`error.suggestions[0].run` 就是对应的 `pnpm add`；执行它之后重新运行 `config init` 即可。配置文件中的方言名称不能代替驱动。`result.requiredSettings` 列出还是占位值的连接字段，接着用 `config set` 设置：

```bash
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm --json
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD --json
```

请用户把密码放进环境变量，再用 `--from-env` 传入变量名。不要在对话里索要密码，不要把密码写在命令行上，也不要打印完整配置。然后检查配置，这一步会实际连一次数据库：

```bash
pnpm nocobase config check --json
```

检查失败时，每个问题都附带可以直接执行的 `fix`。保留已有业务数据，不要通过删除数据库或配置文件来触发重新配置：对已配置的应用运行 `config init` 会报告 `status: "success-noop"`，只有用户明确要求替换配置时才使用 `--force`。生成的应用没有安装页面，配置完成之前 `pnpm dev` 会拒绝启动。

## 五、启动并给出登录方式

在应用根目录按项目脚本启动开发服务：

```bash
pnpm dev
```

`pnpm dev` 不会退出，需要在后台运行。检查实际输出的访问地址，并请求该地址确认页面可打开，例如用 `curl -I` 并期望得到成功响应。若需要安装或配置，先帮助用户完成，再检查登录页；不要将安装页面可打开报告为应用已经初始化完成。

完成后直接向用户提供：

- 应用目录和实际访问地址
- 首次登录使用的账号，以及密码从哪里获取
- 服务由 Agent 会话启动，会话结束后会随之停止；之后在应用目录执行 `pnpm dev` 重新启动
- 是否还存在未完成的配置或启动错误

如果模板使用初始管理员，账号为 `admin@nocobase.com`、密码为 `admin123`；核对生成项目的账号说明后再告知用户。若用户设置了自己的管理员，或使用已有数据库，按实际账号说明，不把模板默认值当成当前凭据。用户自设密码无需复述到对话中。

首次登录后提醒用户修改模板初始密码。接下来在应用目录开启新的会话，按[第一个功能](./first-feature)继续开发。
