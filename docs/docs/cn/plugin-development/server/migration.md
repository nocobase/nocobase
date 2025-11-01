# Migration 升级脚本

在 NocoBase 插件的开发与更新过程中，插件的数据库结构或配置可能会发生不兼容的变化。为了保证升级的平滑执行，NocoBase 提供了 **Migration** 机制，通过编写 migration 文件来处理这些变更。本文将带你系统了解 Migration 的使用方法和开发流程。

## Migration 的概念

Migration 是插件升级时自动执行的脚本，用于解决以下问题：

- 数据表结构调整（新增字段、修改字段类型等）
- 数据迁移（如字段值的批量更新）
- 插件配置或内部逻辑更新

Migration 的执行时机分为三类：

| 类型 | 触发时机 | 执行场景 |
|------|----------|----------|
| `beforeLoad` | 所有插件配置加载前 |
| `afterSync`  | 数据表配置与数据库同步之后（表结构已变更） |
| `afterLoad`  | 所有插件配置加载后 |

## 创建 Migration 文件

Migration 文件应放在插件目录下的 `src/server/migrations/*.ts` 中。NocoBase 提供 `create-migration` 命令快速生成 migration 文件。

```bash
yarn nocobase create-migration [options] <name>
```

可选参数

| 参数 | 说明 |
|------|------|
| `--pkg <pkg>` | 指定插件包名 |
| `--on [on]`  | 指定执行时机，可选 `beforeLoad`、`afterSync`、`afterLoad` |

示例

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

生成的 migration 文件路径如下：

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

文件初始内容：

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // 在这里编写升级逻辑
  }
}
```

> ⚠️ `appVersion` 用于标识升级所针对的版本，小于指定版本的环境会执行该 migration。

## 编写 Migration

在 Migration 文件中，你可以通过 `this` 访问以下常用属性和 API，方便操作数据库、插件及应用实例：

常用属性

- **`this.app`**  
  当前 NocoBase 应用实例。可用于访问全局服务、插件或配置。  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  数据库服务实例，提供对模型（Tables）操作的接口。  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  当前插件实例，可用于访问插件的自定义方法。  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelize 实例，可直接执行原生 SQL 或事务操作。  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize 的 QueryInterface，常用于修改表结构，例如新增字段、删除表等。  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

编写 Migration 示例

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // 使用 queryInterface 添加字段
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // 使用 db 访问数据模型
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // 执行 plugin 的自定义方法
    await this.plugin.customMethod();
  }
}
```

除了上面列出的常用属性，Migration 还提供丰富的 API，详细文档请参考 [Migration API](/api/server/migration)。

## 触发 Migration

Migration 的执行由 `nocobase upgrade` 命令触发：

```bash
$ yarn nocobase upgrade
```

升级时，系统会根据 Migration 的类型和 `appVersion` 判断执行顺序。

## 测试 Migration

在插件开发中，建议使用 **Mock Server** 测试 migration 是否正确执行，避免破坏真实数据。

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // 插件名称
      version: '0.18.0-alpha.5', // 升级前版本
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // 编写验证逻辑，例如检查字段是否存在、数据是否迁移成功
  });
});
```

> Tip: 使用 Mock Server 可以快速模拟升级场景，并对 Migration 执行顺序和数据变更进行验证。

## 开发实践建议

1. **拆分 Migration**  
   每次升级尽量生成一个 migration 文件，保持原子性，便于排查问题。
2. **指定执行时机**  
   根据操作对象选择 `beforeLoad`、`afterSync` 或 `afterLoad`，避免依赖未加载的模块。
3. **注意版本控制**  
   使用 `appVersion` 明确 migration 适用的版本，防止重复执行。
4. **测试覆盖**  
   在 Mock Server 上验证 migration 后，再在真实环境中执行升级。
