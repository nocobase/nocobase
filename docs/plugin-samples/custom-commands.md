# 自定义命令行示例

本文档将详细介绍如何在 NocoBase 插件中创建自定义命令行工具和迁移脚本。

## 命令行基础

### 命令结构

NocoBase 命令行工具基于 [yargs](https://yargs.js.org/) 构建，每个命令都需要实现特定的接口。

### 基本命令创建

```typescript
// src/server/commands/hello.ts
import { Command } from '@nocobase/server';

export default class HelloCommand extends Command {
  protected async main() {
    this.log('Hello, NocoBase!');
  }
}
```

### 带参数的命令

```typescript
// src/server/commands/greet.ts
import { Command } from '@nocobase/server';

export default class GreetCommand extends Command {
  public static description = '向用户问候';
  
  public static flags = {
    name: {
      type: 'string',
      description: '用户名称',
      default: 'World',
    },
  };
  
  protected async main() {
    const { flags } = this.parse(GreetCommand);
    this.log(`Hello, ${flags.name}!`);
  }
}
```

## 注册命令

### 在插件中注册命令

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import HelloCommand from './commands/hello';
import GreetCommand from './commands/greet';

export class CustomCommandsPlugin extends Plugin {
  async load() {
    // 注册命令
    this.app.command('hello', HelloCommand);
    this.app.command('greet', GreetCommand);
  }
}
```

### 使用命令

```bash
# 运行基本命令
npx nocobase hello

# 运行带参数的命令
npx nocobase greet --name=NocoBase
```

## 数据库迁移命令

### 创建迁移命令

```typescript
// src/server/commands/migrate-posts.ts
import { Command } from '@nocobase/server';

export default class MigratePostsCommand extends Command {
  public static description = '迁移文章数据';
  
  protected async main() {
    this.log('开始迁移文章数据...');
    
    try {
      // 获取数据库实例
      const db = this.app.db;
      
      // 执行迁移逻辑
      const posts = await db.getRepository('oldPosts').find();
      
      for (const post of posts) {
        await db.getRepository('posts').create({
          values: {
            title: post.title,
            content: post.content,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
          },
        });
        
        this.log(`已迁移文章: ${post.title}`);
      }
      
      this.log(`迁移完成，共迁移 ${posts.length} 篇文章`);
    } catch (error) {
      this.error(`迁移失败: ${error.message}`);
    }
  }
}
```

### 带选项的迁移命令

```typescript
// src/server/commands/migrate-with-options.ts
import { Command } from '@nocobase/server';

export default class MigrateWithOptionsCommand extends Command {
  public static description = '带选项的数据迁移';
  
  public static flags = {
    limit: {
      type: 'number',
      description: '每次迁移的记录数',
      default: 100,
    },
    force: {
      type: 'boolean',
      description: '强制覆盖已存在的数据',
      default: false,
    },
  };
  
  protected async main() {
    const { flags } = this.parse(MigrateWithOptionsCommand);
    
    this.log(`开始迁移数据，每次处理 ${flags.limit} 条记录`);
    
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const oldRecords = await this.app.db.getRepository('oldTable').find({
        limit: flags.limit,
        offset,
      });
      
      if (oldRecords.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const record of oldRecords) {
        // 检查是否已存在
        if (!flags.force) {
          const existing = await this.app.db.getRepository('newTable').findOne({
            filter: { oldId: record.id },
          });
          
          if (existing) {
            this.log(`跳过已存在的记录: ${record.id}`);
            continue;
          }
        }
        
        // 创建新记录
        await this.app.db.getRepository('newTable').create({
          values: {
            oldId: record.id,
            name: record.name,
            value: record.value,
          },
        });
        
        this.log(`已迁移记录: ${record.id}`);
      }
      
      offset += flags.limit;
    }
    
    this.log('数据迁移完成');
  }
}
```

## 定时任务命令

### 创建定时任务命令

```typescript
// src/server/commands/scheduled-task.ts
import { Command } from '@nocobase/server';

export default class ScheduledTaskCommand extends Command {
  public static description = '定时任务示例';
  
  public static flags = {
    interval: {
      type: 'number',
      description: '执行间隔（分钟）',
      default: 60,
    },
  };
  
