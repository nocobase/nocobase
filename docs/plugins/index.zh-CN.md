---
title: 概述
nav:
  title: 插件
  order: 4
---

# 插件

## 插件管理器 <Badge>待完善</Badge>

<Alert title="注意">
暂时还不能通过 CLI 的方式管理插件，这部分还在设计开发中。
</Alert>

开发可以通过命令行下载、激活、禁用、移除插件，对应的命令行有：

```bash
# 下载插件，可以通过 --enable 参数快速激活
yarn nocobase pm:download <plugin-name> --enable
# 激活插件
yarn nocobase pm:enable <plugin-name>
# 禁用插件
yarn nocobase pm:disable <plugin-name>
# 移除插件
yarn nocobase pm:remove <plugin-name>
```

## 已有的插件列表

<Alert title="注意">
目前的插件都是服务端插件，客户端的扩展暂时都以 [组件](components) 的形式存在。怎么把前后端的东西动态的结合起来形成完整的插件，还待进一步思考。
</Alert>

核心插件

- [@nocobase/plugin-collections](plugins/collections)  
  提供 HTTP API 的方式管理数据表和字段
- [@nocobase/plugin-permissions](plugins/permissions)  
  权限模块（服务端）
- [@nocobase/plugin-users](plugins/users)  
  用户模块（服务端）
- [@nocobase/plugin-client](plugins/client)  
  客户端插件，为 server 提供 GUI，将 @nocobase/server 和 @nocobase/client 连接起来
- [@nocobase/plugin-ui-schema](plugins/ui-schema)  
  将客户端 SchemaComponent 的 Schema 存储在服务端，以实现按需动态输出
- [@nocobase/plugin-ui-router](plugins/ui-router)  
  客户端路由表，将客户端 route config 存储在服务端，以实现按需动态输出

其他插件

- [@nocobase/plugin-action-logs](plugins/action-logs)  
  操作日志
- [@nocobase/plugin-file-manager](plugins/file-manager)  
  文件管理器
- [@nocobase/plugin-china-region](plugins/china-region)  
  中国行政区，字段扩展
- [@nocobase/plugin-export](plugins/export)  
  导出插件
- [@nocobase/plugin-system-settings](plugins/system-settings)  
  系统信息配置
- [@nocobase/plugin-multi-apps](plugins/multi-apps)  
  动态多应用，简易的 SaaS 插件
- [@nocobase/plugin-notifications](plugins/notifications)  
  通知模块（半成品），暂时只支持邮件发送，没有可视化界面
- [@nocobase/plugin-automations](plugins/automations)  
  自动化模块（暂不可用）
