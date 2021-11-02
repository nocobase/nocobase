---
order: 100
toc: menu
---

# 参与贡献

## 基本流程

- Fork 源码到自己的仓库
- 修改源码
- 提交 pull request

## 安装与启动

```bash
# 将以下 git 地址换成自己的 repo
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
yarn install
yarn bootstrap
yarn build
yarn nocobase init --import-demo
yarn start
```

浏览器内打开 http://localhost:8000/

<Alert title="注意">
参与核心代码开发，项目启动打开的是文档页，并非应用的登录页。
</Alert>

## 主要的 Scripts

### 启动与重启

以上命令只在第一次执行，之后重启项目只需要

```bash
yarn start
```

### 重新安装

如果想清空重新安装

```bash
# 如果需要导入 demo 数据，可以加上 --import-demo
yarn nocobase init --import-demo
# 重装之后，也需要重启
yarn start
```

### 打包编译

<Alert title="注意">

集成测试或全站调试时，涉及以下包的修改需要重新编译打包：

- actions
- database
- resourcer
- server
- test
- utils

除了编译的问题，项目的构建还有诸多细节问题未解决。如果你有一些不错的建议，欢迎你前往 [GitHub Discussions](https://github.com/nocobase/nocobase/discussions) 讨论。

</Alert>

```bash
# for all packages
yarn build

# for specific package
yarn build <package_name_1> <package_name_2>

# e.g.
# yarn build database
```

### 测试

<Alert title="注意">

升级 v0.5 之后，有部分测试还未修复，测试的 ci 暂时也不能用。代码测试还不够完善，更多测试会阶段性的补充并完善...

</Alert>

```bash
# For all packages
yarn test

# For specific package
yarn test packages/<name>
```

### 更多命令

查看 package.json 的 [scripts](https://github.com/nocobase/nocobase/blob/ff4d432c9fc3faa38cd65ab6d4dad250da02c2fd/package.json#L7)

## 文档修改和翻译

文档在 [docs](https://github.com/nocobase/nocobase/tree/develop/docs) 目录下，遵循 Markdown 语法，默认为英文，中文以 `.zh-CN.md` 结尾，如：

```bash
|- /docs/
  |- index.md # 英文文档
  |- index.zh-CN.md 中文文档，缺失时，显示为 index.md 的内容
```

修改之后，浏览器内打开 http://localhost:8000/ 查看最终效果。

## 后端代码修改

后端的大部分修改可以通过 test 命令校验。

```bash
yarn test packages/<name>
```

当然，如果是新增的内容，需要编写新的测试。`@nocobase/test` 提供了 `mockDatabase` 和 `mockServer` 用于数据库和服务器的测试，如：

```ts
import { mockServer, MockServer } from '@nocobase/test';

describe('mock server', () => {
  let api: MockServer;

  beforeEach(() => {
    api = mockServer({
      dataWrapping: false,
    });
    api.actions({
      list: async (ctx, next) => {
        ctx.body = [1, 2];
        await next();
      },
    });
    api.resource({
      name: 'test',
    });
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('agent.get', async () => {
    const response = await api.agent().get('/test');
    expect(response.body).toEqual([1, 2]);
  });

  it('agent.resource', async () => {
    const response = await api.agent().resource('test').list();
    expect(response.body).toEqual([1, 2]);
  });
});
```

## 全栈演示

http://localhost:8000/develop

为了方便开发者本地调试，全栈的演示也是内嵌的 Demo，可以点击左下角新标签页内全屏打开。

## 客户端组件

<Alert title="注意">
组件库还在整理中...
</Alert>

各组件是独立的，方便调试和使用。组件列表查看 http://localhost:8000/components

## 提供更完整的示例

<Alert title="注意">
示例还在整理中...
</Alert>

示例查看 http://localhost:8000/examples

