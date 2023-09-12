# 编写第一个插件

在开始前，需要先安装好 NocoBase：

- [create-nocobase-app 安装](/welcome/getting-started/installation/create-nocobase-app)
- [Git 源码安装](/welcome/getting-started/installation/git-clone)

安装好 NocoBase 之后，我们就可以开始插件开发之旅了。

## 创建插件

通过 CLI 快速地创建一个空插件，命令如下：

```bash
yarn pm create @my-project/plugin-hello
```

插件所在目录 `packages/plugins/@my-project/plugin-hello`，插件目录结构为：

```bash
|- /packages/plugins/@my-project/plugin-hello
  |- /src
    |- /client      # 插件客户端代码
    |- /server      # 插件服务端代码
  |- client.d.ts
  |- client.js
  |- package.json   # 插件包信息
  |- server.d.ts
  |- server.js
```

访问插件管理器界面，查看刚添加的插件，默认地址为 http://localhost:13000/admin/pm/list/local/

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/b04d16851fc1bbc2796ecf8f9bc0c3f4.png" />

如果创建的插件未在插件管理器里显示，可以通过 `pm add` 命令手动添加

```bash
yarn pm add @my-project/plugin-hello
```

## 编写插件

查看 `packages/plugins/@my-project/plugin-hello/src/server/plugin.ts` 文件，并修改为：

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
      name: 'hello',
      fields: [{ type: 'string', name: 'name' }],
    });
    this.app.acl.allow('hello', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginHelloServer;
```

## 激活插件

**通过命令操作**

```bash
yarn pm enable @my-project/plugin-hello
```

**通过界面操作**

访问插件管理器界面，查看刚添加的插件，点击激活。
插件管理器页面默认为 http://localhost:13000/admin/pm/list/local/ 

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/7b7df26a8ecc32bb1ebc3f99767ff9f9.png" />

备注：插件激活时，会自动创建刚才编辑插件配置的 hello 表。

## 调试插件

如果应用未启动，需要先启动应用

```bash
# for development
yarn dev

# for production
yarn build
yarn start
```

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

## 构建并打包插件

```bash
yarn build plugins/@my-project/plugin-hello --tar

# 分步骤
yarn build plugins/@my-project/plugin-hello
yarn nocobase tar plugins/@my-project/plugin-hello
```

打包的插件默认保存路径为 `storage/tar/@my-project/plugin-hello.tar.gz`

## 上传至其他 NocoBase 应用

仅 v0.14 及以上版本支持

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/8aa8a511aa8c1e87a8f7ee82cf8a1359.gif" />