  protected async main() {
    const { flags } = this.parse(ScheduledTaskCommand);
    
    this.log(`启动定时任务，每 ${flags.interval} 分钟执行一次`);
    
    // 执行任务逻辑
    await this.performTask();
    
    // 如果需要持续运行
    if (flags.interval > 0) {
      setInterval(async () => {
        this.log('执行定时任务');
        await this.performTask();
      }, flags.interval * 60 * 1000);
    }
  }
  
  private async performTask() {
    try {
      // 任务逻辑
      this.log('执行任务中...');
      
      // 例如：清理过期数据
      const count = await this.app.db.getRepository('sessions').destroy({
        filter: {
          updatedAt: {
            $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时前
          },
        },
      });
      
      this.log(`清理了 ${count} 条过期会话`);
    } catch (error) {
      this.error(`任务执行失败: ${error.message}`);
    }
  }
}
```

## 数据导出命令

### CSV导出命令

```typescript
// src/server/commands/export-csv.ts
import { Command } from '@nocobase/server';
import { createWriteStream } from 'fs';
import { stringify } from 'csv-stringify';

export default class ExportCSVCommand extends Command {
  public static description = '导出数据为CSV格式';
  
  public static flags = {
    table: {
      type: 'string',
      description: '要导出的表名',
      required: true,
    },
    file: {
      type: 'string',
      description: '输出文件路径',
      default: 'export.csv',
    },
  };
  
  protected async main() {
    const { flags } = this.parse(ExportCSVCommand);
    
    this.log(`导出表 ${flags.table} 到 ${flags.file}`);
    
    try {
      // 获取数据
      const records = await this.app.db.getRepository(flags.table).find();
      
      // 创建CSV写入流
      const writer = createWriteStream(flags.file);
      const stringifier = stringify({
        header: true,
        columns: Object.keys(records[0] || {}),
      });
      
      stringifier.pipe(writer);
      
      // 写入数据
      for (const record of records) {
        stringifier.write(record.toJSON());
      }
      
      stringifier.end();
      
      this.log(`导出完成，共导出 ${records.length} 条记录`);
    } catch (error) {
      this.error(`导出失败: ${error.message}`);
    }
  }
}
```

## 数据导入命令

### CSV导入命令

```typescript
// src/server/commands/import-csv.ts
import { Command } from '@nocobase/server';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

export default class ImportCSVCommand extends Command {
  public static description = '从CSV文件导入数据';
  
  public static flags = {
    table: {
      type: 'string',
      description: '要导入的表名',
      required: true,
    },
    file: {
      type: 'string',
      description: 'CSV文件路径',
      required: true,
    },
  };
  
