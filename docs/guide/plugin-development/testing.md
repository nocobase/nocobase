---
order: 5
---

# 测试

测试开始前：

1. `const app = mockServer()`
2. 通过 `app.plugin()` 注册插件
3. 执行 `app.load()` 载入配置
4. 执行 `app.install({ clean: true })` 安装，这里是统一安装
   1. `app.clean()` 清理旧配置、数据表等
   2. 如果后续有其他插件，单个插件的安装 `app.pm.install('xx')`
5. 启动应用 `app.start()`

测试结束后：

1. 停止应用 `app.stop()`
2. 删除应用 `app.destroy()`

## 示例

```ts
class MyPlugin extends Plugin {}

describe('plugin test', () => {

  let app: Application;

  beforeEach(async () => {
    app = mockServer();
    app.plugin(MyPlugin);
    app.load();
    // await app.clean();
    await app.install({ clean: true });
    await app.start();
  });

  test('case 1', () => {
    // 测试用例
  });

  afterEach(async () => {
    await app.stop();
    await app.destroy();
  });
});
```
