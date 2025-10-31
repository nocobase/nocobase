# 插件开发概述

NocoBase 采用 **微内核架构**，核心仅负责插件的生命周期调度、依赖管理和基础能力封装。所有业务功能都以插件形式提供。因此，理解插件的组织结构、生命周期与管理方式，是定制化 NocoBase 的第一步。

## 核心理念

- **即插即用**：可按需安装、启用或停用插件，无需修改代码即可灵活组合业务功能。  
- **前后端一体**：插件通常同时包含服务端与客户端实现，确保数据逻辑与界面交互的一致性。

## 插件基础结构

每个插件都是独立的 npm 包，通常包含如下目录结构：

```bash
plugin-hello/
├─ package.json          # 插件名称、依赖与 NocoBase 插件元信息
├─ client.js             # 前端编译产物，供运行时加载
├─ server.js             # 服务端编译产物，供运行时加载
├─ src/
│  ├─ client/            # 客户端源码，可注册区块、操作、字段等
│  └─ server/            # 服务端源码，可注册资源、事件、命令行等
```

## 目录约定与加载顺序

NocoBase 默认会扫描以下目录以加载插件：

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # 源码开发中的插件（优先级最高）
└── storage/
    └── plugins/          # 已编译的插件，例如上传或发布的插件
```

- `packages/plugins`：用于本地开发的插件目录，支持实时编译与调试。  
- `storage/plugins`：存放已编译好的插件，如商业版或第三方插件。

## 插件生命周期与状态

一个插件通常经历以下阶段：

1. **创建（create）**：通过 CLI 创建插件模板。  
2. **拉取（pull）**：下载插件包至本地，但尚未写入数据库。  
3. **启用（enable）**：首次启用时执行“注册 + 初始化”；再次启用仅加载逻辑。  
4. **停用（disable）**：停止插件运行。  
5. **卸载（remove）**：从系统中彻底移除插件。

:::tip

- `pull` 仅负责下载插件包，真正的安装过程由首次 `enable` 触发。  
- 若插件仅被 `pull` 而未启用，将不会被加载。

:::

### CLI 命令示例

```bash
# 1. 创建插件骨架
yarn pm create @my-project/plugin-hello

# 2. 拉取插件包（下载或链接）
yarn pm pull @my-project/plugin-hello

# 3. 启用插件（首次启用会自动安装）
yarn pm enable @my-project/plugin-hello

# 4. 停用插件
yarn pm disable @my-project/plugin-hello

# 5. 卸载插件
yarn pm remove @my-project/plugin-hello
```

## 插件管理界面

在浏览器中访问插件管理器，可直观地查看与管理插件：

**默认地址：** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![插件管理器](https://static-docs.nocobase.com/20251030195350.png)