  protected async main() {
    const { flags } = this.parse(ImportCSVCommand);
    
    this.log(`从 ${flags.file} 导入数据到表 ${flags.table}`);
    
    try {
      const records = [];
      
      // 读取CSV文件
      const parser = createReadStream(flags.file).pipe(parse({
        columns: true,
        skip_empty_lines: true,
      }));
      
      for await (const record of parser) {
        records.push(record);
      }
      
      // 批量导入数据
      let successCount = 0;
      let errorCount = 0;
      
      for (const record of records) {
        try {
          await this.app.db.getRepository(flags.table).create({
            values: record,
          });
          successCount++;
        } catch (error) {
          this.warn(`导入记录失败: ${JSON.stringify(record)}, 错误: ${error.message}`);
          errorCount++;
        }
      }
      
      this.log(`导入完成，成功: ${successCount}, 失败: ${errorCount}`);
    } catch (error) {
      this.error(`导入失败: ${error.message}`);
    }
  }
}
```

## 系统维护命令

### 数据库备份命令

```typescript
// src/server/commands/backup.ts
import { Command } from '@nocobase/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default class BackupCommand extends Command {
  public static description = '备份数据库';
  
  public static flags = {
    path: {
      type: 'string',
      description: '备份文件路径',
      default: './backups',
    },
  };
  
  protected async main() {
    const { flags } = this.parse(BackupCommand);
    
    this.log(`开始备份数据库到 ${flags.path}`);
    
    try {
      // 创建备份目录
      await execPromise(`mkdir -p ${flags.path}`);
      
      // 根据数据库类型执行备份命令
      const config = this.app.db.options;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${flags.path}/backup-${timestamp}.sql`;
      
      let backupCommand = '';
      
      switch (config.dialect) {
        case 'mysql':
          backupCommand = `mysqldump -h ${config.host} -u ${config.username} -p${config.password} ${config.database} > ${filename}`;
          break;
        case 'postgres':
          backupCommand = `pg_dump -h ${config.host} -U ${config.username} ${config.database} > ${filename}`;
          break;
        default:
          this.error('不支持的数据库类型');
          return;
      }
      
      await execPromise(backupCommand);
      
      this.log(`备份完成: ${filename}`);
    } catch (error) {
      this.error(`备份失败: ${error.message}`);
    }
  }
}
```

### 清理缓存命令

```typescript
// src/server/commands/clear-cache.ts
import { Command } from '@nocobase/server';

export default class ClearCacheCommand extends Command {
  public static description = '清理系统缓存';
  
  protected async main() {
    this.log('开始清理系统缓存');
    
    try {
      // 清理应用缓存
      await this.app.cache.reset();
      
      // 清理特定缓存
      const cacheKeys = await this.app.cache.keys();
      for (const key of cacheKeys) {
        await this.app.cache.del(key);
      }
      
      this.log(`缓存清理完成，共清理 ${cacheKeys.length} 个缓存项`);
    } catch (error) {
      this.error(`缓存清理失败: ${error.message}`);
    }
  }
}
```

## 插件管理命令

### 插件状态命令

```typescript
// src/server/commands/plugin-status.ts
import { Command } from '@nocobase/server';

export default class PluginStatusCommand extends Command {
  public static description = '显示插件状态';
  
  protected async main() {
    this.log('插件状态:');
    
    const plugins = this.app.pm.list();
    
    for (const plugin of plugins) {
      const status = plugin.installed 
        ? (plugin.enabled ? '已启用' : '已禁用') 
        : '未安装';
      
      this.log(`- ${plugin.name}: ${status}`);
    }
  }
}
```

### 插件操作命令

```typescript
// src/server/commands/plugin-manager.ts
import { Command } from '@nocobase/server';

export default class PluginManagerCommand extends Command {
  public static description = '插件管理命令';
  
  public static args = [
    {
      name: 'action',
      description: '操作类型 (install|uninstall|enable|disable)',
      required: true,
    },
    {
      name: 'plugin',
      description: '插件名称',
      required: true,
    },
  ];
  
  protected async main() {
    const { args } = this.parseArgs();
    
    const [action, pluginName] = args;
    
    try {
      switch (action) {
        case 'install':
          await this.app.pm.install(pluginName);
          this.log(`插件 ${pluginName} 安装成功`);
          break;
          
        case 'uninstall':
          await this.app.pm.uninstall(pluginName);
          this.log(`插件 ${pluginName} 卸载成功`);
          break;
          
        case 'enable':
          await this.app.pm.enable(pluginName);
          this.log(`插件 ${pluginName} 启用成功`);
          break;
          
        case 'disable':
          await this.app.pm.disable(pluginName);
          this.log(`插件 ${pluginName} 禁用成功`);
          break;
          
        default:
          this.error(`不支持的操作: ${action}`);
      }
    } catch (error) {
      this.error(`操作失败: ${error.message}`);
    }
  }
}
```

## 命令测试

### 编写命令测试

```typescript
// src/server/__tests__/commands/hello.test.ts
import { createApp } from '@nocobase/server';
import HelloCommand from '../commands/hello';

describe('HelloCommand', () => {
  let app;
  
  beforeEach(async () => {
    app = await createApp();
  });
  
  afterEach(async () => {
    await app.destroy();
  });
  
  it('should output hello message', async () => {
    const command = new HelloCommand(app);
    const logSpy = jest.spyOn(command, 'log');
    
    await command.main();
    
    expect(logSpy).toHaveBeenCalledWith('Hello, NocoBase!');
  });
});
```

## 最佳实践

1. **命名规范**：使用清晰的命令名称和描述
2. **参数验证**：验证命令参数的有效性
3. **错误处理**：正确处理和报告错误
4. **日志记录**：记录重要操作和进度
5. **性能考虑**：对于大量数据操作，考虑分批处理
6. **安全性**：验证用户权限，防止未授权操作
7. **文档说明**：为复杂命令提供详细的使用说明

## 下一步

- 学习 [缓存](./caching.md) 示例
- 掌握 [服务器中间件](./middleware.md) 示例
