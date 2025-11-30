# 安装和使用说明

## 安装插件

1. 将插件目录 `packages/plugins/@nocobase/plugin-block-tabs` 复制到你的nocobase项目的 `packages/plugins/@nocobase/` 目录下

2. 安装依赖：
   ```bash
   cd /path/to/nocobase
   yarn install --legacy-peer-deps
   ```

3. 构建插件（跳过TypeScript类型定义以避免构建问题）：
   ```bash
   yarn build @nocobase/plugin-block-tabs --no-dts
   ```

4. 在nocobase的插件配置中启用此插件：
   - 在nocobase管理界面中进入插件管理
   - 找到 "Block Tabs" 插件并启用

或者在代码中启用：
```javascript
// 在你的应用配置中
import PluginBlockTabsClient from '@nocobase/plugin-block-tabs';

app.plugin(PluginBlockTabsClient);
```

## 使用方法

1. 进入页面设计模式
2. 点击页面上的 "Add block" 按钮
3. 选择 "Other blocks" > "Block Tabs"
4. 系统会创建一个默认包含两个标签页的BlockTabs组件
5. 每个标签页默认包含一个Grid布局，你可以在其中添加各种区块（如表格、表单等）
6. 使用右上角的设置按钮可以添加更多标签页或配置现有标签页

## 功能特点

- **标签页管理**：可以动态添加、删除和重命名标签页
- **区块组织**：每个标签页可以包含多个区块，支持拖拽排序
- **响应式设计**：在移动设备上自动适配
- **设计模式支持**：完整的可视化设计和配置功能
- **多语言支持**：支持国际化

## 架构说明

该插件基于nocobase的schema系统实现：

- `BlockTabs`: 主组件，继承自Antd的Tabs组件
- `BlockTabsInitializer`: 初始化器，用于在页面中添加BlockTabs
- `blockTabsSettings`: 配置面板，支持添加标签页等操作
- 每个标签页都是一个独立的schema节点，可以包含多个子区块

这样设计的优势是充分利用了nocobase现有的架构，保持了与现有区块系统的完全兼容性。
