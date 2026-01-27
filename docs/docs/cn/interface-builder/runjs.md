# 在线编写 & 运行 JS

在 NocoBase 中，**RunJS** 提供了一种轻量级的扩展方式，适合 **快速实验、临时逻辑处理** 的场景，无需创建插件或修改源码，即可通过 JavaScript 实现界面或交互的个性化定制。

通过它，你可以直接在界面设计器中输入 JS 代码，实现：

- 自定义渲染内容（字段、区块、列、项等）  
- 自定义交互逻辑（按钮点击、事件联动）  
- 结合上下文数据，实现动态行为  

## 支持的场景

### JS 区块

通过 JS 自定义渲染区块，可完全控制区块的结构与样式。  
适合展示自定义组件、统计图表、第三方内容等高度灵活的场景。

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

文档：[JS 区块](/interface-builder/blocks/other-blocks/js-block)

### JS 操作

通过 JS 自定义操作按钮的点击逻辑，可执行任意前端或 API 请求操作。  
例如：动态计算值、提交自定义数据、触发弹窗等。

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

文档：[JS 操作](/interface-builder/actions/types/js-action)

### JS 字段

通过 JS 自定义字段的渲染逻辑。 可根据字段值动态显示不同样式、内容或状态。

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

文档：[JS 字段](/interface-builder/fields/specific/js-field)

### JS 项

通过 JS 渲染独立项，不绑定具体字段。常用于展示自定义信息块。

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

文档：[JS 项](/interface-builder/fields/specific/js-item)

### JS 表格列

通过 JS 自定义表格列的渲染。  
可实现复杂的单元格展示逻辑，如进度条、状态标签等。

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

文档：[JS 表格列](/interface-builder/fields/specific/js-column)

### Linkage rules（联动规则）

在表单或页面中通过 JS 控制字段间的联动逻辑。  
例如：当一个字段变化时动态修改另一个字段的值或可见性。

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

文档：[联动规则](/interface-builder/linkage-rule)

### Eventflow（事件流）

通过 JS 自定义事件流的触发条件与执行逻辑，构建更复杂的前端交互链路。

![](https://static-docs.nocobase.com/20251031092755.png)  

文档：[事件流](/interface-builder/event-flow)
