**Server** 是 NocoBase 的应用服务入口，提供一个可基于 NocoBase 低代码框架启动的应用服务容器。

应用启动后除了拥有基于框架快速提供服务的能力，也可以通过内置的插件机制安装各类插件为应用扩展更多的功能。

快速开始
----------

<!-- TODO: docker 使用方式 -->

### Docker

如果需要直接启动一个无代码应用服务，使用 Docker 是最容易的方式。

~~~shell
docker run nocobase/server
~~~

### Node 应用

~~~shell
npm install @nocobase/server
~~~

在应用入口文件（例如 `server.js`）中：

~~~JavaScript
const Server = require('@nocobase/server');

const app = new Server({
  basePath: process.env.BASE_PATH,
  database: process.env.DATABASE_URL
});

app.listen(3000); // start http server
~~~

启动应用：

~~~shell
node server.js
~~~

Server 继承自 Koa，所以实例也可以作为其他 Koa 应用的中间件使用。

### 深度定制

NocoBase 对开发者是透明的，你可以直接 clone 仓库代码进行更复杂的扩展或定制，以实现特定业务场景的功能。

插件
----------

插件是对 NocoBase 进行扩展的机制，插件通常是一段可执行的代码，在进程启动的时被自动加载（热插拔机制将在未来提供），在加载同时会注入插件可以使用的应用上下文对象，以便对应用进行扩展。

### 加载和初始化

NocoBase 将自动加载以下规则的插件：

<!-- TODO -->
