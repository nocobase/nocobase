# nb app 的设计意图

`nb app` 相关命令，本质上是在不同进程管理方式之上做适配，然后对外统一成一组稳定的应用管理入口。这样做的目的，是尽量把日常运维时的使用心智收敛到一套命令上。

目前，CLI 支持的应用进程管理方式主要包括：

- Docker
- PM2

如果后续需要支持更多方式，比如 Supervisor，也会继续在这一层做适配。对外暴露的高频命令入口仍然保持一致：

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## 为什么要统一成 `nb app`

进程管理的实现方式可以很多，但对大多数用户来说，真正关心的不是底层到底用了什么，而是“我要启动应用”“我要看日志”“我要升级应用”这些具体动作。

如果直接把底层差异暴露出来，用户就需要先判断自己当前用的是哪一种运行方式，再记住对应的一套操作方式。统一成 `nb app` 之后，这些高频动作就可以收敛成一组稳定入口。

### 降低学习成本

不同进程管理方案的操作方式并不相同：

- Docker 有 Docker 的命令体系
- PM2 有 PM2 的命令体系
- Supervisor 也有自己的配置方式

如果直接暴露这些差异，用户就需要学习多套使用方式，而且在升级、重启、日志排查这些高频场景里，比较容易漏掉关键步骤。

统一为 `nb app` 之后，大多数日常管理都只需要掌握一套命令。

### 统一业务流程

应用生命周期管理并不仅仅是进程管理。

在启动、升级、停止这些流程中，CLI 往往还需要顺手处理额外逻辑，比如：

- 环境检查
- 配置处理
- 数据迁移
- 版本升级
- 日志管理

通过 `nb app` 作为统一入口，可以保证这些流程行为一致，后续如果继续扩展能力，也不需要让你重新学习新的运维入口。

## 为什么还需要 `nb app autostart`

有了统一的进程管理入口之后，还需要再补上一层“自启动管理”能力，整个流程才完整。这也是 `nb app autostart` 存在的原因。

常见用法是：

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

这组命令的重点，是继续对外保持统一。也就是说，在 `nb app` 这一层的使用心智里，你不需要关心底层到底是 Docker、PM2，还是未来可能支持的其他方式。对外统一的操作方式仍然类似于：

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` 这一层适配的是什么

`nb app autostart` 还分成两层职责：

- `enable` / `disable` 负责管理某个 env 是否允许自动启动
- `run` 负责在系统启动阶段，统一拉起所有已开启自启动的 env

也就是说，CLI 还会提供一个统一的 `run` 入口，给系统自启动机制接入：

```bash
nb app autostart run
```

这里适配的是 `systemd`、`launchd`、宿主机启动脚本这一类系统启动机制，并不是 Supervisor 这一类应用进程管理器。

## 总体来说

- `nb app` 相关命令，本质上是不同进程管理方式之上的适配层，对外统一后可以降低用户心智
- 进程管理的实现可以是 Docker、PM2、Supervisor 等等，目前支持 Docker 和 PM2
- 因为不同进程管理方式的自启动配置并不相同，所以还需要一套统一的 `nb app autostart` 能力，整个流程才完整

如果你想继续看日常操作，可以直接去 [管理应用](../operations/manage-app.md)。如果你已经准备把应用部署到正式环境，可以继续看 [生产环境部署](../production/index.md)。
