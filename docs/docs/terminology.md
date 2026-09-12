# NocoBase Documentation Translation Terminology

## Core Terms (保持原文或固定翻译)

### Product & Brand
- NocoBase → NocoBase (不翻译)
- FlowEngine → 事件流引擎 / FlowEngine (不翻译)

### Technical Terms
- 工作流 → Workflow
- 触发器 → Trigger
- 节点 → Node
- 数据源 → Data Source
- 数据表 → Collection
- 字段 → Field
- 操作 → Action
- 多应用 → Multi-app
- 空间 → Workspace
- 多空间 → Multi-workspace
- 界面配置 → Interface Configuration
- 关系字段 → Association Field / Relationship Field
- 反向关系字段标识 → Inverse field name

### Database Terms
- 一对一 → One-to-One (O2O)
- 一对多 → One-to-Many (O2M)
- 多对一 → Many-to-One (M2O)
- 多对多 → Many-to-Many (M2M)
- 外部数据库 → External Database

### Field Types (字段类型)
- 单行文本 → Single Line Text
- 多行文本 → Long Text
- 整数 → Integer
- 数字 → Number
- 百分比 → Percentage
- 日期 → Date
- 时间 → Time
- 邮箱 → Email
- 电话 → Phone
- 颜色 → Color
- 图标 → Icon
- 附件 → Attachment
- 勾选 → Checkbox
- 单选框 → Radio Group
- 复选框 → Checkbox group
- 下拉菜单（单选） → Single select
- 下拉菜单（多选） → Multiple Select
- 关联字段 → Association
- JSON → JSON
- 富文本 → Rich Text
- 自动编码 → Sequence
- 数据表选择器 → Collection selector
- 加密 → Encryption

### UI Components
- 表格 → Table
- 表单 → Form
- 图表 → Chart
- 列表 → List
- 网格卡片 → Grid Card
- 筛选 → Filter

### Workflow Terms
- 执行计划 → Execution / Execution Plan
- 执行历史 → Execution History
- 版本管理 → Version Management / Revision
- 条件判断 → Condition / Conditional
- 循环 → Loop
- 延迟 → Delay
- 审批 → Approval
- 并行分支 → Parallel Branch
- 同步 → Synchronous
- 异步 → Asynchronous

### Actions
- 新增 → Add New
- 编辑 → Edit
- 删除 → Delete
- 查看 → View
- 提交 → Submit
- 打印 → Print
- 复制 → Duplicate

### Common UI Terms
- 可编辑模式 → Edit Mode / Editable Mode
- 阅读模式 → Read-only Mode / View Mode
- 字段配置 → Field Configuration
- 界面配置 → Interface Configuration / UI Configuration
- 快速上手 → Quick Start / Getting Started
- 概述 → Overview
- 介绍 → Introduction
- 安装 → Installation
- 配置 → Configuration
- 使用场景 → Use Cases / Scenarios
- 示例 → Example
- 下一步 → Next Steps

## Translation Guidelines

1. **Keep consistency**: 同一术语在整个文档中保持一致翻译
2. **Technical accuracy**: 技术术语使用业界标准翻译
3. **Natural English**: 避免中式英语,使用地道表达
4. **Code & URLs**: 代码块、图片URL、链接路径保持不变
5. **Markdown format**: 保持原有的Markdown格式、缩进、换行
6. **Front matter**: YAML front matter保持格式,翻译其中的文本内容
7. **Image paths**: 图片路径 (https://static-docs.nocobase.com/...) 保持不变
8. **Internal links**: 内部链接路径完全相同,只翻译链接文本
   - ❌ 错误: `[配置 LLM 服务](/cn/ai-employees/quick-start/llm-service)` → `[Configure LLM Service](/en/ai-employees/quick-start/llm-service)`
   - ✅ 正确: `[配置 LLM 服务](/ai-employees/quick-start/llm-service)` → `[Configure LLM Service](/ai-employees/quick-start/llm-service)`
   - 链接路径 `/ai-employees/quick-start/llm-service` 保持不变
   - 只翻译显示文本: "配置 LLM 服务" → "Configure LLM Service"
9. **Professional tone**: 使用专业、简洁的技术文档语气
10. **Acronyms**: 首次出现时可用 "中文翻译 (Acronym)" 格式,之后直接用缩写

## Cultural Localization Guidelines

### Content to Remove/Adapt (Unless Plugin-Specific):

1. **Chinese Cloud Service Mirrors**: Remove Aliyun/Tencent mirror URLs in installation commands
   - ❌ `apt-get install -o Acquire::http::Proxy="http://mirrors.aliyun.com"`
   - ✅ Use default international sources

2. **Docker Images**: Remove Chinese registry mirrors
   - ❌ `image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full`
   - ✅ `image: nocobase/nocobase:latest-full`
   - Remove all `registry.cn-shanghai.aliyuncs.com/` prefixes
   - Use Docker Hub official images directly

3. **Chinese Software Examples**: Replace with international equivalents
   - ❌ "类似于微信/钉钉的功能"
   - ✅ "Similar to Slack or Microsoft Teams"

3. **China-Specific Context**: Remove or internationalize
   - ❌ "在中国,很多企业使用..."
   - ✅ "Many businesses use..." or use international context

4. **Chinese Brand References**: Remove unless relevant
   - ❌ Using Chinese companies as examples (unless it's a case study)
   - ✅ Use international brands or generic examples

### Content to KEEP:

1. **Plugin Integration Docs**: Keep Chinese service references in these docs:
   - DingTalk Authentication (`auth-dingtalk`)
   - WeCom Authentication (`auth-wecom`)
   - Aliyun OSS Storage (`storage-aliyun-oss`)
   - Tencent COS Storage (`storage-tencent-cos`)
   - China Region Field (`field-china-region`)
   - SMS plugins for Chinese providers

2. **Technical References**: Keep technical integrations with Chinese services when they are valid features

### PluginInfo Handling:

When encountering `<PluginInfo name="plugin-name"></PluginInfo>`:
1. Extract the plugin name
2. Remove the tag from content
3. Add to frontmatter: `pkg: "@nocobase/plugin-{name}"`
4. Place frontmatter at the very top of the document



## Common Phrases

- 无需额外安装或配置 → No additional installation or configuration required
- 内置插件 → Built-in plugin
- 可视化界面 → Visual interface
- 业务逻辑 → Business logic
- 生产环境 → Production environment
- 系统能力 → System capabilities
- 自定义 → Custom / Customize
- 扩展 → Extend / Extension
- 集成 → Integration / Integrate
- 部署 → Deployment / Deploy
- 升级 → Upgrade
- 版本 → Version
- 发布 → Release / Publish
- 开发者 → Developer
- 最佳实践 → Best Practices
- 注意事项 → Notes / Important Notes
- 常见问题 → FAQ / Common Issues
