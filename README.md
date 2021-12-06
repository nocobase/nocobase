# NocoBase 事件

事件是被动的，由执行某个方法触发的一种行为。

Application 的安装、启动、停止触发的事件，挂在 app.on 下，有：

- init
- start
- stop
- error（Koa 内置）

不区分前后？

全局的 resource action，也是 app.on 层面的事件

- users.login

配置 collection，db.on 层面的事件

- afterDefineCollection
- afterUpdateCollection
- afterRemoveCollection
- afterAddField
- afterRemoveField


app.on

application 的安装、启动、停止等

- init
- start
- stop
- error（Koa 内置）

resource 的 actions

- `<actionHookType>`
- `<resourceName>.<actionHookType>`

db.on

- afterDefineCollection
- afterUpdateCollection
- afterRemoveCollection
- afterAddField
- afterUpdateField
- afterRemoveField
- `<modelHookType>`
- `<modelName>.<modelHookType>`

collection.on

- afterAddField
- afterUpdateField
- afterRemoveField





1. 初始化 app.constructor
2. 注册插件 app.plugin
3. 加载配置 app.load
4. 安装 app.init
5. 启动 app.start
6. 停止 app.stop


生产环境需要：


DB_DIALECT=sqlite
DB_STORAGE=db.sqlite
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=13306
# DB_DATABASE=nocobase
# DB_USER=nocobase
# DB_PASSWORD=nocobase
DB_LOG_SQL=


## APP_LANG <Badge>server</Badge>

zh-CN 和 en-US，初始化时使用

## NOCOBASE_ENV <Badge>server</Badge>

production 和 development

## API_PORT <Badge>server</Badge>

用于设定 API 端口

## API_BASE_PATH <Badge>server</Badge>

resourcer 的 api prefix，默认值 /api/

## API_BASE_URL <Badge>client</Badge>

缺失时，使用 API_BASE_PATH 补齐

## ~~API_HOSTNAME <Badge>client</Badge>~~

可以去掉

## PROXY_TARGET <Badge>client</Badge>

本地开发时有用，默认为 http://localhost:${API_PORT}，如果是远程的 API 时才需要修改

