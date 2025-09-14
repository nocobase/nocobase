# NocoBase 插件目录结构

NocoBase 插件遵循标准的 npm 包结构，并具有特定的目录组织方式。

## 插件存储位置

开发中的插件存储在 `packages/plugins/` 目录下，按组织名分组：

```
packages/plugins/
├── @nocobase/          # 官方插件
│   ├── plugin-acl/
│   ├── plugin-users/
│   └── ...
├── @local/             # 本地开发插件
│   ├── plugin-hello/
│   └── ...
└── @my-project/        # 自定义项目插件
    ├── plugin-custom/
    └── ...
```

## 标准插件目录结构

一个完整的插件通常包含以下目录和文件：

```
plugin-name/
├── package.json              # npm 包配置文件
├── README.md                 # 插件说明文档
├── client.d.ts               # 客户端 TypeScript 声明文件
├── client.js                 # 客户端入口文件
├── server.d.ts               # 服务端 TypeScript 声明文件
├── server.js                 # 服务端入口文件
├── src/                      # 源代码目录
│   ├── client/               # 客户端代码
│   │   ├── index.tsx         # 客户端入口
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── components/       # React 组件
│   │   ├── locales/          # 国际化文件
│   │   └── schemas/          # Schema 配置
│   └── server/               # 服务端代码
│       ├── index.ts          # 服务端入口
│       ├── actions/          # 自定义操作
│       ├── collections/      # 数据表定义
│       ├── models/           # 数据模型
│       ├── repositories/     # 数据仓库
│       ├── routes/           # 路由配置
│       ├── services/         # 业务服务
│       ├── middleware/       # 中间件
│       ├── migrations/       # 数据库迁移文件
│       └── locales/          # 国际化文件
├── dist/                     # 编译后的代码
└── __tests__/                # 测试文件
```

## package.json 配置

插件的 `package.json` 文件包含以下重要配置：

```json
{
  "name": "@my-project/plugin-custom",
  "version": "1.0.0",
  "main": "./dist/server/index.js",
  "displayName": "Custom Plugin",
  "displayName.zh-CN": "自定义插件",
  "description": "A custom NocoBase plugin",
  "description.zh-CN": "一个自定义的 NocoBase 插件",
  "dependencies": {
    // 运行时依赖
  },
  "devDependencies": {
    // 开发时依赖
  },
  "peerDependencies": {
    "@nocobase/client": "1.x",
    "@nocobase/server": "1.x"
  }
}
```

## 客户端目录结构

客户端代码通常包含以下结构：

```
client/
├── index.tsx                 # 客户端入口文件
├── hooks/                    # 自定义 Hooks
│   ├── useCustomHook.ts
│   └── index.ts
├── components/               # React 组件
│   ├── CustomComponent.tsx
│   ├── CustomComponent.Schema.tsx
│   └── index.ts
├── locales/                  # 国际化文件
│   ├── en-US.json
│   ├── zh-CN.json
│   └── index.ts
└── schemas/                  # Schema 配置
    ├── custom-schema.ts
    └── index.ts
```

## 服务端目录结构

服务端代码通常包含以下结构：

```
server/
├── index.ts                  # 服务端入口文件
├── actions/                  # 自定义操作
│   ├── custom-action.ts
│   └── index.ts
├── collections/              # 数据表定义
│   ├── custom-collection.ts
│   └── index.ts
├── models/                   # 数据模型
│   ├── custom-model.ts
│   └── index.ts
├── repositories/             # 数据仓库
│   ├── custom-repository.ts
│   └── index.ts
├── routes/                   # 路由配置
│   ├── custom-route.ts
│   └── index.ts
├── services/                 # 业务服务
│   ├── custom-service.ts
│   └── index.ts
├── middleware/               # 中间件
│   ├── custom-middleware.ts
│   └── index.ts
├── migrations/               # 数据库迁移文件
│   ├── 20230101000000-custom-migration.ts
│   └── index.ts
└── locales/                  # 国际化文件
    ├── en-US.ts
    ├── zh-CN.ts
    └── index.ts
```

## 测试目录结构

测试文件通常组织如下：

```
__tests__/
├── client/                   # 客户端测试
│   ├── components/
│   ├── hooks/
│   └── index.test.ts
├── server/                   # 服务端测试
│   ├── actions/
│   ├── collections/
│   ├── models/
│   ├── repositories/
│   └── index.test.ts
└── integration/              # 集成测试
    ├── api.test.ts
    └── ui.test.ts
```

## 最佳实践

1. **命名规范**：
   - 插件名使用 `plugin-` 前缀
   - 目录名与包名保持一致
   - 使用 kebab-case 命名法

2. **文件组织**：
   - 将相关功能组织在单独的目录中
   - 使用 index.ts 文件导出模块
   - 保持目录结构清晰和一致

3. **代码分离**：
   - 客户端和服务端代码严格分离
   - 公共代码提取到共享目录
   - 避免循环依赖

4. **国际化**：
   - 为所有用户界面文本提供国际化支持
   - 使用标准的 i18n 文件组织方式
