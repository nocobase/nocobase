# nb app design intent

`nb app` related commands are essentially adaptations based on different process management methods, and then unified into a set of stable application management entrances. The purpose of this is to try to converge the mental usage during daily operation and maintenance to a set of commands.

Currently, the application process management methods supported by CLI mainly include:

- Docker
-PM2

If we need to support more methods in the future, such as Supervisor, we will continue to make adaptations at this layer. The high-frequency command entrance exposed to the outside world remains the same:

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## Why should we unify it into `nb app`

Process management can be implemented in many ways, but for most users, what they really care about is not what is used at the bottom layer, but the specific actions of "I want to start the application", "I want to read the log", and "I want to upgrade the application".

If the underlying differences are directly exposed, users need to first determine which operating mode they are currently using, and then remember the corresponding set of operating methods. After being unified into `nb app`, these high-frequency actions can converge into a set of stable entrances.

### Reduce learning costs

Different process management solutions operate in different ways:

- Docker has Docker’s command system
- PM2 has PM2 command system
- Supervisor also has its own configuration method

If these differences are directly exposed, users will need to learn multiple usage methods, and it will be easier to miss key steps in high-frequency scenarios such as upgrades, restarts, and log troubleshooting.

After unification as `nb app`, most daily management only requires mastering one set of commands.

### Unify business processes

Application lifecycle management is not just about process management.

In processes such as starting, upgrading, and stopping, the CLI often needs to handle additional logic, such as:

- Environmental inspection
- Configuration processing
- Data migration
- Version upgrade
- Log management

By using `nb app` as a unified entrance, you can ensure that the behaviors of these processes are consistent. If you continue to expand your capabilities in the future, you do not need to relearn a new operation and maintenance entrance.

## Why is `nb app autostart` still needed?

After having a unified process management entrance, another layer of "self-starting management" capability needs to be added to make the entire process complete. This is why `nb app autostart` exists.

Common usage is:

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

The focus of this set of orders is to continue to maintain unity externally. In other words, in the user's mind at this layer of `nb app`, you don't need to care whether the bottom layer is Docker, PM2, or other methods that may be supported in the future. The external unified operation method is still similar to:

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` What does this layer adapt to?

`nb app autostart` is also divided into two levels of responsibilities:

- `enable` / `disable` are responsible for managing whether a certain env allows automatic startup
- `run` is responsible for pulling up all envs that have self-starting enabled during the system startup phase.

In other words, the CLI will also provide a unified `run` entry to provide access to the system's self-starting mechanism:

```bash
nb app autostart run
```

What is adapted here are system startup mechanisms such as `systemd`, `launchd`, and host startup scripts, not application process managers such as Supervisor.

## Overall

- `nb app` related commands are essentially an adaptation layer on top of different process management methods. After being unified externally, they can reduce the user's mental confusion.
- The implementation of process management can be Docker, PM2, Supervisor, etc. Currently, Docker and PM2 are supported
- Because the self-start configurations of different process management methods are different, a unified set of `nb app autostart` capabilities is needed for the entire process to be complete.

If you want to continue to see daily operations, you can go directly to [Manage Application](../operations/manage-app.md). If you are ready to deploy the application to the formal environment, you can continue to see [Production Environment Deployment](../production/index.md).
