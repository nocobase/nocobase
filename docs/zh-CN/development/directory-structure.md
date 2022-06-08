# 目录结构

## 应用脚手架

```bash
$ yarn create nocobase-app my-nocobase-app
```

通过 `create-nocobase-app` 创建的应用脚手架目录结构如下：

```bash
├── my-nocobase-app
  ├── packages        # 采用 Monorepo 的方式管理代码，将不同模块划分到不同包里
    ├── app
      ├── client      # 客户端模块
      ├── server      # 服务端模块
    ├── plugins       # 插件目录
  ├── storage        # 用于存放数据库文件、附件、缓存等
    ├── db
  ├── .env            # 环境变量
  ├── .buildrc.ts     # packages 的打包配置，支持 cjs、esm 和 umd 三种格式的打包。
  ├── jest.config.js
  ├── jest.setup.ts
  ├── lerna.json
  ├── package.json
  ├── tsconfig.jest.json
  ├── tsconfig.json
  ├── tsconfig.server.json
```

### packages 目录

```bash
├── packages
  ├── app
    ├── client
      ├── public
      ├── src
        ├── pages
          ├── index.tsx
      ├── .umirc.ts
      ├── package.json
    ├── server
      ├── src
        ├── config
        ├── index.ts
      ├── package.json
  ├── /plugins
    ├── my-plugin
      ├── src
      ├── package.json
```

NocoBase 采用 Monorepo 的方式管理代码，将不同模块划分到不同包里。

- `app/client` 为应用的客户端模块，基于 [umi](https://umijs.org/zh-CN) 构建；
- `app/server` 为应用的服务端模块；
- `plugins/*` 目录里可以放各种插件。

### storages 目录

用于存放数据库文件、附件、缓存等。

### .env 文件

环境变量。

### .buildrc.ts 文件

packages 的打包配置，支持 cjs、esm 和 umd 三种格式的打包。

## 插件脚手架

```bash
$ yarn nocobase create-plugin my-plugin
```

通过 `nocobase create-plugin` 初始化的插件脚手架目录如下：

```bash
├── my-nocobase-app
  ├── packages
    ├── plugins
      ├── my-plugin
        ├── src
          ├── client
          ├── server
        ├── package.json
```
