# `nb proxy` 的设计意图

`nb proxy` 的目的，是把原本比较复杂的入口层流程，用一组更简单、更稳定的命令提供给用户。

如果只聊最核心的流程，先记住这 3 条命令就够了：

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

大多数场景下，你用 `nb proxy` 做的事，本质上就是这 3 步：

1. 先用 `use` 选定当前 provider 的运行方式
2. 再用 `generate` 按 env 和域名生成入口配置
3. 最后用 `reload` 让配置生效

如果你用的是 Caddy，把命令里的 `nginx` 换成 `caddy` 就行。

`use local` 和 `use docker` 也可以直接这样记：

- 本地已经安装好了 Nginx 或 Caddy，就用 `use local`
- 本地没有安装，准备让 CLI 用 Docker 管理代理，就用 `use docker`

这也是 `nb proxy` 这一层最想提供的体验：你不需要先钻进 Nginx 或 Caddy 的配置细节里，先按固定流程把入口接起来就行。

## 为什么先记这 3 条就够了

因为 `nb proxy` 解决的问题其实很收敛：**给应用接一个稳定的对外访问入口。**

如果你已经看过 [生产环境部署概述](../production/index.md)，可以把它和 `nb app autostart` 这样分开记：

- `nb app autostart` 管的是“机器重启后，应用怎么恢复运行”
- `nb proxy` 管的是“应用怎么通过 Nginx 或 Caddy 稳定对外提供访问”

所以在最常见的部署流程里，`nb proxy` 并不需要一大串心智。多数时候就是：

- 选运行方式
- 生成配置
- 重载生效

够了。

## 这 3 步分别在做什么

### `use`

`use` 解决的是“当前准备按哪种方式管理代理”。

比如：

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

最简单的判断方式就是：

- 本地已经安装好了 Nginx 或 Caddy，就用 `use local`
- 本地没有安装，就用 `use docker`

你也可以把它理解成先选好当前 provider 的默认运行方式。后面 `start`、`reload`、`status` 这些命令，就按这套方式去工作。

### `generate`

`generate` 解决的是“按当前 env，把入口配置渲染出来”。

比如：

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

这一步会把 env 里的信息和入口层需要的参数拼起来，生成一份可用的代理配置。这里最关键的输入通常就是：

- `--env`：要暴露哪个 CLI 托管 env
- `--host`：要绑定到哪个域名

也就是说，`generate` 管的是配置产物，不是进程状态。

### `reload`

`reload` 解决的是“让刚生成的配置真正生效”。

```bash
nb proxy nginx reload
```

这样拆开有一个直接好处：配置生成和进程动作不会混在一起。你改了域名、端口或者公开路径时，先重新生成，再决定让它生效，整个过程会更清楚。

## 为什么要设计成 `use → generate → reload`

因为这 3 步刚好对应了入口层最稳定的 3 个动作：

- 先决定怎么运行代理
- 再决定为哪个 env 生成什么入口
- 最后再让配置生效

如果把这些步骤都塞进一个黑盒命令里，表面上看命令变少了，但一旦出问题，你很难判断到底是 driver 选错了、配置没生成对，还是代理还没 reload。

现在这样拆开之后，排查路径也会更直：

- `use` 不对，就切 driver
- `generate` 不对，就重生成配置
- 配置已经对了但还没生效，就 `reload`

## 这层设计的优势是什么

`nb proxy` 的优势，不只是统一 Nginx 和 Caddy 的命令形式，更重要的是把入口层的高频动作做成可组合流程。

比如你可以直接从代理入口出发：

```bash
nb proxy nginx generate --env test2 --reload
```

也可以从应用配置出发：

```bash
nb env update --env test2 --app-port 13000 --proxy-generate --proxy-reload
```

这两个例子对应的是两种很常见的起点：

- 你已经知道自己在改入口层，那就直接 `generate --reload`
- 你先改的是 env，那就顺手触发 `--proxy-generate --proxy-reload`

不过最后都会落到同一套稳定流程里：更新配置，生成入口，让代理生效。

## 为什么还需要单独的 `nb proxy`

因为 `nb proxy` 想统一掉的，不是某一个 Nginx 配置文件，而是入口层的常见动作。

你真正关心的通常不是：

- 配置文件到底落在哪个路径
- Nginx 和 Caddy 的命令差异
- local 和 docker 的操作差异

你更关心的是：

- 我怎么把这个 env 暴露出去
- 我怎么改域名
- 我怎么让新配置生效

`nb proxy` 就是把这些动作收敛成同一套 CLI 入口。这样你先记住核心流程，就已经能覆盖大多数场景。只有当你要继续排查细节，或者需要特殊配置时，再往下看 provider 自己的页面就行。

## 总体来说

- `nb proxy` 最核心的使用心智，就是 `use → generate → reload`
- 对大多数用户来说，先记住这 3 条命令就够了
- 它的设计重点不是隐藏一切细节，而是先把最常见的入口层流程固定下来

如果你想继续看具体命令，可以直接去 [`nb proxy`](../../api/cli/proxy/index.md)。如果你已经准备接正式入口，也可以继续看 [反向代理](../production/reverse-proxy/index.md)。
