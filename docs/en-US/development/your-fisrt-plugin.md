# 编写第一个插件

在此之前，需要先安装好 NocoBase：

- [create-nocobase-app 安装](/getting-started/installation/create-nocobase-app)
- [Git 源码安装](/getting-started/installation/git-clone)

安装好 NocoBase 之后，我们就可以开始插件开发之旅了。

## 创建插件

首先，你可以通过 CLI 快速的创建一个空插件，命令如下：

```bash
yarn pm create hello
```

插件所在目录 `packages/plugins/hello`，插件目录结构为：

```bash
|- /hello
  |- /src
    |- /client      # 插件客户端代码
    |- /server      # 插件服务端代码
  |- client.d.ts
  |- client.js
  |- package.json   # 插件包信息
  |- server.d.ts
  |- server.js
```

package.json 信息

```json
{
  "name": "@nocobase/plugin-hello",
  "version": "0.1.0",
  "main": "lib/server/index.js",
  "devDependencies": {
    "@nocobase/client": "0.8.0-alpha.1",
    "@nocobase/test": "0.8.0-alpha.1"
  }
}
```

NocoBase 插件也是 NPM 包，插件名和 NPM 包名的对应规则为 `${PLUGIN_PACKAGE_PREFIX}-${pluginName}`。

`PLUGIN_PACKAGE_PREFIX` 为插件包前缀，可以在 .env 里自定义，[点此查看 PLUGIN_PACKAGE_PREFIX 说明](/api/env#plugin_package_prefix)。

## 编写插件

查看 `packages/plugins/hello/src/server/plugin.ts` 文件，并修改为：

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class HelloPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
      name: 'hello',
      fields: [
        { type: 'string', name: 'name' }
      ],
    });
    this.app.acl.allow('hello', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default HelloPlugin;
```

## 注册插件

```bash
yarn pm add hello
```

## 激活插件

插件激活时，会自动创建刚才编辑插件配置的 hello 表。

```bash
yarn pm enable hello
```

## 启动应用

```bash
# for development
yarn dev

# for production
yarn build
yarn start
```

## 体验插件功能

向插件的 hello 表里插入数据

```bash
curl --location --request POST 'http://localhost:13000/api/hello:create' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Hello world"
}'
```

查看 hello 表数据

```bash
curl --location --request GET 'http://localhost:13000/api/hello:list'
```
